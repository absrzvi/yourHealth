import { Biomarker } from '../../types/health';
import { BaseParser } from './BaseParser';

/**
 * Parses standard JSON microbiome reports (e.g., from uBiome, Viome, etc.)
 * Example structure:
 * {
 *   "sample_date": "2024-05-01",
 *   "bacteria": [
 *     { "taxon": "Bacteroides", "abundance": 0.23 },
 *     { "taxon": "Firmicutes", "abundance": 0.45 },
 *     ...
 *   ]
 * }
 */
export class MicrobiomeReportParser extends BaseParser {
  async parse(jsonContent: string): Promise<Biomarker[]> {
    let data: any;
    try {
      data = JSON.parse(jsonContent);
    } catch (e) {
      throw new Error('Invalid JSON format for microbiome report');
    }
    const date = data.sample_date ? new Date(data.sample_date) : new Date();
    if (!Array.isArray(data.bacteria)) return [];
    return data.bacteria.map((entry: any) => ({
      name: entry.taxon,
      value: typeof entry.abundance === 'number' ? entry.abundance : parseFloat(entry.abundance),
      unit: 'relative_abundance',
      date,
      source: 'MICROBIOME',
    }));
  }
}
