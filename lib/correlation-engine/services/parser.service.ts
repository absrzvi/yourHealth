// Service for orchestrating file parsing
import { TestResult } from '../types/test-result.types';
import { getParser } from '../parsers/parser.factory';

export class ParserService {
  async processFile(file: File | Blob, fileType: string): Promise<TestResult> {
    const parser = getParser(fileType);
    return parser.parse(file);
  }
}
