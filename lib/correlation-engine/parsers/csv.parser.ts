// CSV parser for lab test results
import { BaseParser } from './base.parser';
import { TestResult } from '../types/test-result.types';

export class CsvParser extends BaseParser {
  readonly type = 'csv';
  async parse(file: File | Blob): Promise<TestResult> {
    // TODO: Implement CSV parsing logic
    throw new Error('CSV parsing not implemented');
  }
}
