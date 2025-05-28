import { TestResult } from './test-result.types';
import { Correlation } from './correlation.types';

export interface UploadApiResponse {
  success: boolean;
  file?: string;
  testResult?: TestResult;
  correlations?: Correlation[];
  error?: string;
}
