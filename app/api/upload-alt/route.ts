import { NextRequest, NextResponse } from "next/server";

/**
 * Simple diagnostic upload endpoint
 * This serves as a test to isolate API routing issues
 */

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: "Upload-alt GET endpoint is working",
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    // Get form data
    const formData = await req.formData();
    
    // Extract basic info without actually processing the file
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const userId = formData.get("userId") as string | null;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: "No file provided" 
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }
    
    // Return basic file info without processing
    return NextResponse.json({
      success: true,
      message: "File received successfully (diagnostic endpoint)",
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      },
      formData: {
        type,
        userId
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error: any) {
    console.error("Upload-alt diagnostic error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error occurred",
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
}
