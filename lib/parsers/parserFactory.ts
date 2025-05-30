import { BloodTestParser } from './bloodTestParser';
import { DNAParser } from './dnaParser';
import { MicrobiomeParser } from './microbiomeParser';
import { ParserResult, ReportType } from './types';

interface ParserConstructor {
  new (file: File, content: string): { parse: () => Promise<ParserResult> };
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

    // Check for DNA report indicators
    if (
      fileName.includes('dna') ||
      fileContent.includes('genotype') ||
      fileContent.includes('rsid') ||
      fileContent.includes('snp')
    ) {
      return 'DNA';
    }

    // Check for microbiome report indicators
    if (
      fileName.includes('microbiome') ||
      fileContent.includes('bacteria') ||
      fileContent.includes('microbiota') ||
      fileContent.includes('relative abundance')
    ) {
      return 'MICROBIOME';
    }

    // Default to blood test if common blood test markers are found
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
    ];

    if (bloodTestMarkers.some((marker) => fileContent.includes(marker))) {
      return 'BLOOD_TEST';
    }

    // If no specific type detected, try to determine by file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['csv', 'xls', 'xlsx', 'pdf'].includes(extension || '')) {
      return 'BLOOD_TEST'; // Most common format for blood tests
    }

    return null;
  }
}
