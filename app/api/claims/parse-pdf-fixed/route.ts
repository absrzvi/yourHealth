import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateFile, UploadError } from '@/lib/storage/upload-utils';
import { promises as fs } from 'fs';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { PDFParseResult } from '@/src/lib/claims/types/claims.types';

// Define route configuration for Next.js App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Primary POST handler for PDF parsing
 */
export async function POST(request: NextRequest) {
  console.log('POST request received to /api/claims/parse-pdf-fixed');
  console.log('Request headers:', Object.fromEntries(request.headers));
  
  try {
    // Check authentication (optional in development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const session = await getServerSession(authOptions);
    
    if (!session && !isDevelopment) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
    
    // Get the file from form data
    const file = formData.get('file') as File;
    if (!file) {
      console.error('No file provided in form data');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log('Received file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Basic validation
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      console.error('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      );
    }
    
    // Return a simple success response for now
    return NextResponse.json({ 
      message: 'PDF received successfully',
      filename: file.name,
      size: file.size,
      type: file.type,
      success: true
    });
  } catch (error: unknown) {
    console.error('Error processing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
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
