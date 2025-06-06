import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { createReadStream, existsSync } from 'fs';

const EDI_DIR = path.join(process.cwd(), 'edi-files');

export async function GET(
  req: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const { fileName } = params;
    // Security: Only allow .edi files and prevent directory traversal
    if (!fileName.endsWith('.edi') || fileName.includes('..')) {
      return new NextResponse('Invalid file name', { status: 400 });
    }
    const filePath = path.join(EDI_DIR, fileName);
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }
    // Stream the file as a download
    const fileStream = createReadStream(filePath);
    return new NextResponse(fileStream as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-edi',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
