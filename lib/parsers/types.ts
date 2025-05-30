export type ReportType = 'DNA' | 'BLOOD_TEST' | 'MICROBIOME';

export interface BaseReportData {
  type: ReportType;
  labName?: string;
  testDate?: Date;
  metadata: Record<string, unknown>;
}

export interface DNAReportData extends BaseReportData {
  type: 'DNA';
  variants: {
    gene: string;
    rsid: string;
    genotype: string;
    significance?: 'beneficial' | 'risk' | 'neutral';
  }[];
}

export interface BloodTestReportData extends BaseReportData {
  type: 'BLOOD_TEST';
  biomarkers: {
    name: string;
    value: number;
    unit: string;
    referenceRange?: string;
    status?: 'high' | 'normal' | 'low';
  }[];
}

export interface MicrobiomeReportData extends BaseReportData {
  type: 'MICROBIOME';
  bacteria: {
    name: string;
    abundance: number;
    relativeAbundance: number;
    beneficial: boolean;
  }[];
}

export type ReportData = DNAReportData | BloodTestReportData | MicrobiomeReportData;

export interface ParserResult {
  success: boolean;
  data?: ReportData;
  error?: string;
}
