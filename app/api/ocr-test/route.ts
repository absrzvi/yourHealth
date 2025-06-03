import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('[API /api/ocr-test] Received test request');
  try {
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    // Log file information
    console.log('[API /api/ocr-test] File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Convert File to Buffer (just for testing, not using it)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Return success response
    return NextResponse.json({
      success: true,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      },
      message: 'File received successfully',
      testMode: true
    });
    
  } catch (error) {
    console.error('[API /api/ocr-test] Error:', error);
    console.error('[API /api/ocr-test] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json({
      success: false,
      error: 'Test upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown error type'
    }, { status: 500 });
  }
}
