import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { parseReport } from "@/lib/parsers";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB default

/**
 * GET handler for checking if the endpoint is working
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(
    { 
      success: true, 
      message: "Upload-v2 endpoint is working",
      timestamp: new Date().toISOString()
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}

/**
 * POST handler for file uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data first
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reportType = formData.get("type") as "DNA" | "MICROBIOME" | "BLOOD_TEST";
    const userId = formData.get("userId") as string;
    
    // For now, we'll use the userId provided in the form data
    // In production, we would verify the session and use session.user.id
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" }, 
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" }, 
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          } 
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large" }, 
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          } 
        }
      );
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    await writeFile(filePath, buffer);

    // Parse the report 
    let parsedData = {};
    try {
      // Use the updated parseReport implementation with proper parameters
      parsedData = await parseReport(filePath, reportType);
      console.log('Parse report result:', typeof parsedData, parsedData ? Object.keys(parsedData).length : 0);
      
      // Store file metadata in parsedData
      parsedData = {
        ...parsedData,
        fileMetadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          reportType
        }
      };
    } catch (parseError) {
      console.error("Report parsing error:", parseError);
      // Continue even if parsing fails, but include error info
      parsedData = {
        parsingError: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
        fileMetadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          reportType
        }
      };
    }

    // Variable to store the report response data
    let reportData: { id: string } | null = null;
    
    // Verify the user exists before creating the report
    try {
      // Check if the user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });
      
      if (!userExists) {
        // Clean up the uploaded file since we can't create the database record
        try {
          await unlink(filePath).catch(() => {});
        } catch (e) {
          console.error('Error deleting file after user validation failed:', e);
        }
        
        return NextResponse.json(
          { success: false, error: "User not found" },
          { 
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store"
            } 
          }
        );
      }
      
      // Save to database
      const report = await prisma.report.create({
        data: {
          userId,
          type: reportType,
          fileName: file.name,
          filePath: fileName,
          // Convert object to JSON string since parsedData is defined as String? in the schema
          parsedData: JSON.stringify(parsedData),
        },
      });
      
      reportData = report;
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Clean up the uploaded file since we couldn't create the database record
      try {
        await unlink(filePath).catch(() => {});
      } catch (e) {
        console.error('Error deleting file after database error:', e);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: "Database error: " + (dbError.message || "Unknown database error"),
          details: process.env.NODE_ENV !== "production" ? dbError : undefined
        },
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      reportId: reportData?.id,
      parsedData,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size
      }
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Upload failed" 
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
