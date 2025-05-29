import { BaseParser } from './BaseParser';

type HormoneData = {
  biomarker: string;
  value: number;
  unit: string;
  range: string;
  status?: string;
  percentile?: number;
  marker_for?: string;
};

export class HormoneReportParser extends BaseParser {
  async parse(content: string): Promise<any[]> {
    try {
      const data = JSON.parse(content);
      const biomarkers: HormoneData[] = [];

      // Process estrogen metabolites
      if (data.hormone_metabolites?.estrogen_metabolites) {
        const estro = data.hormone_metabolites.estrogen_metabolites;
        biomarkers.push(...this.processHormoneSection(estro, 'Estrogen'));
      }

      // Process androgen metabolites
      if (data.hormone_metabolites?.androgen_metabolites) {
        const andro = data.hormone_metabolites.androgen_metabolites;
        biomarkers.push(...this.processHormoneSection(andro, 'Androgen'));
      }

      // Process progesterone metabolites
      if (data.hormone_metabolites?.progesterone_metabolites) {
        const prog = data.hormone_metabolites.progesterone_metabolites;
        biomarkers.push(...this.processHormoneSection(prog, 'Progesterone'));
      }

      // Process cortisol metabolites
      if (data.hormone_metabolites?.cortisol_metabolites) {
        const cort = data.hormone_metabolites.cortisol_metabolites;
        biomarkers.push(...this.processHormoneSection(cort, 'Cortisol'));
      }

      // Process organic acids
      if (data.organic_acids) {
        // Process B vitamins
        if (data.organic_acids.b_vitamins) {
          Object.entries(data.organic_acids.b_vitamins).forEach(([key, value]: [string, any]) => {
            biomarkers.push({
              biomarker: key,
              value: value.value,
              unit: '',
              range: value.range || '',
              status: value.status,
              marker_for: value.marker_for || ''
            });
          });
        }
        
        // Process neurotransmitters
        if (data.organic_acids.neurotransmitters) {
          Object.entries(data.organic_acids.neurotransmitters).forEach(([key, value]: [string, any]) => {
            biomarkers.push({
              biomarker: key,
              value: value.value,
              unit: '',
              range: value.range || '',
              status: value.status,
              marker_for: value.marker_for || ''
            });
          });
        }
      }

      return biomarkers;
    } catch (error) {
      console.error('Error parsing hormone report:', error);
      throw new Error('Failed to parse hormone report. Please ensure the file is a valid DUTCH report.');
    }
  }

  private processHormoneSection(section: Record<string, any>, prefix: string): HormoneData[] {
    return Object.entries(section).map(([key, value]: [string, any]) => ({
      biomarker: `${prefix} - ${key}`,
      value: value.value,
      unit: value.units || '',
      range: value.range || '',
      status: value.status,
      percentile: value.percentile
    }));
  }
}
