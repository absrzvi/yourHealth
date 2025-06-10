import { NextRequest, NextResponse } from 'next/server';

// Minimal API route that just returns JSON for any method
export async function GET() {
  console.log('GET handler called in simple-test route');
  return NextResponse.json({ message: 'GET request received' });
}

export async function POST(request: NextRequest) {
  console.log('POST handler called in simple-test route');
  
  // Try to get the request body if any
  let body = '';
  try {
    body = await request.text();
  } catch (e) {
    // Ignore errors
  }
  
  return NextResponse.json({ 
    message: 'POST request received', 
    bodyLength: body.length
  });
}
