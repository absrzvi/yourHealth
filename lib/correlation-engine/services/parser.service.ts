// Service for orchestrating file parsing
import { TestResult } from '../types/test-result.types';
import { getParser } from '../parsers/parser.factory';

export class ParserService {
  /**
   * Processes an uploaded file using the appropriate parser and returns a validated TestResult.
   * @param file The uploaded file (CSV, PDF, etc.)
   * @param fileType The file type ('csv', 'pdf', ...)
   */
  async processFile(file: File | Blob, fileType: string): Promise<TestResult> {
    try {
      const parser = getParser(fileType);
      const result = await parser.parse(file);
      return result;
    } catch (error: any) {
      // Add error logging or rethrow as needed
      throw new Error(`ParserService error: ${error.message}`);
    }
  }
}
