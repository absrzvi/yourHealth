import { describe, it, expect } from 'vitest';
import { MicrobiomeReportParser } from '../../lib/parsers/MicrobiomeReportParser';
import { Biomarker } from '../../types/health';

const sampleJSON = JSON.stringify({
  sample_date: '2024-05-01',
  bacteria: [
    { taxon: 'Bacteroides', abundance: 0.23 },
    { taxon: 'Firmicutes', abundance: 0.45 },
    { taxon: 'Lactobacillus', abundance: 0.02 }
  ]
});

describe('MicrobiomeReportParser', () => {
  it('parses a valid microbiome JSON and extracts bacteria', async () => {
    const parser = new MicrobiomeReportParser();
    const biomarkers: Biomarker[] = await parser.parse(sampleJSON);
    expect(biomarkers).toHaveLength(3);
    expect(biomarkers[0]).toMatchObject({ name: 'Bacteroides', value: 0.23, source: 'MICROBIOME' });
    expect(biomarkers[1]).toMatchObject({ name: 'Firmicutes', value: 0.45, source: 'MICROBIOME' });
    expect(biomarkers[2]).toMatchObject({ name: 'Lactobacillus', value: 0.02, source: 'MICROBIOME' });
  });

  it('returns empty array for invalid JSON', async () => {
    const parser = new MicrobiomeReportParser();
    await expect(parser.parse('not a json')).rejects.toThrow('Invalid JSON format for microbiome report');
  });
});
