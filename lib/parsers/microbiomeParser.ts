import { MicrobiomeReportData, ParserResult } from './types';
import { BaseParser } from './baseParser';

export class MicrobiomeParser extends BaseParser<MicrobiomeReportData> {
  async parse(): Promise<ParserResult> {
    try {
      // First try OCR-based extraction with regex - optimized for scanned documents and images
      const bacteriaFromOcr = this.extractWithRegex();
      
      if (bacteriaFromOcr && bacteriaFromOcr.length > 0) {
        return this.success({
          type: 'MICROBIOME',
          bacteria: bacteriaFromOcr,
          metadata: {
            parsedAt: new Date().toISOString(),
            parser: 'MicrobiomeParser',
            bacteriaCount: bacteriaFromOcr.length,
            source: this.file.name,
            format: 'OCR'
          }
        });
      }
      
      // Fallback to structured data extraction for CSV, TSV, JSON files
      const bacteria = this.extractBacteria();
      
      if (bacteria.length === 0) {
        return this.error('No microbiome data found in the report');
      }

      return this.success({
        type: 'MICROBIOME',
        bacteria,
        metadata: {
          parsedAt: new Date().toISOString(),
          parser: 'MicrobiomeParser',
          bacteriaCount: bacteria.length,
          source: this.file.name,
          format: 'STRUCTURED'
        }
      });
    } catch (error) {
      console.error('Error parsing microbiome report:', error);
      return this.error('Failed to parse microbiome report');
    }
  }

  private extractBacteria() {
    // Try different parsing strategies
    return (
      this.parseCSVFormat() ||
      this.parseTSVFormat() ||
      this.parseJSONFormat() ||
      this.extractWithRegex()
    );
  }

  private parseCSVFormat() {
    try {
      const csv = require('csv-parse/sync');
      const records = csv.parse(this.content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!records || records.length === 0) return null;

      // Try to detect relevant columns
      const firstRow = records[0];
      const nameKey = Object.keys(firstRow).find(key => 
        key.toLowerCase().includes('name') || 
        key.toLowerCase().includes('species') ||
        key.toLowerCase().includes('taxon')
      );
      
      const abundanceKey = Object.keys(firstRow).find(key => 
        key.toLowerCase().includes('abundance') || 
        key.toLowerCase().includes('count') ||
        key.toLowerCase().includes('reads')
      );
      
      const relativeKey = Object.keys(firstRow).find(key => 
        key.toLowerCase().includes('relative') || 
        key.toLowerCase().includes('percent') ||
        key.toLowerCase().includes('%')
      );

      if (!nameKey) return null;

      return records
        .map((row: any) => {
          const name = row[nameKey]?.trim();
          if (!name) return null;

          const abundance = abundanceKey ? this.parseNumber(row[abundanceKey]) || 0 : 0;
          const relativeAbundance = relativeKey 
            ? this.parseNumber(row[relativeKey]) || 0 
            : 0;

          return {
            name,
            abundance,
            relativeAbundance,
            beneficial: this.isBeneficialBacteria(name)
          };
        })
        .filter(Boolean);
    } catch (e) {
      console.debug('Failed to parse as CSV:', e);
      return null;
    }
  }

  private parseTSVFormat() {
    try {
      const lines = this.content.split('\n').filter(line => line.trim());
      if (lines.length < 2) return null;
      
      const header = lines[0].split('\t').map(h => h.trim());
      if (header.length < 2) return null;

      const nameIndex = header.findIndex(h => 
        h.toLowerCase().includes('name') || 
        h.toLowerCase().includes('species') ||
        h.toLowerCase().includes('taxon')
      );
      
      const abundanceIndex = header.findIndex(h => 
        h.toLowerCase().includes('abundance') || 
        h.toLowerCase().includes('count') ||
        h.toLowerCase().includes('reads')
      );
      
      const relativeIndex = header.findIndex(h => 
        h.toLowerCase().includes('relative') || 
        h.toLowerCase().includes('percent') ||
        h.includes('%')
      );

      if (nameIndex === -1) return null;

      return lines.slice(1)
        .map(line => {
          const cols = line.split('\t').map(c => c.trim());
          if (cols.length <= nameIndex) return null;
          
          const name = cols[nameIndex];
          if (!name) return null;

          const abundance = abundanceIndex !== -1 ? this.parseNumber(cols[abundanceIndex]) || 0 : 0;
          const relativeAbundance = relativeIndex !== -1 
            ? this.parseNumber(cols[relativeIndex]) || 0 
            : 0;

          return {
            name,
            abundance,
            relativeAbundance,
            beneficial: this.isBeneficialBacteria(name)
          };
        })
        .filter(Boolean);
    } catch (e) {
      console.debug('Failed to parse as TSV:', e);
      return null;
    }
  }

