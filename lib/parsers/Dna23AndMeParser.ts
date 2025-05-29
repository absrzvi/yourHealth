import { BaseParser } from './BaseParser';

type SnpData = {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
  significance?: string;
  notes?: string;
};

export class Dna23AndMeParser extends BaseParser {
  private significantSnps: Record<string, { significance: string; notes: string }> = {
    'rs1801133': {
      significance: 'MTHFR C677T - Impacts folate metabolism',
      notes: 'AG or GG may indicate reduced MTHFR enzyme activity.'
    },
    'rs1801131': {
      significance: 'MTHFR A1298C - Impacts folate metabolism',
      notes: 'AC or CC may affect homocysteine levels.'
    },
    'rs4680': {
      significance: 'COMT Val158Met - Affects dopamine breakdown',
      notes: 'AG or GG may impact stress response and pain tolerance.'
    },
    'rs1800497': {
      significance: 'ANKK1/DRD2 - Affects dopamine receptor D2',
      notes: 'Associated with reward-seeking behavior and addiction risk.'
    },
    'rs53576': {
      significance: 'OXTR - Oxytocin receptor gene',
      notes: 'AA genotype may be associated with better social skills.'
    },
    'rs25531': {
      significance: 'SLC6A4 - Serotonin transporter',
      notes: 'Affects serotonin reuptake efficiency.'
    },
    'rs1799971': {
      significance: 'OPRM1 - Opioid receptor',
      notes: 'AA genotype may affect pain perception and response to opioids.'
    }
  };

  async parse(content: string): Promise<any[]> {
    const lines = content.split('\n').filter(line => 
      line.trim() !== '' && !line.startsWith('#')
    );

    const results: SnpData[] = [];
    const seenRsids = new Set<string>();

    for (const line of lines) {
      const [rsid, chromosome, position, genotype] = line.split('\t');
      
      // Skip if we've already processed this rsid or if data is malformed
      if (!rsid || seenRsids.has(rsid) || !genotype || genotype === '--') continue;
      
      const snpInfo = this.significantSnps[rsid];
      
      results.push({
        rsid,
        chromosome,
        position: parseInt(position, 10),
        genotype,
        ...(snpInfo ? {
          significance: snpInfo.significance,
          notes: snpInfo.notes
        } : {})
      });
      
      seenRsids.add(rsid);
    }

    // Sort by chromosome and position
    return results.sort((a, b) => {
      if (a.chromosome === b.chromosome) {
        return a.position - b.position;
      }
      return a.chromosome.localeCompare(b.chromosome);
    });
  }
}
