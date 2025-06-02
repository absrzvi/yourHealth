import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: "API test successful",
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    // Simply echo back any JSON sent
    const data = await req.json();
    
    return NextResponse.json({ 
      success: true, 
      message: "POST request successful",
      echo: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Could not parse JSON body",
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}
