import { ParserFactory, ReportType } from './parserFactory';
import { ParserResult } from './types';

export class FileProcessor {
  static async processFile(file: File): Promise<ParserResult> {
    try {
      // Read file content
      const content = await this.readFileAsText(file);
      
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
    return new Promise((resolve, reject) => {
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
            // Try to decode as text
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(event.target.result);
            resolve(text);
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
    });
  }
  
  private static async parsePdfFile(file: File): Promise<string> {
    try {
      // Dynamically import PDF.js to reduce bundle size
      const { default: pdfjs } = await import('pdfjs-dist');
      
      // Configure worker path (for web workers)
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;
      
      // Extract text from all pages
      let text = '';
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => (item as any).str || '');
        text += strings.join(' ') + '\n\n';
      }
      
      return text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }
  
  private static async parseExcelFile(file: File): Promise<string> {
    try {
      // Dynamically import xlsx to reduce bundle size
      const XLSX = await import('xlsx');
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse the workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Convert all sheets to CSV and concatenate
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet, { skipHidden: true });
        text += `=== ${sheetName} ===\n${csv}\n\n`;
      });
      
      return text;
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
    
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'application/json',
      'text/tab-separated-values'
    ];
    
    if (!allowedTypes.includes(file.type) && 
        !file.name.match(/\.(pdf|xls|xlsx|csv|tsv|txt|json)$/i)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a PDF, Excel, CSV, TSV, or JSON file.'
      };
    }
    
    return { valid: true };
  }
}
