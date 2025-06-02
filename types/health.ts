// Health Metric Types
export type HealthMetricType = 'blood_test' | 'vital_sign' | 'lab_result' | 'biomarker' | 'other';

export interface HealthMetric {
  id: string;
  userId: string;
  type: HealthMetricType;
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// DNA Sequence Types
export interface DNASequence {
  id: string;
  userId: string;
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
  createdAt: Date | string;
}

// Microbiome Types
export type SampleType = 'stool' | 'oral_swab' | 'skin_swab' | 'other';

export interface MicrobiomeOrganism {
  id: string;
  sampleId: string;
  name: string;
  taxaLevel: string;
  abundance: number;
  relativeAbundance?: number;
  createdAt: Date | string;
}

export interface MicrobiomeSample {
  id: string;
  userId: string;
  sampleDate: Date | string;
  sampleType: SampleType;
  diversityScore?: number;
  organisms: MicrobiomeOrganism[];
  createdAt: Date | string;
}

// Health Summary Types
export interface HealthSummary {
  metrics: Array<{
    type: string;
    name: string;
    value: string;
    unit?: string;
    date: Date | string;
  }>;
  dnaSequences: {
    count: number;
  };
  latestMicrobiomeSamples: MicrobiomeSample[];
  latestInsight?: {
    id: string;
    weekNumber: number;
    year: number;
    cardiovascularScore?: number;
    metabolicScore?: number;
    inflammationScore?: number;
    recommendations?: string;
    generatedAt: Date | string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Chart Data Types
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  name?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'scatter' | 'area';
  color?: string;
}

export interface ChartConfig {
  title: string;
  type: 'line' | 'bar' | 'scatter' | 'area' | 'pie' | 'radar';
  xAxisTitle?: string;
  yAxisTitle?: string;
  series: ChartSeries[];
  height?: number;
  width?: number;
  showLegend?: boolean;
}
