import { BloodTestParser } from './bloodTestParser';
import { DNAParser } from './dnaParser';
import { MicrobiomeParser } from './microbiomeParser';
import { ParserResult, ReportType } from './types';

interface ParserConstructor {
  new (file: File | null, content: string): { parse: () => Promise<ParserResult> };
}

const PARSERS: Record<ReportType, ParserConstructor> = {
  BLOOD_TEST: BloodTestParser,
  DNA: DNAParser,
  MICROBIOME: MicrobiomeParser,
};

export class ParserFactory {
  static async createParser(
    file: File,
    type: ReportType,
    content: string
  ): Promise<{ parse: () => Promise<ParserResult> }> {
    const Parser = PARSERS[type];
    if (!Parser) {
      throw new Error(`No parser available for type: ${type}`);
    }
    return new Parser(file, content);
  }

  static async detectReportType(
    file: File,
    content: string
  ): Promise<ReportType | null> {
    const fileName = file.name.toLowerCase();
    const fileContent = content.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isImageOrPdf = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'pdf'].includes(extension);
    
    // For OCR-processed content, use more flexible pattern matching with regex
    // to account for potential OCR errors and spacing issues
    
    // Check for DNA report indicators with enhanced OCR detection
    const dnaPatterns = [
      /\brs\d+\b/, // rsid pattern
      /\bgenotype\b/,
      /\ballele\b/,
      /\bsnp\b/,
      /\bdna\b/,
      /\bgenetic\b/,
      /\bchromosome\b/,
      /\bgenom/,    // matches genome, genomic
      /23andme/i
    ];
    
    if (
      fileName.includes('dna') ||
      dnaPatterns.some(pattern => pattern.test(fileContent))
    ) {
      return 'DNA';
    }

    // Check for microbiome report indicators with enhanced OCR detection
    const microbiomePatterns = [
      /\bbacteria\b/,
      /\bmicrobiome\b/,
      /\bmicrobiota\b/,
      /\brelative\s*abundance\b/,
      /\bgut\s*(?:flora|health|bacteria)\b/,
      /\blactobacillus\b/,
      /\bbifidobacterium\b/,
      /\benterococcus\b/,
      /\bfirmicutes\b/,
      /\bbacteroidetes\b/
    ];
    
    if (
      fileName.includes('microbiome') ||
      microbiomePatterns.some(pattern => pattern.test(fileContent))
    ) {
      return 'MICROBIOME';
    }

    // Enhanced blood test markers detection for OCR content
    const bloodTestMarkers = [
      'cholesterol',
      'glucose',
      'hdl',
      'ldl',
      'triglycerides',
      'wbc',
      'rbc',
      'hemoglobin',
      'hematocrit',
      'platelets',
      'ast',
      'alt',
      'alkaline phosphatase',
      'bilirubin',
      'bun',
      'creatinine',
      'egfr',
      'a1c',
      'blood test',
      'complete blood count',
      'cbc',
      'metabolic panel',
      'comprehensive metabolic',
      'lipid panel',
      'liver function',
      'kidney function',
      'reference range',
      'normal range',
      'test result',
      'lab report',
      'mg/dl',
      'mmol/l',
      'units',
      'thyroid',
      'tsh',
      'free t4',
      'free t3',
      'vitamin d',
      'iron',
      'ferritin',
    ];

    // For OCR content, use more flexible matching with word boundaries
    if (isImageOrPdf) {
      if (bloodTestMarkers.some(marker => {
        // Create a regex with word boundaries for more accurate matching
        const regex = new RegExp(`\\b${marker.replace(/\s+/g, '\\s*')}\\b`, 'i');
        return regex.test(fileContent);
      })) {
        return 'BLOOD_TEST';
      }
    } else {
      // For structured data, use simpler string includes
      if (bloodTestMarkers.some(marker => fileContent.includes(marker))) {
        return 'BLOOD_TEST';
      }
    }

    // If no specific type detected, use file type hints
    if (['csv', 'xls', 'xlsx'].includes(extension)) {
      return 'BLOOD_TEST'; // Most common format for structured data
    }
    
    if (isImageOrPdf) {
      // For images and PDFs with no clear indicators, prefer blood test
      // as it's the most common health report type
      return 'BLOOD_TEST';
    }

    return null;
  }
}
