import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ message: 'Test route GET working' });
}

export async function POST(request: NextRequest) {
  console.log('POST request received to test-route');
  return NextResponse.json({ message: 'Test route POST working' });
}
