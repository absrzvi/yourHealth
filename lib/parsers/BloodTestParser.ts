import { Biomarker } from '../../types/health';
import { BaseParser } from './BaseParser';

export class BloodTestParser extends BaseParser {
  private knownMarkers = new Set([
    'WBC', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'RDW', 
    'PLT', 'GLUCOSE', 'BUN', 'CREATININE', 'eGFR', 'AST', 'ALT'
  ]);

  async parse(csvContent: string): Promise<Biomarker[]> {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const biomarkers: Biomarker[] = [];
    const date = new Date(); // Would normally get this from the report
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header.toLowerCase()] = values[index] || '';
      });
      
      if (this.isValidBiomarkerRow(row)) {
        try {
          biomarkers.push(this.parseBiomarkerRow(row, date));
        } catch (error: any) {
          console.warn(`Skipping invalid biomarker row: ${error.message}`);
        }
      }
    }
    
    return biomarkers;
  }

  private isValidBiomarkerRow(row: Record<string, string>): boolean {
    const name = (row.name || row.test || '').toUpperCase().trim();
    return this.knownMarkers.has(name) && 
           !!row.value && 
           !isNaN(parseFloat(row.value));
  }

  private parseBiomarkerRow(row: Record<string, string>, date: Date): Biomarker {
    const name = (row.name || row.test || '').trim();
    const value = this.normalizeValue(row.value);
    const unit = row.unit || '';
    
    let referenceRange;
    if (row.reference_range) {
      referenceRange = this.parseReferenceRange(row.reference_range);
    }
    
    return {
      name,
      value,
      unit,
      referenceRange,
      date,
      source: 'BLOOD_TEST'
    };
  }
}
