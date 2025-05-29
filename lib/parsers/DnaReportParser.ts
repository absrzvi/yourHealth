import { Biomarker } from '../../types/health';
import { BaseParser } from './BaseParser';

/**
 * Parses 23andMe/Ancestry-style DNA CSV files.
 * Typical columns: rsid, chromosome, position, genotype
 * We'll extract select SNPs as biomarkers for demo purposes.
 */
export class DnaReportParser extends BaseParser {
  private knownSnps = new Set([
    'rs9939609', // FTO gene, obesity
    'rs662799',  // APOA5, triglycerides
    'rs1801133', // MTHFR, folate metabolism
    'rs429358',  // APOE, Alzheimer's risk
  ]);

  async parse(csvContent: string): Promise<Biomarker[]> {
    const lines = csvContent.split('\n').filter(line => !line.startsWith('#') && line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const biomarkers: Biomarker[] = [];
    const date = new Date();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => row[header] = values[idx] || '');
      const rsid = row['rsid'];
      if (this.knownSnps.has(rsid)) {
        biomarkers.push({
          name: rsid,
          value: this.genotypeToNumeric(row['genotype']),
          unit: 'allele',
          date,
          source: 'DNA',
        });
      }
    }
    return biomarkers;
  }

  // Converts genotype to numeric value for correlation (e.g., AA=0, AG=1, GG=2)
  private genotypeToNumeric(genotype: string): number {
    if (genotype === 'AA') return 0;
    if (genotype === 'AG' || genotype === 'GA') return 1;
    if (genotype === 'GG') return 2;
    return NaN;
  }
}
