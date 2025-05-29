import { describe, it, expect } from 'vitest';
import { DnaReportParser } from '../../lib/parsers/DnaReportParser';
import { Biomarker } from '../../types/health';

const sampleDNA = `rsid,chromosome,position,genotype\nrs9939609,16,53786615,AA\nrs662799,11,116792662,AG\nrs1801133,1,11856378,GG\nrs429358,19,45411941,GA\nrs123456,1,12345678,TT`;

describe('DnaReportParser', () => {
  it('parses a valid DNA CSV and extracts known SNPs', async () => {
    const parser = new DnaReportParser();
    const biomarkers: Biomarker[] = await parser.parse(sampleDNA);
    expect(biomarkers).toHaveLength(4);
    expect(biomarkers[0]).toMatchObject({ name: 'rs9939609', value: 0, source: 'DNA' });
    expect(biomarkers[1]).toMatchObject({ name: 'rs662799', value: 1, source: 'DNA' });
    expect(biomarkers[2]).toMatchObject({ name: 'rs1801133', value: 2, source: 'DNA' });
    expect(biomarkers[3]).toMatchObject({ name: 'rs429358', value: 1, source: 'DNA' });
  });

  it('ignores unknown SNPs', async () => {
    const parser = new DnaReportParser();
    const biomarkers = await parser.parse('rsid,chromosome,position,genotype\nrs999999,1,12345,AA');
    expect(biomarkers).toHaveLength(0);
  });
});
