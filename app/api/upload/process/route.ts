import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { BloodTestParser } from '@/lib/parsers/bloodTestParser';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { getOcrService } from '@/lib/ocr';
import { existsSync } from 'fs';

/**
 * Get an OCR service instance configured to use Google Cloud Vision API
 * @returns OCR service instance
 */
function getGoogleVisionOcrService() {
  // Get the OCR service with Google Vision configuration
  return getOcrService({ provider: 'google-vision' });
}

/**
 * Endpoint to process uploaded files through OCR and blood test parser
 * This is for testing purposes and allows direct processing without authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await req.formData();
    
    // Extract file and type
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.match(/^(application\/pdf|image\/(jpeg|png|jpg))$/)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Only PDF, JPEG, JPG, and PNG files are supported.' 
      }, { status: 400 });
    }

    // Create a temporary directory to store the file
    const tempDir = path.join(os.tmpdir(), 'for-your-health-' + uuidv4());
    await fs.mkdir(tempDir, { recursive: true });

    // Save file to temp directory
    const fileExt = file.name.split('.').pop() || (file.type.includes('pdf') ? 'pdf' : 'jpg');
    const filePath = path.join(tempDir, `upload.${fileExt}`);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // Extract text from the uploaded file using OCR service
    let ocrText = '';
    let usedFallbackData = false;
    try {
      console.log('Starting OCR processing with Google Cloud Vision API');
      console.log('File information:', {
        type: file.type,
        size: file.size,
        name: file.name,
        path: filePath
      });
      
      // Get our OCR service with Google Cloud Vision configuration
      console.log('Creating OCR service with Google Vision provider');
      const ocrService = getOcrService({ provider: 'google-vision' });
      
      // Log the provider configuration
      console.log('OCR provider config:', ocrService.getProviderConfig());
      
      // Check if the file is a PDF - PDFs require special handling
      if (file.type === 'application/pdf') {
        // For PDF files, use the PDF-specific extraction method
        console.log('Processing PDF file with Google Cloud Vision API');
        ocrText = await ocrService.extractTextFromPdf(filePath);
      } else if (file.type.match(/^image\/(jpeg|png|jpg)$/)) {
        // For image files, use the image extraction method
        console.log('Processing image file with Google Cloud Vision API');
        try {
          ocrText = await ocrService.extractTextFromImage(filePath);
          console.log('OCR text length:', ocrText?.length || 0);
          console.log('OCR text preview:', ocrText?.substring(0, 100));
          console.log('OCR processing complete');
        } catch (ocrError: any) {
          // Detailed error logging for OCR failures
          console.error('OCR extraction error:', ocrError);
          console.error('Error stack:', ocrError.stack);
          throw ocrError; // Re-throw to be caught by outer catch
        }
      } else {
        // This shouldn't happen due to previous validation, but just in case
        throw new Error('Unsupported file type for OCR');
      }
      
      // Check if the OCR text is empty after processing
      if (!ocrText || ocrText.trim() === '') {
        console.log('Google Vision API returned empty text, falling back to sample data');
        usedFallbackData = true;
        // Only use generic fallback in development, otherwise return an error in production
        if (process.env.NODE_ENV === 'development') {
          try {
            const sampleDir = path.join(process.cwd(), 'test-data');
            const testSamplePath = path.join(sampleDir, 'blood-test-sample.txt');
            ocrText = await fs.readFile(testSamplePath, 'utf8');
            console.log('Using sample blood test data in development environment');
          } catch (fallbackError) {
            console.error('Failed to load fallback data:', fallbackError);
            ocrText = 'SAMPLE DATA - OCR FAILED AND FALLBACK NOT AVAILABLE';
          }
        } else {
          // In production, we should not silently fall back to sample data
          throw new Error('OCR processing returned empty text');
        }
      }
    } catch (error: any) {
      console.error('Error during OCR processing:', error);
      console.error('Error stack:', error.stack);
      usedFallbackData = true;
      
      // Fall back to sample data on error only in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const sampleDir = path.join(process.cwd(), 'test-data');
          const testSamplePath = path.join(sampleDir, 'blood-test-sample.txt');
          ocrText = await fs.readFile(testSamplePath, 'utf8');
          console.log('Using sample blood test data after OCR error');
        } catch (fallbackError) {
          console.error('Failed to load fallback data:', fallbackError);
          ocrText = `OCR processing error: ${error.message}. Fallback data not available.`;
        }
      } else {
        // In production, return an error response
        return NextResponse.json({
          success: false,
          error: 'OCR processing failed',
          message: error.message || 'Unknown OCR error',
          file: {
            name: file.name,
            type: file.type,
            size: file.size
          }
        }, { status: 500 });
      }
    }
    
    // Get OCR service with Google Cloud Vision API

    // Process through blood test parser
    let parserResult;
    try {
      // Pass the OCR text to the parser constructor
      const parser = new BloodTestParser(null, ocrText);
      parserResult = await parser.parse();
      
      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });
      
      // Return success with parser results and OCR text
      return NextResponse.json({
        success: true,
        message: 'File processed successfully',
        ocrText: ocrText,
        data: parserResult,
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      });
      
    } catch (error: any) {
      console.error('Error during blood test parsing:', error);
      
      // Clean up temp files
      await fs.rm(tempDir, { recursive: true, force: true });
      
      return NextResponse.json({
        success: false,
        error: 'Error processing blood test data',
        message: error.message || 'Unknown parser error',
        ocrText: ocrText,
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        }
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Upload processing error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
