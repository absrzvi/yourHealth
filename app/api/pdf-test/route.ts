import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('POST handler called in simple test route');
  
  try {
    // Try to get form data if there is any
    let file = null;
    try {
      const formData = await request.formData();
      file = formData.get('file');
    } catch (e) {
      // Ignore if no form data
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'POST received', 
      hasFile: !!file,
      fileName: file ? (file as File).name : null
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'GET request successful' });
}
