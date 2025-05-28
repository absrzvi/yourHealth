export interface Biomarker {
  id: string;
  name: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
    optimalMin?: number;
    optimalMax?: number;
  };
  category: 'hormone' | 'vitamin' | 'mineral' | 'metabolic' | 'genetic' | 'inflammatory';
  testDate: Date;
  labName?: string;
  confidence: number; // 0-1 extraction confidence
  flags?: string[];
}
