import { NextRequest, NextResponse } from 'next/server';

// Define route configuration for Next.js App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Handle POST requests to test API route
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST request received to /api/test-post');
    console.log('Request headers:', Object.fromEntries(request.headers));
    
    // Parse form data
    let formData;
    try {
      formData = await request.formData();
      const formDataKeys = [...formData.keys()];
      console.log('Form data received with keys:', formDataKeys);
    } catch (error) {
      console.error('Error parsing form data:', error);
      return NextResponse.json(
        { error: 'Failed to parse form data', success: false },
        { status: 400 }
      );
    }
    
    // Return success response
    return NextResponse.json({ 
      message: 'POST request successful',
      success: true,
      receivedData: Object.fromEntries(formData.entries())
    });
  } catch (error: unknown) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: errorMessage, success: false },
      { status: 500 }
    );
  }
}

// Explicitly define handlers for other HTTP methods to return 405
export async function GET() {
  return new NextResponse(null, { status: 405 });
}

export async function PUT() {
  return new NextResponse(null, { status: 405 });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}

export async function PATCH() {
  return new NextResponse(null, { status: 405 });
}

// Handle OPTIONS requests for CORS preflight
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
