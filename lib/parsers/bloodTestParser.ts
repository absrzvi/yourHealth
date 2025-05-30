import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { BloodTestReportData, ParserResult } from './types';
import { BaseParser } from './baseParser';

export class BloodTestParser extends BaseParser<BloodTestReportData> {
  private parsedData: any;

  async parse(): Promise<ParserResult> {
    try {
      // Try to parse as CSV first
      try {
        this.parsedData = parse(this.content, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } catch (e) {
        // If CSV parsing fails, try to extract data using regex patterns
        return this.parseWithRegex();
      }

      // If we have valid CSV data, process it
      if (Array.isArray(this.parsedData) && this.parsedData.length > 0) {
        return this.parseCsvData();
      }

      return this.error('Could not parse the blood test report');
    } catch (error) {
      console.error('Error parsing blood test report:', error);
      return this.error('Failed to parse blood test report');
    }
  }

  private parseCsvData(): ParserResult {
    const biomarkers = this.parsedData.map((row: any) => {
      // Try to determine the structure of the CSV
      const name = row['Test Name'] || row['Analyte'] || row['Biomarker'] || '';
      const value = this.parseNumber(row['Result'] || row['Value'] || '') || 0;
      const unit = row['Unit'] || row['Units'] || '';
      const range = row['Reference Range'] || row['Range'] || '';
      
      return {
        name: name.trim(),
        value,
        unit: unit.trim(),
        referenceRange: range,
        status: this.determineStatus(value, range)
      };
    }).filter((b: any) => b.name);

    return this.success({
      type: 'BLOOD_TEST',
      biomarkers,
      metadata: {
        parsedAt: new Date().toISOString(),
        parser: 'BloodTestParser',
        format: 'CSV'
      }
    });
  }

  private parseWithRegex(): ParserResult {
    // Common blood test patterns
    const patterns = {
      // Lipid Panel
      totalCholesterol: /(?:total\s*)?cholesterol[\s\S]*?([\d.,]+)\s*(?:mg\/dL|mmol\/L)?/i,
      ldl: /(?:ldl|low[\s-]density[\s-]?lipoprotein)[\s\S]*?([\d.,]+)\s*(?:mg\/dL|mmol\/L)?/i,
      hdl: /(?:hdl|high[\s-]density[\s-]?lipoprotein)[\s\S]*?([\d.,]+)\s*(?:mg\/dL|mmol\/L)?/i,
      triglycerides: /triglycerides?[\s\S]*?([\d.,]+)\s*(?:mg\/dL|mmol\/L)?/i,
      
      // Metabolic Panel
      glucose: /glucose[\s\S]*?([\d.,]+)\s*(?:mg\/dL|mmol\/L)?/i,
      a1c: /(?:a1c|hba1c|hemoglobin[\s-]?a1c)[\s\S]*?([\d.,]+)\s*%?/i,
      
      // Liver Function
      ast: /(?:ast|sgot)[\s\S]*?([\d.,]+)\s*(?:U\/L|IU\/L)?/i,
      alt: /(?:alt|sgpt)[\s\S]*?([\d.,]+)\s*(?:U\/L|IU\/L)?/i,
      alp: /(?:alp|alkaline[\s-]phosphatase)[\s\S]*?([\d.,]+)\s*(?:U\/L|IU\/L)?/i,
      bilirubin: /bilirubin[\s\S]*?([\d.,]+)\s*(?:mg\/dL|umol\/L)?/i,
      
      // Kidney Function
      bun: /(?:bun|blood[\s-]urea[\s-]?nitrogen)[\s\S]*?([\d.,]+)\s*(?:mg\/dL|mmol\/L)?/i,
      creatinine: /creatinine[\s\S]*?([\d.,]+)\s*(?:mg\/dL|umol\/L)?/i,
      egfr: /(?:egfr|estimated[\s-]gfr)[\s\S]*?([\d.,]+)\s*(?:mL\/min)?/i,
      
      // Complete Blood Count (CBC)
      wbc: /(?:wbc|white[\s-]blood[\s-]?cells?)[\s\S]*?([\d.,]+)\s*(?:K\/uL|10\^3\/uL|10\^9\/L)?/i,
      rbc: /(?:rbc|red[\s-]blood[\s-]?cells?)[\s\S]*?([\d.,]+)\s*(?:M\/uL|10\^6\/uL|10\^12\/L)?/i,
      hemoglobin: /hemoglobin[\s\S]*?([\d.,]+)\s*(?:g\/dL|g\/L)?/i,
      hematocrit: /hematocrit[\s\S]*?([\d.,]+)\s*%?/i,
      platelets: /platelets?[\s\S]*?([\d.,]+)\s*(?:K\/uL|10\^3\/uL|10\^9\/L)?/i,
    };

    const biomarkers = Object.entries(patterns)
      .map(([key, pattern]) => {
        const match = this.content.match(pattern);
        if (!match) return null;
        
        const value = this.parseNumber(match[1]);
        if (value === null) return null;
        
        return {
          name: this.formatBiomarkerName(key),
          value,
          unit: this.getBiomarkerUnit(key, match[0]),
        };
      })
      .filter(Boolean);

    if (biomarkers.length === 0) {
      return this.error('No recognizable blood test data found');
    }

    return this.success({
      type: 'BLOOD_TEST',
      biomarkers,
      metadata: {
        parsedAt: new Date().toISOString(),
        parser: 'BloodTestParser',
        format: 'TEXT'
      }
    });
  }

  private formatBiomarkerName(key: string): string {
    const names: Record<string, string> = {
      totalCholesterol: 'Total Cholesterol',
      ldl: 'LDL Cholesterol',
      hdl: 'HDL Cholesterol',
      triglycerides: 'Triglycerides',
      glucose: 'Glucose',
      a1c: 'Hemoglobin A1c',
      ast: 'AST',
      alt: 'ALT',
      alp: 'Alkaline Phosphatase',
      bilirubin: 'Bilirubin',
      bun: 'Blood Urea Nitrogen',
      creatinine: 'Creatinine',
      egfr: 'eGFR',
      wbc: 'White Blood Cells',
      rbc: 'Red Blood Cells',
      hemoglobin: 'Hemoglobin',
      hematocrit: 'Hematocrit',
      platelets: 'Platelets',
    };
    return names[key] || key;
  }

  private getBiomarkerUnit(key: string, match: string): string {
    const unitMap: Record<string, string> = {
      totalCholesterol: 'mg/dL',
      ldl: 'mg/dL',
      hdl: 'mg/dL',
      triglycerides: 'mg/dL',
      glucose: 'mg/dL',
      a1c: '%',
      ast: 'U/L',
      alt: 'U/L',
      alp: 'U/L',
      bilirubin: 'mg/dL',
      bun: 'mg/dL',
      creatinine: 'mg/dL',
      egfr: 'mL/min/1.73m²',
      wbc: 'K/µL',
      rbc: 'M/µL',
      hemoglobin: 'g/dL',
      hematocrit: '%',
      platelets: 'K/µL',
    };

    // Try to extract unit from the match
    const unitMatch = match.match(/([a-zA-Z%²µ\/]+)$/);
    return unitMatch ? unitMatch[1].trim() : unitMap[key] || '';
  }

  private determineStatus(value: number, range: string): 'high' | 'normal' | 'low' | undefined {
    if (!range) return undefined;
    
    // Handle different range formats:
    // 1. 3.5-5.5
    // 2. < 5.5
    // 3. > 3.5
    // 4. 3.5 - 5.5
    // 5. 3.5 to 5.5
    
    // Clean up the range string
    const cleanRange = range
      .replace(/\s*to\s*/g, '-')
      .replace(/\s*\-\s*/g, '-')
      .replace(/[^0-9.<>\-]/g, '');

    // Check for less than format (<X)
    const lessThanMatch = cleanRange.match(/<([0-9.]+)/);
    if (lessThanMatch) {
      const max = parseFloat(lessThanMatch[1]);
      return value < max ? 'normal' : 'high';
    }

    // Check for greater than format (>X)
    const greaterThanMatch = cleanRange.match(/>([0-9.]+)/);
    if (greaterThanMatch) {
      const min = parseFloat(greaterThanMatch[1]);
      return value > min ? 'normal' : 'low';
    }

    // Check for range format (X-Y)
    const rangeMatch = cleanRange.match(/([0-9.]+)-([0-9.]+)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      if (value < min) return 'low';
      if (value > max) return 'high';
      return 'normal';
    }

    return undefined;
  }
}
