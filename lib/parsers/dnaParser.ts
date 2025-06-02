import { DNAReportData, ParserResult } from './types';
import { BaseParser } from './baseParser';

export class DNAParser extends BaseParser<DNAReportData> {
  async parse(): Promise<ParserResult> {
    try {
      // Use OCR first approach - extract variants from OCR text content
      const variants = this.extractVariantsWithRegex();
      
      // If OCR didn't find variants, try structured parsing as fallback
      if (variants.length === 0) {
        const structuredVariants = this.extractVariants();
        if (structuredVariants.length > 0) {
          return this.success({
            type: 'DNA',
            variants: structuredVariants,
            metadata: {
              parsedAt: new Date().toISOString(),
              parser: 'DNAParser',
              variantCount: structuredVariants.length,
              source: this.file.name,
              format: 'STRUCTURED'
            }
          });
        }
        return this.error('No genetic variants found in the report');
      }

      return this.success({
        type: 'DNA',
        variants,
        metadata: {
          parsedAt: new Date().toISOString(),
          parser: 'DNAParser',
          variantCount: variants.length,
          source: this.file.name,
          format: 'OCR'
        }
      });
    } catch (error) {
      console.error('Error parsing DNA report:', error);
      return this.error('Failed to parse DNA report');
    }
  }

  private extractVariants() {
    // Common DNA report formats to handle:
    // 1. 23andMe/AncestryDNA TSV
    // 2. VCF (Variant Call Format)
    // 3. Custom CSV/TSV with rsid, genotype columns

    const content = this.content;
    const lines = content.split('\n');
    
    // Skip empty lines and comments
    const dataLines = lines.filter(line => 
      line.trim() !== '' && 
      !line.startsWith('#') && 
      !line.startsWith('##')
    );

    // Try to detect format based on header
    const header = dataLines[0]?.toLowerCase() || '';
    
    if (header.includes('rsid') && (header.includes('genotype') || header.includes('allele'))) {
      // Likely 23andMe/AncestryDNA format
      return this.parse23andMeFormat(dataLines);
    } else if (header.startsWith('#chr\t') || header.startsWith('chr\t')) {
      // Likely VCF format
      return this.parseVCFFormat(dataLines);
    } else if (header.includes(',')) {
      // Try CSV format
      return this.parseCSVFormat(dataLines);
    } else if (header.includes('\t')) {
      // Try TSV format
      return this.parseTSVFormat(dataLines);
    }

    // Fallback: Try to extract variants using regex patterns
    return this.extractVariantsWithRegex();
  }

  private parse23andMeFormat(lines: string[]) {
    const variants = [];
    const header = lines[0].toLowerCase().split('\t');
    
    // Find column indices
    const rsidIndex = header.findIndex(col => col === 'rsid' || col === 'rsid');
    const chromosomeIndex = header.findIndex(col => col.includes('chromosome') || col === 'chrom');
    const positionIndex = header.findIndex(col => col === 'position' || col === 'pos');
    const genotypeIndex = header.findIndex(col => col === 'genotype' || col === 'alleles');
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split('\t');
      if (columns.length < Math.max(rsidIndex, chromosomeIndex, positionIndex, genotypeIndex)) continue;
      
      const rsid = columns[rsidIndex]?.trim();
      const chromosome = columns[chromosomeIndex]?.trim();
      const position = columns[positionIndex]?.trim();
      const genotype = columns[genotypeIndex]?.trim().toUpperCase();
      
      if (!rsid || !genotype || genotype === '--' || genotype === '00') continue;
      
      variants.push({
        gene: this.mapRsidToGene(rsid),
        rsid,
        genotype,
        chromosome,
        position: position ? parseInt(position, 10) : undefined,
        significance: this.determineSignificance(rsid, genotype)
      });
    }
    
