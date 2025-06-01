// Direct exports of key types
export type { ReportType, ParserResult, BaseReportData, DNAReportData, BloodTestReportData, MicrobiomeReportData, ReportData } from './types';

// Base parser and factory
export * from './baseParser';
export * from './parserFactory';

// Individual parsers
export * from './bloodTestParser';
export * from './dnaParser';
export * from './microbiomeParser';

// Utilities
export * from './fileProcessor';

// Import file processing utilities
import { extractTextFromFile } from './serverFileProcessor';
import { BloodTestParser } from './bloodTestParser';
import { DNAParser } from './dnaParser';
import { MicrobiomeParser } from './microbiomeParser';
import { ReportType, ParserResult } from './types';

/**
 * Parse a report file and extract structured data
 * @param filePath Path to the file to parse
 * @param reportType Type of report (BLOOD_TEST, DNA, MICROBIOME)
 * @returns Parsed data structure based on the report type
 */
export async function parseReport(filePath: string, reportType: string): Promise<any> {
  console.log(`Parsing ${reportType} report: ${filePath}`);
  try {
    // Extract text content from the file
    const textContent = await extractTextFromFile(filePath);
    console.log(`Extracted ${textContent.length} characters of text from file`);
    
    // Log a preview of the extracted text to help debug pattern matching
    const textPreview = textContent.substring(0, 500).replace(/\n/g, ' ').trim();
    console.log('Text content preview:', textPreview);
    
    let result: ParserResult = {
      success: false,
      error: 'Unknown report type',
      data: undefined
    };
    
    // Parse based on report type
    switch(reportType) {
      case 'BLOOD_TEST':
        console.log(`Creating BloodTestParser with ${textContent.length} characters`);
        const bloodParser = new BloodTestParser(null, textContent);
        result = await bloodParser.parse();
        break;
      case 'DNA':
        const dnaParser = new DNAParser(null, textContent);
        result = await dnaParser.parse();
        break;
      case 'MICROBIOME':
        const microbiomeParser = new MicrobiomeParser(null, textContent);
        result = await microbiomeParser.parse();
        break;
      default:
        console.warn(`Unknown report type: ${reportType}`);
    }
    
    // Return the parsed data or an object with error info if parsing failed
    if (result.success && result.data) {
      return result.data;
    } else {
      console.warn(`Parsing failed: ${result.error || 'Unknown error'}`);
      return {
        parsingError: result.error || 'Unknown error',
        reportType,
        fileProcessed: true,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error in parseReport:', error);
    return {
      parsingError: error instanceof Error ? error.message : 'Unknown error',
      reportType,
      fileProcessed: false,
      timestamp: new Date().toISOString()
    };
  }
}
