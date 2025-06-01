import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { secureStorage, validateFile } from '@/lib/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/db';

// Initialize Google's Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY!);

// Configure route to handle file uploads
export const routeSegmentConfig = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  console.log('[API /api/ocr-upload] Received request');
  try {
    // HIPAA compliance: Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a mock file object (compatible with our storage utils)
    const fileObj = {
      buffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
    };

    // Validate the file
    try {
      validateFile(fileObj);
    } catch (error: any) {
      return new NextResponse(error.message, { status: error.statusCode || 400 });
    }

    // Store the file securely with encryption
    const storedFile = await secureStorage.storeFile(fileObj, user.id);

    // Enhanced AI prompt for better data extraction
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Analyze this lab report image and extract all health-related data in the following JSON format:
      {
        "tests": [{
          "name": "Test name (e.g., Hemoglobin, Glucose)",
          "value": "Test value (as number)",
          "unit": "Measurement unit (e.g., g/dL, mg/dL)",
          "referenceRange": "Normal range (e.g., 12.0-15.5 g/dL)",
          "flag": "H for high, L for low, or null if normal",
          "category": "Test category or panel name (e.g., CBC, METABOLIC)"
        }],
        "patientInfo": {
          "collectionDate": "Test collection date if available (YYYY-MM-DD format)"
        },
        "metadata": {
          "labName": "Name of the laboratory",
          "confidence": "Overall confidence score from 0-1"
        }
      }
      
      IMPORTANT INSTRUCTIONS:
      1. Focus ONLY on test results, values, and ranges
      2. Ignore patient identifying information except collection date
      3. Use standardized units when possible
      4. Categorize results by test panels (CBC, Metabolic, etc.)
      5. Return only valid JSON
    `;

    // Convert image to base64
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;

    // Process with AI
    const result = await model.generateContent([
      { text: prompt },
      { 
        inlineData: {
          data: base64Image,
          mimeType
        }
      }
    ]);

    const geminiResponse = await result.response;
    const ocrText = geminiResponse.text(); // Capture raw OCR text

    // Extract JSON from the response
    const jsonMatch = ocrText.match(/\{[\s\S]*\}/); // Use ocrText here
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    // Parse the extracted JSON with error handling
    let reportData;
    try {
      reportData = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse JSON from AI response:', e);
      return new NextResponse('Invalid data format returned from AI processing', { status: 500 });
    }

    // Sanitize metadata before storing (HIPAA compliance)
    const sanitizedMetadata = secureStorage.sanitizeMetadata(reportData.metadata || {});

    // Save report to database - using only fields present in the schema
    const report = await prisma.report.create({
      data: {
        userId: user.id,
        type: 'BLOOD_TEST',
        fileName: file.name,
        filePath: storedFile.filePath,
        // Store the parsed data as a string
        parsedData: JSON.stringify(reportData.tests || []),
        // The createdAt field will be set automatically
      }
    });

    // Return the processed data
    console.log('[API /api/ocr-upload] Processing successful, returning data:', { 
      success: true, 
      reportId: report.id,
      testCount: reportData.tests?.length || 0,
      confidence: reportData.metadata?.confidence || 'unknown',
      needsReview: (reportData.metadata?.confidence || 0) < 0.8,
      tests: reportData.tests,
      ocrText: ocrText,
      patientName: reportData.metadata?.patient_name, 
      labName: reportData.metadata?.lab_name 
    });
    return NextResponse.json({ 
      success: true, 
      reportId: report.id,
      testCount: reportData.tests?.length || 0,
      confidence: reportData.metadata?.confidence || 'unknown',
      needsReview: (reportData.metadata?.confidence || 0) < 0.8,
      patientName: reportData.metadata?.patient_name, // Pass patient_name
      labName: reportData.metadata?.lab_name, // Pass lab_name
      tests: reportData.tests?.map((t: any) => ({
        name: t.name,
        value: t.value,
        unit: t.unit,
        flag: t.flag,
        referenceRange: t.reference_range, // Pass reference_range
        itemConfidence: t.confidence_score // Pass per-item confidence_score
      })),
      ocrText: ocrText // Add raw OCR text to the actual response
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, // Ensure success flag is explicitly false on error
        error: 'Failed to process upload', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500 }
    );
  }
}
