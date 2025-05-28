import { describe, it, expect } from 'vitest';
import { CsvParser } from './csv.parser';

const csvSample = `name,value,unit,min,max,category,testDate,labName,confidence,flags
Glucose,90,mg/dL,70,99,metabolic,2025-05-01,LabCorp,1.0,flag1;flag2
Vitamin D,30,ng/mL,20,50,vitamin,2025-05-01,Quest,0.95,
`;

function makeFile(text: string, name = 'test.csv'): File {
  // Polyfill for Node.js environment
  try {
    return new File([text], name, { type: 'text/csv' });
  } catch {
    const blob = new Blob([text], { type: 'text/csv' });
    (blob as any).name = name;
    return blob as File;
  }
}

describe('CsvParser', () => {
  it('parses a valid CSV into TestResult', async () => {
    const parser = new CsvParser();
    const file = makeFile(csvSample);
    const result = await parser.parse(file);
    expect(result.biomarkers.length).toBe(2);
    expect(result.biomarkers[0].name).toBe('Glucose');
    expect(result.biomarkers[1].name).toBe('Vitamin D');
    expect(result.biomarkers[0].flags).toContain('flag1');
    expect(result.biomarkers[0].flags).toContain('flag2');
    expect(result.biomarkers[1].flags).toEqual([]);
    expect(result.metadata.labName).toBe('LabCorp');
    expect(result.fileType).toBe('csv');
  });
});
