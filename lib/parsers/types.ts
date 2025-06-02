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

export interface Remark {
  id: string;
  type: 'biomarker' | 'section' | 'general' | 'interpretation' | 'recommendation';
  content: string;
  associatedBiomarkers?: string[]; // Standard names of related biomarkers
  section?: string;
  confidence: number;
  source: 'direct' | 'inferred';
  keywords?: string[];
}

export interface ExtractedBiomarker {
  name: string; // The name as it appeared in the text
  standardName: string; // Standardized name from dictionary
  value: number; // Parsed numeric value
  rawValueString?: string; // The original string for the value, e.g., "1.23" or "14"
  unit: string;
  referenceRange?: string;
  status?: 'low' | 'normal' | 'high' | 'critical';
  confidence: number;
  category: string;
  rawLineText?: string; // The full line text from which biomarker was extracted
  remarkIds?: string[];
}

export interface BloodTestReportData extends BaseReportData {
  type: 'BLOOD_TEST';
  biomarkers: ExtractedBiomarker[];
  remarks: Remark[];
  metadata: {
    parser: string;
    biomarkerCount: number;
    parsedAt: string;
    confidence?: number;
    sections?: string[];
    validation?: any;
    remarkCount?: number;
  };
  patientInfo?: {
    name?: string;
    age?: string;
    gender?: string;
    id?: string;
    dob?: string;
  };
  labInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    reportDate?: string;
    accessionNumber?: string;
  };
  criticalFindings?: ExtractedBiomarker[];
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

export interface ReportSection {
  name: string;
  content: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export type ReportData = DNAReportData | BloodTestReportData | MicrobiomeReportData;

export interface ParserResult {
  success: boolean;
  data?: ReportData;
  error?: string;
  warnings?: string[];
}

export interface ValidationRule {
  name: string;
  description: string;
  validate: (biomarker: ExtractedBiomarker) => boolean;
  errorMessage: string;
  severity: 'warning' | 'error';
}
