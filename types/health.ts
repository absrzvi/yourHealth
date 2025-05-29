export type Biomarker = {
  name: string;
  value: number;
  unit: string;
  referenceRange?: {
    min: number;
    max: number;
    unit: string;
  };
  flagged?: 'high' | 'low' | 'normal';
  date: Date;
  source: 'BLOOD_TEST' | 'DNA' | 'MICROBIOME' | 'USER_INPUT';
};

export type CorrelationResult = {
  variableA: string;
  variableB: string;
  coefficient: number;  // Pearson's r value between -1 and 1
  pValue: number;       // Statistical significance
  sampleSize: number;   // Number of data points used
  lastUpdated: Date;
};

export type HealthMetric = {
  name: string;
  value: number;
  unit: string;
  description?: string;
  optimalRange?: {
    min: number;
    max: number;
  };
};
