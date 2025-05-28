// PDF parser for lab test results
import { BaseParser } from './base.parser';
import { TestResult } from '../types/test-result.types';

export class PdfParser extends BaseParser {
  readonly type = 'pdf';
  async parse(file: File | Blob): Promise<TestResult> {
    // TODO: Implement PDF parsing logic
    throw new Error('PDF parsing not implemented');
  }
}
