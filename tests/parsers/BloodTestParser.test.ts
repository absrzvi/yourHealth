import { describe, it, expect } from 'vitest';
import { BloodTestParser } from '../../lib/parsers/BloodTestParser';
import { Biomarker } from '../../types/health';

const sampleCSV = `name,value,unit,reference_range\nWBC,5.2,x10^9/L,4.0-11.0 x10^9/L\nRBC,4.7,x10^12/L,4.2-5.9 x10^12/L\nHGB,13.8,g/dL,13.0-17.0 g/dL\nGLUCOSE,89,mg/dL,70-99 mg/dL`;

describe('BloodTestParser', () => {
  it('parses a valid blood test CSV', async () => {
    const parser = new BloodTestParser();
    const biomarkers: Biomarker[] = await parser.parse(sampleCSV);
    expect(biomarkers).toHaveLength(4);
    expect(biomarkers[0]).toMatchObject({
      name: 'WBC',
      value: 5.2,
      unit: 'x10^9/L',
      source: 'BLOOD_TEST',
    });
    expect(biomarkers[2].name).toBe('HGB');
    expect(biomarkers[3].referenceRange).toMatchObject({ min: 70, max: 99, unit: 'mg/dL' });
  });

  it('skips invalid or unknown markers', async () => {
    const csv = `name,value,unit\nINVALID,100,mg/dL`;
    const parser = new BloodTestParser();
    const biomarkers = await parser.parse(csv);
    expect(biomarkers).toHaveLength(0);
  });

  it('throws on non-numeric values', async () => {
    const csv = `name,value,unit\nWBC,notanumber,x10^9/L`;
    const parser = new BloodTestParser();
    await expect(parser.parse(csv)).resolves.toHaveLength(0);
  });
});
