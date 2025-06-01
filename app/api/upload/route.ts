import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { FileProcessor, type ParserResult, type ReportType } from "@/lib/parsers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
// Import PDF parser for server-side
import pdfParse from "pdf-parse";

// Maximum file size in MB
const MAX_FILE_SIZE_MB = 10;

// Type for the parsed data that we'll store in the database
type StoredReportData = {
  type: ReportType;
  metadata: {
    parsedAt: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    lastModified: number;
    labName?: string;
    testDate?: string | Date;
    [key: string]: any;
  };
  [key: string]: any;
};

// Type guard to check if a string is a valid ReportType
function isReportType(type: string): type is ReportType {
  return ["BLOOD_TEST", "DNA", "MICROBIOME"].includes(type);
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    // Input validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!type || !["BLOOD_TEST", "DNA", "MICROBIOME"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid report type" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Generate a unique filename to prevent collisions
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const uniqueFilename = `${session.user.id}_${timestamp}.${fileExt}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    try {
      // Save the file
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      await fs.writeFile(filePath, fileBuffer);

      // Handle PDF extraction on server-side if needed
      let fileContent = "";
      let updatedFile = file;
      
      // Check if we need to extract text from PDF
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          console.log('Attempting server-side PDF extraction...');
          const pdfData = await pdfParse(fileBuffer);
          fileContent = pdfData.text;
          console.log(`Extracted ${fileContent.length} characters from PDF`);
          
          // Create a modified file object with the extracted text
          const textBlob = new Blob([fileContent], { type: 'text/plain' });
          // @ts-ignore - We need to modify the file to include content for processing
          updatedFile = new File([textBlob], file.name, { 
            type: 'text/plain',
            lastModified: file.lastModified
          });
          
          // For debugging only
          if (process.env.NODE_ENV === 'development') {
            const previewLength = Math.min(500, fileContent.length);
            console.log(`PDF content preview: ${fileContent.substring(0, previewLength)}...`);
          }
        } catch (pdfError) {
          console.error('PDF extraction error:', pdfError);
          // Continue with original file if PDF extraction fails
        }
      }

      // Process the file using our parser
      console.log(`Extracted ${fileContent.length} characters of text from file`);
      console.log(`Text content preview: ${fileContent.substring(0, 300).replace(/\n/g, ' ').trim()}...`);
      
      // Make sure to pass the content explicitly to the processor
      const result = await FileProcessor.processFile(updatedFile, fileContent);
      
      if (!result.success) {
        // Clean up the uploaded file if parsing fails
        await fs.unlink(filePath).catch(console.error);
        return NextResponse.json(
          { success: false, error: result.error },
          { 
            status: 400, 
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          }
        );
      }

      // Prepare the data for storage
      const reportData: StoredReportData = {
        ...result.data,
        metadata: {
          ...result.data.metadata,
          parsedAt: new Date().toISOString(),
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          lastModified: file.lastModified,
        },
      };

      // Store the report in the database
      // Store metadata as part of parsedData since we don't have dedicated fields
      const parsedDataWithMeta = {
        ...reportData,
        metadata: {
          ...reportData.metadata,
          // Store these as strings inside metadata since we don't have dedicated fields
          labName: reportData.metadata.labName || null,
          testDate: reportData.metadata.testDate || null,
        }
      };
      
      const report = await prisma.report.create({
        data: {
          userId: session.user.id,
          type,
          fileName: file.name,
          filePath: `/uploads/${uniqueFilename}`,
          parsedData: JSON.stringify(parsedDataWithMeta), // Ensure proper serialization
        },
      });

      return NextResponse.json({
        success: true,
        file: `/uploads/${uniqueFilename}`,
        reportId: report.id,
        data: result.data,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });

    } catch (error) {
      // Clean up the uploaded file if any error occurs
      await fs.unlink(filePath).catch(console.error);
      throw error;
    }

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process file" },
      { status: 500 }
    );
  }
}

// Add GET endpoint to list user's reports
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const reports = await prisma.report.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        fileName: true,
        filePath: true,
        parsedData: true,
        createdAt: true,
      },
    });
    
    // Extract metadata from parsedData for the UI
    const processedReports = reports.map(report => {
      let metadata = { labName: null, testDate: null };
      if (report.parsedData) {
        try {
          const parsed = JSON.parse(report.parsedData);
          metadata = parsed.metadata || metadata;
        } catch (e) {
          console.error('Error parsing report data:', e);
        }
      }
      
      return {
        ...report,
        labName: metadata.labName,
        testDate: metadata.testDate,
        parsedData: undefined // Don't send the full parsed data to the client
      };
    });

    return NextResponse.json({ success: true, reports: processedReports }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
