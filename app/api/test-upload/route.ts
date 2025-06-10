import { NextRequest, NextResponse } from 'next/server';

// Define route configuration
export const dynamic = 'force-dynamic';

/**
 * Simple test API route for file uploads
 * POST /api/test-upload
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Test upload route called');
    
    // Parse form data
    let formData;
    try {
      formData = await request.formData();
      console.log('Form data received with keys:', [...formData.keys()]);
    } catch (error) {
      console.error('Error parsing form data:', error);
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error('No file found in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log('Received file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Return a simple success response
    return NextResponse.json({ 
      success: true,
      message: 'File received successfully',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    });
    
  } catch (error: unknown) {
    console.error('Error in test upload route:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during file upload';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
