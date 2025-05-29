import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { parseReport } from '../../../../lib/parsers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Extract user from session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }
    // Find user in DB
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    let reportType = formData.get('type') as string;
    reportType = typeof reportType === 'string' ? reportType.toLowerCase() : '';
    const allowedReportTypes = ['blood', 'dna', 'microbiome', 'pdf', 'image'];
    if (!allowedReportTypes.includes(reportType)) {
      return NextResponse.json({ error: 'Unsupported report type.' }, { status: 400 });
    }

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // File type validation
    const allowedTypes = [
      'text/csv',
      'application/pdf',
      'application/json',
      'text/plain',
    ];
    // @ts-ignore
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a CSV, PDF, TXT, or JSON file.' }, { status: 400 });
    }

    // Save file
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = (file as any).name || uuidv4();
    const filePath = path.join(uploadDir, fileName);
    // @ts-ignore
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Parse report if supported
    let parsedData: string | null = null;
    try {
      let content: string | null = null;
      if (file.type === 'text/csv' || file.type === 'text/plain') {
        content = fs.readFileSync(filePath, 'utf-8');
      } else if (file.type === 'application/json') {
        content = fs.readFileSync(filePath, 'utf-8');
      } else if (file.type === 'application/pdf') {
        // PDF parsing not yet supported for any report type
        content = null;
      }
      if (content !== null) {
        try {
          const parsed = await parseReport(reportType, file.type, content);
          if (Array.isArray(parsed) && parsed.length === 0) {
            return NextResponse.json({ error: 'No recognized biomarkers found in your file. Please check the format or marker names.' }, { status: 400 });
          }
          parsedData = JSON.stringify(parsed);
        } catch (err: any) {
          return NextResponse.json({ error: 'Sorry, this report type and file format is not supported for automatic parsing yet.' }, { status: 400 });
        }
      }
    } catch (err: any) {
      // Defensive: don't leak details
      return NextResponse.json({ error: 'Sorry, we could not process your file. Please check the format or try another supported type.' }, { status: 400 });
    }

    // Save report in DB with real userId
    await prisma.report.create({
      data: {
        userId: user.id,
        type: reportType,
        fileName,
        filePath: `/uploads/${fileName}`,
        parsedData,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Server error: ' + (error as Error).message }, { status: 500 });
  }
}
