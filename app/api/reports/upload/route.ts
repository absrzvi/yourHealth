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

    // @ts-ignore
    const fileType = file.type;
    
    // Define allowed file types for each report type
    const reportTypeValidations = {
      blood: ['text/csv', 'text/plain'], // For Quest bloodwork
      dna: ['text/plain', 'text/csv'],    // For 23andMe
      microbiome: ['application/json'],    // For Viome
      hormone: ['application/json'],       // For DUTCH
      pdf: ['application/pdf'],
      image: ['image/jpeg', 'image/png', 'image/jpg']
    };

    // Check if file type is allowed for the selected report type
    if (!reportTypeValidations[reportType as keyof typeof reportTypeValidations]?.includes(fileType)) {
      const allowedTypes = reportTypeValidations[reportType as keyof typeof reportTypeValidations] || [];
      const allowedExtensions = allowedTypes.map(t => {
        if (t === 'text/csv') return 'CSV';
        if (t === 'text/plain') return 'TXT';
        if (t.startsWith('image/')) return 'JPG/PNG';
        return t.split('/').pop()?.toUpperCase();
      }).filter(Boolean).join(', ');
      
      return NextResponse.json({ 
        error: `Unsupported file type for ${reportType} report. Please upload a ${allowedExtensions} file.` 
      }, { status: 400 });
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
            return NextResponse.json({ error: 'No recognized biomarkers found in your file. Please check the format, marker/SNP/taxa names, or file structure.' }, { status: 422 });
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
    const report = await prisma.report.create({
      data: {
        userId: user.id,
        type: reportType,
        fileName,
        filePath: `/uploads/${fileName}`,
        parsedData,
      },
    });

    // If we have parsed data, save it as biomarkers
    if (parsedData) {
      try {
        const biomarkers = JSON.parse(parsedData);
        if (Array.isArray(biomarkers) && biomarkers.length > 0) {
          // Process biomarkers one by one to handle potential duplicates
          let savedCount = 0;
          for (const bm of biomarkers) {
            try {
              await prisma.biomarker.create({
                data: {
                  reportId: report.id,
                  name: bm.biomarker || bm.name || bm.rsid || 'Unknown',
                  value: parseFloat(bm.value) || 0,
                  unit: bm.unit || null,
                  range: bm.range || null,
                  flag: bm.flag || bm.status || null,
                  description: bm.description || bm.notes || null,
                  category: bm.category || reportType,
                }
              });
              savedCount++;
            } catch (error) {
              if (error.code === 'P2002') {
                // Duplicate entry, skip
                console.log(`Skipping duplicate biomarker: ${bm.biomarker || bm.name || bm.rsid}`);
              } else {
                console.error('Error saving biomarker:', error);
              }
            }
          }
          
          console.log(`Saved ${savedCount} out of ${biomarkers.length} biomarkers for report ${report.id}`);
        }
      } catch (error) {
        console.error('Error saving biomarkers:', error);
        // Don't fail the whole request if we can't save biomarkers
      }
    }

    return NextResponse.json({ 
      success: true,
      reportId: report.id,
      biomarkerCount: parsedData ? JSON.parse(parsedData).length : 0
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Server error: ' + (error as Error).message }, { status: 500 });
  }
}