    return variants;
  }

  private parseVCFFormat(lines: string[]) {
    const variants = [];
    const header = lines[0].startsWith('#') ? lines[0].slice(1) : lines[0];
    const headerCols = header.split('\t');
    
    // VCF format: CHROM POS ID REF ALT QUAL FILTER INFO FORMAT [SAMPLE1, SAMPLE2, ...]
    const chromIndex = 0;
    const posIndex = 1;
    const idIndex = 2;
    const refIndex = 3;
    const altIndex = 4;
    const formatIndex = 8;
    const sampleIndex = 9;
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith('#')) continue;
      
      const columns = lines[i].split('\t');
      if (columns.length < sampleIndex + 1) continue;
      
      const rsid = columns[idIndex] || '';
      if (!rsid.startsWith('rs')) continue; // Skip non-RSID entries
      
      const format = columns[formatIndex].split(':');
      const sampleData = columns[sampleIndex].split(':');
      const gtIndex = format.indexOf('GT');
      
      if (gtIndex === -1) continue;
      
      let genotype = sampleData[gtIndex] || '';
      // Convert genotype to standard format (e.g., 0/1 -> A/G)
      const ref = columns[refIndex];
      const alt = columns[altIndex];
      const alleles = [ref, ...alt.split(',')];
      
      genotype = genotype.replace(/\|/g, '/') // Normalize separator
        .split('/')
        .map(g => {
          const idx = parseInt(g, 10);
          return !isNaN(idx) && alleles[idx] ? alleles[idx] : g;
        })
        .join('/');
      
      variants.push({
        gene: this.mapRsidToGene(rsid),
        rsid,
        genotype,
        chromosome: columns[chromIndex],
        position: parseInt(columns[posIndex], 10),
        significance: this.determineSignificance(rsid, genotype)
      });
    }
    
    return variants;
  }

  private parseCSVFormat(lines: string[]) {
    return this.parseDelimitedFormat(lines, ',');
  }

  private parseTSVFormat(lines: string[]) {
    return this.parseDelimitedFormat(lines, '\t');
  }

  private parseDelimitedFormat(lines: string[], delimiter: string) {
    const variants = [];
    const header = lines[0].toLowerCase().split(delimiter);
    
    // Try to find relevant columns
    const rsidIndex = header.findIndex(col => 
      col.includes('rsid') || col.includes('rs#') || col.includes('snp')
    );
    const geneIndex = header.findIndex(col => 
      col.includes('gene') || col.includes('symbol')
    );
    const genotypeIndex = header.findIndex(col => 
      col.includes('genotype') || col.includes('allele') || col.includes('call')
    );
    
    if (rsidIndex === -1 || genotypeIndex === -1) {
      return []; // Not a valid format
    }
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(delimiter);
      if (columns.length <= Math.max(rsidIndex, geneIndex, genotypeIndex)) continue;
      
      const rsid = columns[rsidIndex]?.trim();
      const gene = geneIndex !== -1 ? columns[geneIndex]?.trim() : undefined;
      let genotype = columns[genotypeIndex]?.trim().toUpperCase();
      
      if (!rsid || !genotype || genotype === '--' || genotype === '00') continue;
      
      // Clean up genotype
      genotype = genotype
        .replace(/[\[\]\{\}]/g, '')
        .replace(/\s+/g, '');
      
      variants.push({
        gene: gene || this.mapRsidToGene(rsid),
        rsid,
        genotype,
        significance: this.determineSignificance(rsid, genotype)
      });
    }
    
    return variants;
  }

  private extractVariantsWithRegex() {
    const variants = [];
    const rsidPattern = /(rs\d+)/gi;
    const genotypePattern = /[ACGT]{1,2}(?:[\/\|][ACGT]{1,2})?/g;
    
    // Find all RSIDs and their context - use a more compatible approach than matchAll
    let match;
    const rsidMatches = [];
    
    // Use exec in a loop instead of matchAll for better compatibility
    while ((match = rsidPattern.exec(this.content)) !== null) {
      rsidMatches.push(match);
    }
    
    for (const match of rsidMatches) {
      const rsid = match[0];
      const context = this.getContext(match.index || 0, 100);
      
      // Try to find genotype near the RSID
      const genotypeMatch = context.match(genotypePattern);
      if (!genotypeMatch) continue;
      
      // Take the first genotype match near the RSID
      const genotype = genotypeMatch[0];
      
      variants.push({
        gene: this.mapRsidToGene(rsid),
        rsid,
        genotype,
        significance: this.determineSignificance(rsid, genotype)
      });
    }
    
    return variants;
  }

  private getContext(index: number, length: number) {
    const start = Math.max(0, index - length);
    const end = Math.min(this.content.length, index + length);
    return this.content.substring(start, end);
  }

  private mapRsidToGene(rsid: string): string {
    // Simple mapping of common RSIDs to genes
    // In a real application, this would be a database lookup or API call
    const rsidToGene: Record<string, string> = {
      'rs7412': 'APOE',
      'rs429358': 'APOE',
      'rs1801133': 'MTHFR',
      'rs1801131': 'MTHFR',
      'rs9939609': 'FTO',
      'rs7903146': 'TCF7L2',
      'rs12255372': 'TCF7L2',
      'rs7901695': 'TCF7L2',
      'rs1799971': 'OPRM1',
      'rs4680': 'COMT',
      'rs6265': 'BDNF',
      'rs53576': 'OXTR',
      'rs1815739': 'ACTN3',
      'rs1800497': 'ANKK1',
      'rs1805007': 'MC1R',
      'rs1805008': 'MC1R',
      'rs1805009': 'MC1R',
      'rs1805005': 'MC1R',
      'rs1805006': 'MC1R'
    };
    
    return rsidToGene[rsid.toLowerCase()] || 'Unknown';
  }

  private determineSignificance(rsid: string, genotype: string): 'beneficial' | 'risk' | 'neutral' {
    // Simple determination based on known risk alleles
    // In a real application, this would be more sophisticated
    const riskGenotypes: Record<string, string[]> = {
      'rs7412': ['C/C'],  // APOE ε4/ε4
      'rs429358': ['C/C'], // APOE ε4/ε4
      'rs1801133': ['T/T'], // MTHFR C677T homozygous
      'rs1801131': ['C/C'], // MTHFR A1298C homozygous
      'rs9939609': ['A/A', 'A/T'], // FTO obesity risk
      'rs1799971': ['G/G'] // OPRM1 A118G - reduced opioid response
    };
    
    const beneficialGenotypes: Record<string, string[]> = {
      'rs7412': ['T/T'],  // APOE ε2/ε2 (protective)
      'rs429358': ['T/T'], // APOE ε2/ε2 (protective)
      'rs1801133': ['C/C'], // MTHFR C677T normal
      'rs1801131': ['A/A'], // MTHFR A1298C normal
      'rs9939609': ['T/T'], // FTO non-risk
      'rs1799971': ['A/A'] // OPRM1 A118G - normal opioid response
    };
    
    if (riskGenotypes[rsid]?.includes(genotype)) {
      return 'risk';
    }
    
    if (beneficialGenotypes[rsid]?.includes(genotype)) {
      return 'beneficial';
    }
    
    return 'neutral';
  }
}
