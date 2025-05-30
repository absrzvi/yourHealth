import { ParserResult, ReportData } from './types';

export abstract class BaseParser<T extends ReportData> {
  protected file: File;
  protected content: string;

  constructor(file: File, content: string) {
    this.file = file;
    this.content = content;
  }

  abstract parse(): Promise<ParserResult>;

  protected success(data: T): ParserResult {
    return {
      success: true,
      data: {
        ...data,
        metadata: {
          fileName: this.file.name,
          fileSize: this.file.size,
          fileType: this.file.type,
          lastModified: this.file.lastModified,
          ...(data.metadata || {})
        }
      }
    };
  }

  protected error(message: string): ParserResult {
    return {
      success: false,
      error: message
    };
  }

  protected parseNumber(value: string): number | null {
    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? null : num;
  }

  protected extractValueUnit(str: string): { value: number | null; unit: string } {
    const match = str.match(/([0-9.,]+)\s*([a-zA-Z%\/]*)/);
    if (!match) return { value: null, unit: '' };
    return {
      value: parseFloat(match[1].replace(',', '.')),
      unit: match[2].trim()
    };
  }
}
