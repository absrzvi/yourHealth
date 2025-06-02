import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
// Using dynamic import for pdf-parse to handle potential import issues
let pdfParse: any = null;

// Safe import of pdf-parse
function getPdfParser() {
  if (pdfParse) return pdfParse;
  
  try {
    // Bypass the pdf-parse test file dependency by importing the core module directly
    try {
      // Create a temporary directory if needed
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Import the core module directly to avoid test file dependency
      pdfParse = require('pdf-parse/lib/pdf-parse.js');
      return pdfParse;
    } catch (innerErr) {
      console.error('Error importing pdf-parse core module:', innerErr);
      // Fall back to regular import as a last resort
      pdfParse = require('pdf-parse');
      return pdfParse;
    }
  } catch (err) {
    console.error('Error importing pdf-parse:', err);
    return null;
  }
}

/**
 * Extract text content from a file on the server
 * @param filePath Path to the file
 * @returns Text content of the file
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  try {
    const fileExt = path.extname(filePath).toLowerCase();
    let textContent = '';
    
    console.log(`Extracting text from ${fileExt} file: ${filePath}`);
    
    // Read file buffer
    const buffer = await fsPromises.readFile(filePath);
    
    // Detect the file type and apply special handling for known formats
    console.log(`Detected file type: ${fileExt}`);
    
    // Process based on file type
    if (fileExt === '.pdf') {
      // Parse PDF to text
      try {
        const pdfParser = getPdfParser();
        if (!pdfParser) {
          console.error('PDF parser not available');
          return '[PDF content - parser not available]';
        }
        
        // Add a sleep delay to ensure PDF processing has enough time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Starting PDF parsing...');
        const pdfData = await pdfParser(buffer, {
          // Add options to improve text extraction
          pagerender: function(pageData: any) {
            // More detailed text extraction to preserve formatting
            return pageData.getTextContent({ normalizeWhitespace: false })
              .then(function(textContent: any) {
                let lastY, text = '';
                for(let item of textContent.items) {
                  if(lastY == item.transform[5] || !lastY){
                    text += item.str;
                  } else {
                    text += '\n' + item.str;
                  }
                  lastY = item.transform[5];
                }
                return text;
              });
          }
        });
        
        textContent = pdfData.text;
        console.log(`Extracted ${textContent.length} characters from PDF`);
        
        // Log a more detailed preview to help debug pattern matching
        const previewLength = Math.min(1000, textContent.length);
        const textPreview = textContent.substring(0, previewLength);
        console.log('PDF content preview (first 1000 chars):', '\n', textPreview, '\n');
        
        // Check for key patterns related to blood tests
        const hasInvestigation = textContent.includes('Investigation');
        const hasValues = textContent.includes('Values');
        const hasVitaminD = textContent.includes('25-Hydroxy') || textContent.includes('Vitamin');
        const hasHbA1C = textContent.includes('HbA1C') || textContent.includes('Hemoglobin');
        console.log('Key patterns found:', { hasInvestigation, hasValues, hasVitaminD, hasHbA1C });
      } catch (pdfError) {
        console.error('Error parsing PDF:', pdfError);
        // Don't throw, return a message instead
        return `[PDF parsing failed: ${pdfError.message}]`;
      }
    } else if (['.txt', '.csv'].includes(fileExt)) {
      // Text files can be read directly as UTF-8
      textContent = buffer.toString('utf-8');
      console.log(`Extracted ${textContent.length} characters from text file`);
    } else if (['.jpg', '.jpeg', '.png', '.heic'].includes(fileExt)) {
      // For images, we'd need OCR, but that requires additional dependencies
      // Like tesseract.js or a cloud OCR API
      // For now, we'll just return a placeholder
      console.warn('Image OCR not implemented in server-side processing');
      textContent = '[Image content - OCR processing required]';
    } else {
      throw new Error(`Unsupported file type: ${fileExt}`);
    }
    
    return textContent;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}
