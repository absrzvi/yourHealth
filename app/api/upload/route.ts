import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { FileProcessor, type ParserResult, type ReportType } from "@/lib/parsers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));

      // Process the file using our parser
      const result = await FileProcessor.processFile(file);
      
      if (!result.success) {
        // Clean up the uploaded file if parsing fails
        await fs.unlink(filePath).catch(console.error);
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
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
      const report = await prisma.report.create({
        data: {
          userId: session.user.id,
          type,
          fileName: file.name,
          filePath: `/uploads/${uniqueFilename}`,
          parsedData: JSON.parse(JSON.stringify(reportData)), // Ensure proper serialization
          labName: reportData.metadata.labName || null,
          testDate: reportData.metadata.testDate ? new Date(reportData.metadata.testDate) : null,
        },
      });

      return NextResponse.json({
        success: true,
        file: `/uploads/${uniqueFilename}`,
        reportId: report.id,
        data: result.data,
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
        testDate: true,
        labName: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