  private parseJSONFormat() {
    try {
      const data = JSON.parse(this.content);
      if (!data || typeof data !== 'object') return null;

      // Handle different JSON structures
      if (Array.isArray(data)) {
        // Array of bacteria objects
        return data.map(item => ({
          name: item.name || item.species || item.taxon || 'Unknown',
          abundance: typeof item.abundance === 'number' ? item.abundance : 0,
          relativeAbundance: typeof item.relativeAbundance === 'number' 
            ? item.relativeAbundance 
            : (typeof item.percent === 'number' ? item.percent : 0),
          beneficial: this.isBeneficialBacteria(item.name || item.species || '')
        }));
      } else if (data.bacteria || data.taxa) {
        // Object with bacteria/taxa array
        const bacteria = data.bacteria || data.taxa || [];
        return bacteria.map((item: any) => ({
          name: item.name || item.species || item.taxon || 'Unknown',
          abundance: typeof item.abundance === 'number' ? item.abundance : 0,
          relativeAbundance: typeof item.relativeAbundance === 'number' 
            ? item.relativeAbundance 
            : (typeof item.percent === 'number' ? item.percent : 0),
          beneficial: this.isBeneficialBacteria(item.name || item.species || '')
        }));
      } else if (data.report || data.results) {
        // Nested report structure
        const results = data.report?.results || data.results || [];
        return results.map((item: any) => ({
          name: item.name || item.species || item.taxon || 'Unknown',
          abundance: typeof item.count === 'number' ? item.count : 0,
          relativeAbundance: typeof item.relative_abundance === 'number' 
            ? item.relative_abundance 
            : (typeof item.percent === 'number' ? item.percent : 0),
          beneficial: this.isBeneficialBacteria(item.name || item.species || '')
        }));
      }
      
      return null;
    } catch (e) {
      console.debug('Failed to parse as JSON:', e);
      return null;
    }
  }

  private extractWithRegex() {
    // Fallback regex-based extraction for less structured data
    const bacteria: Array<{
      name: string;
      abundance: number;
      relativeAbundance: number;
      beneficial: boolean;
    }> = [];

    // Pattern for bacterial names followed by numbers (abundance/percentage)
    const pattern = /(\b[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*\b)[\s:]+(\d+(?:\.\d+)?)(?:\s*(?:%|percent|relative abundance|abundance))?/gi;
    
    let match;
    while ((match = pattern.exec(this.content)) !== null) {
      const name = match[1].trim();
      const value = parseFloat(match[2]);
      
      if (isNaN(value)) continue;
      
      // Check if this looks like a percentage or absolute count
      const isPercentage = match[0].toLowerCase().includes('%') || 
                          match[0].toLowerCase().includes('percent') ||
                          match[0].toLowerCase().includes('relative');
      
      bacteria.push({
        name,
        abundance: isPercentage ? 0 : value,
        relativeAbundance: isPercentage ? value : 0,
        beneficial: this.isBeneficialBacteria(name)
      });
    }

    return bacteria.length > 0 ? bacteria : null;
  }

  private isBeneficialBacteria(name: string): boolean {
    if (!name) return false;
    
    const lowerName = name.toLowerCase();
    
    // Common beneficial bacteria
    const beneficialGenera = [
      'lactobacillus', 'bifidobacterium', 'faecalibacterium', 
      'akkermansia', 'eubacterium', 'roseburia', 'prevotella',
      'bacteroides', 'ruminococcus', 'faecali'
    ];
    
    // Common potentially harmful bacteria
    const harmfulGenera = [
      'clostridium', 'escherichia', 'klebsiella', 'proteus',
      'pseudomonas', 'staphylococcus', 'streptococcus',
      'enterococcus', 'salmonella', 'shigella', 'campylobacter'
    ];
    
    // Check if the name contains any beneficial genera
    const isBeneficial = beneficialGenera.some(genus => 
      lowerName.includes(genus)
    );
    
    // Check if the name contains any harmful genera
    const isHarmful = harmfulGenera.some(genus => 
      lowerName.includes(genus)
    );
    
    // Consider it beneficial if it's beneficial and not harmful
    // Or if we can't determine, assume it's neutral/beneficial
    return isBeneficial || !isHarmful;
  }
}
