import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateFile, UploadError } from '@/lib/storage/upload-utils';
import { promises as fs } from 'fs';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { PDFParseResult } from '@/src/lib/claims/types/claims.types';

// Define route configuration for Next.js App Router
export const dynamic = 'force-dynamic'; // Disable static optimization
export const runtime = 'nodejs'; // Use Node.js runtime

/**
 * Helper functions for text extraction from PDF documents
 */
function extractField(text: string, fieldName: string, delimiter: string = '\n'): string | undefined {
  const regex = new RegExp(`${fieldName}\\s*([^${delimiter}]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractInsuranceInfo(text: string): { 
  insuranceCompany?: string; 
  memberId?: string; 
  groupNumber?: string; 
  planType?: string;
} {
  const insuranceCompany = extractField(text, 'Insurance Company:|Insurance Provider:|Carrier:', ':');
  const memberId = extractField(text, 'Member ID:|ID #:|Subscriber ID:|Policy Number:', ':');
  const groupNumber = extractField(text, 'Group Number:|Group #:|Group:', ':');
  const planType = extractField(text, 'Plan Type:|Plan:|Type:', ':');
  
  return {
    insuranceCompany,
    memberId,
    groupNumber,
    planType
  };
}

function extractPatientInfo(text: string): {
  patientName?: string;
  patientDOB?: string;
  patientAddress?: string;
  patientPhone?: string;
} {
  const nameRegex = /(Patient|Name)\s*:\s*([^\n,]+)/i;
  const nameMatch = text.match(nameRegex);
  const patientName = nameMatch ? nameMatch[2].trim() : undefined;
  
  const dobRegex = /(DOB|Date of Birth)\s*:\s*([^\n,]+)/i;
  const dobMatch = text.match(dobRegex);
  const patientDOB = dobMatch ? dobMatch[2].trim() : undefined;
  
  const addressRegex = /(Address|Location)\s*:\s*([^\n]+)/i;
  const addressMatch = text.match(addressRegex);
  const patientAddress = addressMatch ? addressMatch[2].trim() : undefined;
  
  const phoneRegex = /(Phone|Tel|Contact)\s*:\s*([^\n,]+)/i;
  const phoneMatch = text.match(phoneRegex);
  const patientPhone = phoneMatch ? phoneMatch[2].trim() : undefined;
  
  return {
    patientName,
    patientDOB,
    patientAddress,
    patientPhone
  };
}

function extractProviderInfo(text: string): {
  providerName?: string;
  providerNPI?: string;
  facilityName?: string;
} {
  const providerRegex = /(Provider|Doctor|Physician)\s*:\s*([^\n,]+)/i;
  const providerMatch = text.match(providerRegex);
  const providerName = providerMatch ? providerMatch[2].trim() : undefined;
  
  const npiRegex = /(NPI|Provider ID)\s*:\s*([\d\-]+)/i;
  const npiMatch = text.match(npiRegex);
  const providerNPI = npiMatch ? npiMatch[2].trim() : undefined;
  
  const facilityRegex = /(Facility|Hospital|Clinic|Location)\s*:\s*([^\n,]+)/i;
  const facilityMatch = text.match(facilityRegex);
  const facilityName = facilityMatch ? facilityMatch[2].trim() : undefined;
  
  return {
    providerName,
    providerNPI,
    facilityName
  };
}

function extractClaimInfo(text: string): {
  claimNumber?: string;
  dateOfService?: string;
  diagnosis?: string[];
  cptCodes?: string[];
  totalAmount?: string;
} {
  const claimNumber = extractField(text, 'Claim #:|Claim Number:|Claim ID:', ':');
  
  const dosRegex = /(Date of Service|Service Date)\s*:\s*([^\n,]+)/i;
  const dosMatch = text.match(dosRegex);
  const dateOfService = dosMatch ? dosMatch[2].trim() : undefined;
  
  // Find diagnosis codes (ICD-10)
  const diagnosisMatches = text.match(/(Diagnosis|ICD|ICD-10)\s*:?\s*([A-Z0-9.,\s]+)/ig);
  const diagnosis = diagnosisMatches ? 
    diagnosisMatches.map(match => match.replace(/(Diagnosis|ICD|ICD-10)\s*:?\s*/i, '').trim())
      .filter(code => /^[A-Z0-9.]+$/.test(code.replace(/\s/g, ''))) : [];
  
  // Find CPT codes
  const cptMatches = text.match(/(CPT|Procedure|Service|Code)\s*:?\s*([0-9]{5})/ig);
  const cptCodes = cptMatches ? 
    cptMatches.map(match => match.replace(/(CPT|Procedure|Service|Code)\s*:?\s*/i, '').trim())
      .filter(code => /^[0-9]{5}$/.test(code)) : [];
  
  const amountRegex = /(Total|Amount|Charge|Fee)\s*:\s*\$?\s*([\d.,]+)/i;
  const amountMatch = text.match(amountRegex);
  const totalAmount = amountMatch ? amountMatch[2].trim().replace(/[^\d.]/g, '') : undefined;
  
  return {
    claimNumber,
    dateOfService,
    diagnosis: diagnosis.length > 0 ? diagnosis : undefined,
    cptCodes: cptCodes.length > 0 ? cptCodes : undefined,
    totalAmount
  };
}

function parsePDFContent(text: string): PDFParseResult {
  const insurance = extractInsuranceInfo(text);
  const patient = extractPatientInfo(text);
  const provider = extractProviderInfo(text);
  const claim = extractClaimInfo(text);
  
  return {
    insurance,
    patient,
    provider,
    claim,
    rawText: text
  };
}

/**
 * Main POST handler for PDF parsing
 */
export async function POST(request: NextRequest) {
  console.log('POST handler called in /api/pdf-processing route');
  
  try {
    // Check authentication in production but allow in development
    if (process.env.NODE_ENV !== 'development') {
      const session = await getServerSession(authOptions);
      if (!session) {
        console.log('Authentication required');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    console.log('Processing formData from request...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('No file found in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log(`Received file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // File validation
    try {
      validateFile(file, {
        maxSize: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: ['application/pdf']
      });
    } catch (error) {
      console.error('File validation error:', (error as UploadError).message);
      return NextResponse.json(
        { error: (error as UploadError).message },
        { status: 400 }
      );
    }

    // Create unique filename to prevent collisions
    const uniqueFilename = `${uuidv4()}-${file.name}`;
    
    // Define paths for both temp and permanent storage
    const tempDir = path.join(process.cwd(), 'temp');
    const uploadsDir = path.join(process.cwd(), 'uploads', 'claims');
    
    // Ensure directories exist
    [tempDir, uploadsDir].forEach(dir => {
      if (!existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        mkdirSync(dir, { recursive: true });
      }
    });
    
    // Write to temp location first
    const tempPath = path.join(tempDir, uniqueFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(tempPath, buffer);
    console.log(`PDF saved to temp location: ${tempPath}`);
    
    // Copy to permanent location
    const uploadPath = path.join(uploadsDir, uniqueFilename);
    await fs.copyFile(tempPath, uploadPath);
    console.log(`PDF copied to permanent location: ${uploadPath}`);
    
    // Parse the PDF content
    console.log('Parsing PDF content...');
    const data = await fs.readFile(tempPath);
    const pdfData = await pdfParse(data);
    console.log(`PDF parsed successfully. Text length: ${pdfData.text.length} chars`);
    
    // Extract structured data from the text content
    const parsedData: PDFParseResult = parsePDFContent(pdfData.text);
    
    // Remove the temp file
    try {
      await fs.unlink(tempPath);
      console.log(`Temp file removed: ${tempPath}`);
    } catch (err) {
      console.error('Error removing temp file:', err);
      // Non-critical error, continue processing
    }
    
    return NextResponse.json({
      success: true,
      message: 'PDF processed successfully',
      data: parsedData,
      fileName: uniqueFilename,
      uploadPath: `/uploads/claims/${uniqueFilename}`,
      textLength: pdfData.text.length,
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Return helpful information for GET requests
 */
export async function GET() {
  return NextResponse.json({ 
    message: 'PDF Processing API is running. Use POST with multipart/form-data to upload PDF files for claim processing.' 
  });
}
