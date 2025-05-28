import { Biomarker } from './biomarker.types';

export interface BiomarkerReference {
  id: string;
  name: string;
}

export interface Correlation {
  id: string;
  biomarkerA: BiomarkerReference;
  biomarkerB: BiomarkerReference;
  coefficient: number;
  pValue: number;
  confidence: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  sampleSize: number;
  significance: boolean;
  insight?: CorrelationInsight;
}

export interface CorrelationInsight {
  summary: string;
  actionabilityScore: number;
  disclaimer?: string;
}
