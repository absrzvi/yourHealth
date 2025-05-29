import { Biomarker } from '../../types/health';

export abstract class BaseParser {
  abstract parse(file: Buffer | string): Promise<Biomarker[]>;
  
  protected normalizeValue(value: string | number): number {
    if (typeof value === 'number') return value;
    // Remove any non-numeric characters except decimal point and negative sign
    const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (isNaN(numericValue)) {
      throw new Error(`Failed to parse numeric value from: ${value}`);
    }
    return numericValue;
  }
  
  protected parseReferenceRange(range: string) {
    // Example: "3.5-5.5 x10^9/L" or "<1.0"
    const match = range.match(/([<>=]?)\s*([\d.]+)\s*-\s*([\d.]+)\s*(\S+)/);
    if (match) {
      return {
        min: parseFloat(match[2]),
        max: parseFloat(match[3]),
        unit: match[4].trim()
      };
    }
    return null;
  }
}
