import { ParserFactory } from './parserFactory';
import { ParserResult, ReportType } from './types';
import { validateImageDimensions } from '@/lib/storage';

export class FileProcessor {
  /**
   * Process a file by validating, reading content, and determining report type
   * @param file The file to process
   * @param preExtractedContent Optional pre-extracted content (used for server-side PDF processing)
   * @returns A parser result object
   */
  static async processFile(file: File, preExtractedContent?: string): Promise<ParserResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }
      
      // Make sure we're in a browser environment before proceeding
      const isBrowser = typeof window !== 'undefined';
      
      // Check if file is an image or PDF that requires OCR
      const needsOcr = this.needsOcrProcessing(file);
      
      if (needsOcr) {
        // For images and PDFs that need OCR, use the OCR upload endpoint
        if (!isBrowser) {
          console.warn('OCR processing requires browser environment');
          return {
            success: false,
            error: 'OCR processing requires browser environment'
          };
        }
        return this.processWithOcr(file);
      }
      
      // For structured files, use the normal parser flow
      // Use pre-extracted content if available, otherwise read from file
      const content = preExtractedContent || await this.readFileAsText(file);
      
      // If content is empty after extraction attempts, throw an error
      if (!content || content.trim() === '') {
        console.error('Empty or null content after extraction');
        throw new Error('Could not extract content from file');
      }
      
      // Log key patterns found in the content to help with debugging
      console.log('Key patterns found:', {
        hasInvestigation: content.includes('Investigation'),
        hasValues: content.includes('Values'),
        hasVitaminD: content.includes('Vitamin D') || content.includes('25-Hydroxy'),
        hasHbA1C: content.includes('HbA1C') || content.includes('Glycosylated Hemoglobin')
      });
      
      // Detect report type
      const detectedType = await ParserFactory.detectReportType(file, content);
      if (!detectedType) {
        throw new Error('Could not determine report type');
      }
      
      // Create appropriate parser
      const parser = await ParserFactory.createParser(file, detectedType, content);
      
      // Parse the file
      const result = await parser.parse();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to parse file');
      }
      
      return result;
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  private static async readFileAsText(file: File): Promise<string> {
    // Check if we're in a browser environment
    // Don't use mock content on server-side anymore since we have pdf-parse
    if (typeof window === 'undefined' && !file.text) {
      console.log(`Warning: Reading file in server environment without text() method`);
      // Allow the process to continue as we might have pre-extracted content
    } 
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (!event.target?.result) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          if (typeof event.target.result === 'string') {
            resolve(event.target.result);
          } else {
            // Handle binary data (e.g., PDF, Excel)
            if (file.name.toLowerCase().endsWith('.pdf')) {
              // For PDFs, we'll need to use a PDF parser
              this.parsePdfFile(file)
                .then(resolve)
                .catch(reject);
            } else if (file.name.toLowerCase().match(/\.(xls|xlsx)$/)) {
              // For Excel files
              this.parseExcelFile(file)
                .then(resolve)
                .catch(reject);
            } else {
              try {
                // Try to decode as text
                const decoder = new TextDecoder('utf-8');
                const text = decoder.decode(event.target.result);
                resolve(text);
              } catch (error) {
                console.warn('Text decoding error:', error);
                resolve(''); // Return empty string on decode error
              }
            }
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          reader.readAsArrayBuffer(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.name.toLowerCase().match(/\.(xls|xlsx)$/)) {
          reader.readAsArrayBuffer(file);
        } else {
          // Default to text for other file types
          reader.readAsText(file);
        }
      } catch (error) {
        console.error('FileReader error:', error);
        reject(new Error('Failed to initialize file reader'));
      }
    });
  }
  
  private static async parsePdfFile(file: File): Promise<string> {
    try {
      // For PDF files that have actual text content (not just scanned images)
      // This is a simple implementation - in production, you'd want to use a proper PDF parser
      // We're mocking this functionality since we'll use OCR for PDFs in this implementation
      const arrayBuffer = await file.arrayBuffer();
      // This is a placeholder - typically, you'd use a library like pdf.js here
      // but we'll use OCR for PDFs in most cases
      return `PDF content extraction placeholder for ${file.name}`;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }
  
  private static async parseExcelFile(file: File): Promise<string> {
    try {
      // Simple implementation for Excel files
      // In production, you'd use a proper Excel parsing library
      const arrayBuffer = await file.arrayBuffer();
      // This is a placeholder - you'd typically use a library like xlsx here
      return `Excel content extraction placeholder for ${file.name}`;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error('Failed to parse Excel file');
    }
  }
  
  static async processMultipleFiles(files: File[]): Promise<{
    results: ParserResult[];
    successCount: number;
    errorCount: number;
  }> {
    const results = await Promise.all(files.map(file => this.processFile(file)));
    
    return {
      results,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length
    };
  }
  
  static getFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'xls':
      case 'xlsx':
        return 'Excel';
      case 'csv':
        return 'CSV';
      case 'tsv':
      case 'txt':
        return 'Text';
      case 'json':
        return 'JSON';
      default:
        return 'Unknown';
    }
  }
  
  static validateFile(file: File, maxSizeMB = 10): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`
      };
    }
    
    // Check file type - expanded to include images for OCR
    const allowedTypes = [
      // Structured data formats
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'application/json',
      'text/tab-separated-values',
      // Image formats for OCR
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/heif'
    ];
    
    if (!allowedTypes.includes(file.type) && 
        !file.name.match(/\.(pdf|xls|xlsx|csv|tsv|txt|json|jpg|jpeg|png|heic|heif)$/i)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a PDF, Excel, CSV, image, or text file.'
      };
    }
    
    return { valid: true };
  }
  
  // Determine if a file should be processed with OCR
  static needsOcrProcessing(file: File): boolean {
    // Process images with OCR
    if (file.type.startsWith('image/')) {
      return true;
    }
    
    // For PDFs, we offer both options but prefer OCR for scanned documents
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      // In a production environment, we could try to detect if the PDF is scanned/image-based
      // For now, we'll use OCR for PDFs below a certain size threshold (assuming they're scans)
      const PDF_OCR_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
      return file.size < PDF_OCR_SIZE_THRESHOLD;
    }
    
    return false;
  }
  
  // Process a file using the OCR pipeline
  static async processWithOcr(file: File): Promise<ParserResult> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof fetch === 'undefined') {
      console.warn('OCR processing requires browser environment');
      return {
        success: false,
        error: 'OCR processing requires browser environment'
      };
    }

    try {
      // For images, validate dimensions
      if (file.type.startsWith('image/')) {
        try {
          const dimensionCheck = await validateImageDimensions(file);
          if (!dimensionCheck.isValid) {
            return {
              success: false,
              error: dimensionCheck.errors.join('. ')
            };
          }
          
          // Show warnings but proceed
          if (dimensionCheck.warnings.length > 0) {
            console.warn('Image warnings:', dimensionCheck.warnings);
          }
        } catch (validationError) {
          console.warn('Image validation error (continuing anyway):', validationError);
          // Continue even if validation fails - it might be a server-side issue
        }
      }
      
      try {
        // Create form data for the API request
        const formData = new FormData();
        formData.append('file', file);
        
        // Send to OCR API
        const response = await fetch('/api/ocr-upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OCR processing failed: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'OCR processing failed');
        }
        
        // Return in ParserResult format
        return {
          success: true,
          data: {
            type: 'BLOOD_TEST', // Default type for OCR results
            biomarkers: result.tests || [],
            metadata: {
              confidence: result.confidence,
              needsReview: result.needsReview,
              reportId: result.reportId,
              parsedAt: new Date().toISOString(),
              parser: 'OCR',
              format: 'OCR',
              testCount: result.testCount
            }
          }
        };
      } catch (fetchError) {
        throw new Error(`OCR API request failed: ${fetchError.message}`);
      }
    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OCR processing failed'
      };
    }
  }
}
