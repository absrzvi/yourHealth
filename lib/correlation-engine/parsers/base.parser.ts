// Base parser interface and abstract class for health data files
import { TestResult } from '../types/test-result.types';

export interface Parser {
  parse(file: File | Blob): Promise<TestResult>;
  readonly type: string;
}

export abstract class BaseParser implements Parser {
  abstract readonly type: string;
  abstract parse(file: File | Blob): Promise<TestResult>;
}
