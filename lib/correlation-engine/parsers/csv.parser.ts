// CSV parser for lab test results
import { BaseParser } from './base.parser';
import { TestResult } from '../types/test-result.types';
import { TestResultSchema } from '../schemas/test-result.schema';
import Papa from 'papaparse';

export class CsvParser extends BaseParser {
  readonly type = 'csv';

  async parse(file: File | Blob): Promise<TestResult> {
    const text = await this.readFileAsText(file);
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (errors.length > 0) {
      throw new Error(`CSV parse error: ${errors.map(e => e.message).join('; ')}`);
    }
    // Assume each row is a biomarker, collect metadata from headers or file context
    const biomarkers = data.map((row: any) => ({
      id: row.id || row.name,
      name: row.name,
      value: parseFloat(row.value),
      unit: row.unit,
      referenceRange: {
        min: parseFloat(row.min),
        max: parseFloat(row.max),
        optimalMin: row.optimalMin ? parseFloat(row.optimalMin) : undefined,
        optimalMax: row.optimalMax ? parseFloat(row.optimalMax) : undefined,
      },
      category: row.category,
      testDate: row.testDate ? new Date(row.testDate) : new Date(),
      labName: row.labName,
      confidence: row.confidence ? parseFloat(row.confidence) : 1,
      flags: row.flags ? row.flags.split(';') : [],
    }));
    const testResult = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      userId: 'unknown',
      fileName: (file as File).name || 'uploaded.csv',
      fileType: 'csv',
      uploadDate: new Date(),
      processedDate: new Date(),
      status: 'completed',
      biomarkers,
      metadata: {
        labName: biomarkers[0]?.labName || '',
        testType: 'csv',
        originalFileName: (file as File).name || 'uploaded.csv',
        fileSize: (file as File).size || 0,
        processingTime: undefined,
      },
      errors: [],
    };
    // Validate with Zod
    const parsed = TestResultSchema.safeParse(testResult);
    if (!parsed.success) {
      throw new Error('Validation failed: ' + JSON.stringify(parsed.error.issues));
    }
    return parsed.data;
  }

  private async readFileAsText(file: File | Blob): Promise<string> {
    if (typeof window !== 'undefined' && file instanceof File) {
      return await file.text();
    } else {
      // Node.js Buffer or Blob
      return await (file as any).text();
    }
  }
}
