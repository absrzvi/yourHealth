import { Biomarker } from './biomarker.types';

export interface TestResult {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'csv' | 'json';
  uploadDate: Date;
  processedDate?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  biomarkers: Biomarker[];
  metadata: {
    labName?: string;
    testType?: string;
    originalFileName: string;
    fileSize: number;
    processingTime?: number;
  };
  errors?: ProcessingError[];
}

export interface ProcessingError {
  code: string;
  message: string;
}
