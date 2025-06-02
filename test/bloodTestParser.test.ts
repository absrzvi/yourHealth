import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { BloodTestParser } from '../lib/parsers/bloodTestParser';
import { Remark, ParserResult } from '../lib/parsers/types';
import * as fs from 'fs';
import * as path from 'path';

// Define sample data for tests
const sampleBloodTestText = `
PATIENT INFORMATION
Name: John Doe
DOB: 1980-01-01
ID: 123456789

LAB INFORMATION
Lab: Test Lab
Date: 2023-01-15
Report Date: 2023-01-15

TEST RESULTS
Glucose: 100 mg/dL (Reference: 70-99) HIGH
Cholesterol: 180 mg/dL (Reference: < 200) NORMAL

REMARKS
Glucose is elevated, consider follow-up testing.
All other values within normal range.
`;

// Initialize sample data
let sampleData: string;
try {
  sampleData = fs.readFileSync(path.join(__dirname, '../test-data/blood-test-sample.txt'), 'utf8');
} catch (error) {
  console.warn('Sample data file not found, using default test sample');
  sampleData = sampleBloodTestText;
}

// Define types needed for testing
interface PatientInfo {
  name: string;
  dob: string;
  id: string;
}

interface LabInfo {
  name: string;
  address: string;
  date: string;
  reportDate?: string;
}

interface ReportData {
  type: string;
  metadata: any;
  patientInfo: PatientInfo;
  labInfo: LabInfo;
}

// Updated interface to include all required properties for testing
interface ExtractedBiomarker {
  name: string;
  value: number;
  unit: string;
  referenceRange: string;
  status: string;
  confidence: number;
  standardName?: string;
  category?: string;
  metadata?: Record<string, any>;
  source?: string;
  associatedRemarks?: string[];
  remarkIds?: string[];
}

interface BloodTestReportData {
  type: string;
  biomarkers: Array<ExtractedBiomarker>;
  remarks: Array<{
    id?: string;
    content: string;
    type: string;
    confidence: number;
    associatedBiomarkers: string[];
    source: string;
  }>;
  patientInfo: PatientInfo;
  labInfo: LabInfo;
  metadata: {
    parser: string;
    validation: {
      totalBiomarkers: number;
      validBiomarkers: number;
      invalidBiomarkers: number;
      averageConfidence: number;
      criticalFindings: Array<{
        biomarker: string;
        severity: string;
        message: string;
      }>;
    };
  };
}

// Mock the TextPreprocessor
const mockTextPreprocessor = jest.fn().mockImplementation(() => {
  return {
    preprocessText: jest.fn().mockReturnValue('Preprocessed text'),
    detectOrientation: jest.fn().mockReturnValue('portrait'),
    extractSubsections: jest.fn(),
    calculateSectionConfidence: jest.fn()
  };
});

// Mock URL and matchMedia for browser environment
// Check if we're in a browser environment before setting these mocks
if (typeof window !== 'undefined') {
  // We're in jsdom environment
  (window as any).URL = { createObjectURL: jest.fn() };
} else {
  // We're in node environment
  (global as any).URL = { createObjectURL: jest.fn() };
}

// Define proper type for MediaQueryList mock
interface MockMediaQueryList {
  matches: boolean;
  media: string;
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null;
  addListener: (callback: (mql: MediaQueryList) => void) => void;
  removeListener: (callback: (mql: MediaQueryList) => void) => void;
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  dispatchEvent: (event: Event) => boolean;
}

const mockMatchMedia = jest.fn().mockImplementation((query: string): MockMediaQueryList => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    // Use explicit return type for the mock function
    dispatchEvent: jest.fn().mockImplementation((_: Event) => true) as unknown as (event: Event) => boolean,
  };
});

// Set up mocks based on environment
if (typeof window !== 'undefined') {
  // We're in jsdom environment, window is available
  window.matchMedia = mockMatchMedia as any;
} else {
  // We're in node environment
  (global as any).matchMedia = mockMatchMedia;
}

// Helper for creating a mock File object
function createMockFile(name: string, content: string): File {
  // For testing purposes, we can use this simplified mock
  return {
    name,
    size: content.length,
    type: 'text/plain',
    lastModified: Date.now(),
    slice: jest.fn(),
    // TypeScript doesn't like Promise<T> in place of functions, but for test mocks we can assert
    arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    stream: jest.fn(),
    text: jest.fn(() => Promise.resolve(content)),
    webkitRelativePath: ''
  } as unknown as File;
}

// Helper to associate remarks with biomarkers by simple keyword matching
function associateRemarksWithBiomarkers(remarks: Remark[], biomarkers: ExtractedBiomarker[]): Remark[] {
  return remarks.map(remark => {
    const content = remark.content.toLowerCase();
    const associatedBiomarkers: string[] = [];
    
    biomarkers.forEach(biomarker => {
      if (biomarker.name) {
        const biomarkerName = biomarker.name.toLowerCase();
        const standardName = biomarker.standardName?.toLowerCase() || '';
        
        if (content.includes(biomarkerName) || (standardName && content.includes(standardName))) {
          associatedBiomarkers.push(biomarker.name); // Use name instead of ID
        }
      }
    });
    
    return {
      ...remark,
      associatedBiomarkers
    };
  });
}

// Helper to identify sections likely containing remarks
function identifyRemarkSections(text: string): string[] {
  const lines = text.split('\n');
  const remarkSections: string[] = [];
  let inRemarkSection = false;
  let currentSection = '';
  
  for (const line of lines) {
    if (line.match(/remarks|interpretation|assessment|comments/i)) {
      inRemarkSection = true;
      if (currentSection) {
        remarkSections.push(currentSection);
      }
      currentSection = line;
    } else if (inRemarkSection) {
      currentSection += '\n' + line;
    }
  }
  
  if (currentSection) {
    remarkSections.push(currentSection);
  }
  
  return remarkSections;
}

// Helper for calculating biomarker status
function calculateStatus(value: number, referenceRange: string): string {
  if (!referenceRange) return 'unknown';
  
  if (referenceRange.includes('-')) {
    const [min, max] = referenceRange.split('-').map(Number);
    if (value < min) return 'low';
    if (value > max) return 'high';
    return 'normal';
  }
  
  if (referenceRange.includes('<')) {
    const max = Number(referenceRange.replace(/[^0-9.]/g, ''));
    return value > max ? 'high' : 'normal';
  }
  
  if (referenceRange.includes('>')) {
    const min = Number(referenceRange.replace(/[^0-9.]/g, ''));
    return value < min ? 'low' : 'normal';
  }
  
  return 'unknown';
}

// Helper for calculating confidence based on biomarker data quality
function calculateConfidence(biomarker: ExtractedBiomarker): number {
  let score = 0.5; // Base score
  
  // Having all the key fields increases confidence
  if (biomarker.name) score += 0.1;
  if (biomarker.value !== undefined) score += 0.1;
  if (biomarker.unit) score += 0.1;
  if (biomarker.referenceRange) score += 0.1;
  if (biomarker.standardName) score += 0.1;
  
  return Math.min(score, 1.0);
}

// Mock the SectionParser
interface ParsedSections {
  patientInfoSection: string;
  labInfoSection: string;
  resultsSection: string;
  remarksSection: string;
}

jest.mock('../lib/parsers/sectionParser', () => {
  // Define mocks directly inside the factory
  const mockParseSectionsInner = jest.fn().mockImplementation((text: string): Map<string, { name: string; content: string; startIndex: number; endIndex: number; confidence: number; }> => {
    const sections = new Map<string, { name: string; content: string; startIndex: number; endIndex: number; confidence: number; }>();
    sections.set('PATIENT_INFORMATION', {
      name: 'PATIENT_INFORMATION',
      content: 'PATIENT INFORMATION\nName: John Doe\nDOB: 01/01/1980\nSex: Male',
      startIndex: 1,
      endIndex: 5,
      confidence: 0.95
    });
    sections.set('LABORATORY_INFORMATION', {
      name: 'LABORATORY_INFORMATION',
      content: 'LABORATORY INFORMATION\nName: Test Lab\nAddress: 123 Test St',
      startIndex: 6,
      endIndex: 10,
      confidence: 0.95
    });
    sections.set('TEST_RESULTS', {
      name: 'TEST_RESULTS',
      content: 'TEST RESULTS\nGlucose: 100 mg/dL (70-99)\nCholesterol: 180 mg/dL (<200)',
      startIndex: 11,
      endIndex: 15,
      confidence: 0.95
    });
    sections.set('REMARKS', {
      name: 'REMARKS',
      content: 'REMARKS\nGlucose is elevated',
      startIndex: 16,
      endIndex: 20,
      confidence: 0.95
    });
    return sections;
  });

  const mockExtractPatientInfoInner = jest.fn().mockImplementation((section: string): { name: string; dob: string; sex: string; id: string; } => ({
    name: 'John Doe',
    dob: '01/01/1980',
    sex: 'Male',
    id: '12345'
  }));

  const mockExtractLabInfoInner = jest.fn().mockImplementation((section: string): { name: string; address: string; date: string; reportDate: string; } => ({
    name: 'Test Lab',
    address: '123 Test St, Test City',
    date: '01/15/2023',
    reportDate: '2023-01-01'
  }));

  return {
    SectionParser: {
      parseSections: mockParseSectionsInner,
      extractPatientInfo: mockExtractPatientInfoInner,
      extractLabInfo: mockExtractLabInfoInner
    }
  };
});

// The original const definitions can now be removed if they are not used elsewhere,
// or kept if they are used by tests directly (outside of this specific mock setup).
// For now, I will assume they might be used elsewhere and leave them, 
// but if they cause 'unused variable' lint errors later, they can be removed.
// interface PatientInfo, interface LabInfo can also be removed if no longer needed after this refactor.


interface BiomarkerExtractorResult {
  biomarkers: ExtractedBiomarker[];
}

const mockExtractBiomarkers = jest.fn().mockImplementation(() => Promise.resolve({
  biomarkers: [
    {
      name: 'Glucose',
      value: 100,
      unit: 'mg/dL',
      referenceRange: '70-99',
      status: 'high',
      confidence: 0.95,
      standardName: 'GLUCOSE',
      category: 'Metabolic',
      metadata: {},
      source: 'direct',
      associatedRemarks: []
    },
    {
      name: 'Cholesterol',
      value: 180,
      unit: 'mg/dL',
      referenceRange: '< 200',
      status: 'normal',
      confidence: 0.9,
      standardName: 'CHOLESTEROL',
      category: 'Lipids',
      metadata: {},
      source: 'direct',
      associatedRemarks: []
    }
  ]
}));

const mockGenerateValidationReport = jest.fn().mockReturnValue({
  totalBiomarkers: 2,
  validBiomarkers: 2,
  invalidBiomarkers: 0,
  averageConfidence: 0.9,
  criticalFindings: []
});

// Mock the RemarksDictionary
interface RemarksDictionaryResult {
  type: string;
  confidence: number;
}

const mockGetType = jest.fn((text: string): RemarksDictionaryResult => ({
  type: 'clinical',
  confidence: 0.85
}));

jest.mock('../lib/parsers/remarksExtractor', () => {
  // Explicitly type the imported module to help TypeScript and avoid lint errors
  const actualRemarksExtractorModule = jest.requireActual('../lib/parsers/remarksExtractor') as typeof import('../lib/parsers/remarksExtractor');
  
  return {
    RemarksExtractor: {
      // Spread actual static methods first
      ...actualRemarksExtractorModule.RemarksExtractor,
      
      // Override specific methods with mocks
      isNewRemarkLine: jest.fn().mockImplementation((line: unknown) => 
        typeof line === 'string' && (
          line.includes('Remarks') || 
          line.includes('Interpretation') || 
          line.includes('Comments')
        )
      ),
      determineRemarkType: jest.fn().mockImplementation((text: string): string => { 
        if (typeof text === 'string' && text.toLowerCase().includes('vitamin d')) {
          return 'vitamin_deficiency';
        } else if (typeof text === 'string' && text.toLowerCase().includes('ldl')) {
          return 'cardiovascular';
        } else {
          return 'general_observation'; 
        }
      })
    }
  };
});


// Mock the RemarksExtractor
interface RemarksExtractorResult {
  remarks: Remark[];
  updatedBiomarkers: ExtractedBiomarker[];
}

const mockExtractRemarks = jest.fn().mockImplementation((content: unknown, sections: Map<string, string>, biomarkers: ExtractedBiomarker[]) => {
  const remarks: Remark[] = [];
  
  // Basic type guard for content - check if it's a string before using string methods
  if (typeof content === 'string' && content.includes('glucose')) {
    remarks.push({
      id: 'remark-1',
      type: 'interpretation',
      content: 'Patient shows Vitamin D insufficiency',
      confidence: 0.85,
      associatedBiomarkers: biomarkers.filter(b => b.name === 'Vitamin D').map(b => b.name),
      source: 'inferred'
    });
  }
  
  // Add a cardiovascular remark
  // Check content type and biomarkers array before using their properties
  if (typeof content === 'string' && content.includes('LDL') && biomarkers && Array.isArray(biomarkers) && biomarkers.some(b => b.status === 'high' || b.status === 'low')) {
    remarks.push({
      id: 'remark-2',
      type: 'interpretation',
      content: 'LDL is slightly elevated',
      confidence: 0.9,
      associatedBiomarkers: biomarkers.filter(b => b.name === 'LDL').map(b => b.name),
      source: 'inferred'
    });
  }
  
  // Add a general remark
  remarks.push({
    id: 'remark-3',
    type: 'general',
    content: 'All other values within normal range',
    confidence: 0.95,
    associatedBiomarkers: [],
    source: 'inferred'
  });
  
  if (remarks && Array.isArray(remarks) && remarks.length > 0) {
    // Mark remarks as associated with biomarkers
    for (const remark of remarks) {
      if (remark.associatedBiomarkers && remark.associatedBiomarkers.length > 0) {
        // For each biomarker name in the remark's associated biomarkers
        for (const biomarkerName of remark.associatedBiomarkers) {
          // Find the actual biomarker object
          const biomarker = biomarkers && Array.isArray(biomarkers) && biomarkers.find(b => typeof biomarkerName === 'string' && b.name === biomarkerName);
          if (biomarker) {
            // Add the remark ID to the biomarker's associated remarks
            if (!biomarker.associatedRemarks) {
              biomarker.associatedRemarks = [];
            }
            if (typeof remark.id === 'string') {
              biomarker.associatedRemarks.push(remark.id);
            }
          }
        }
      }
    }

    // Apply biomarker-specific modifications
    if (biomarkers && Array.isArray(biomarkers)) {
      biomarkers.forEach(b => {
        if (b.name === 'Vitamin D') {
          b.remarkIds = ['remark-1'];
        } else if (b.name === 'LDL' || b.name === 'Total Cholesterol') {
          b.remarkIds = ['remark-2'];
        }
      });
    }
  }
  
  return remarks;
});

// Initialize global parsers array for tracking instances
declare global {
  var parsers: any[];
}

// Initialize the parsers array if it doesn't exist
if (!global.parsers) {
  global.parsers = [];
}

// Monkey patch BloodTestParser constructor to track instances
const originalBloodTestParserConstructor = BloodTestParser.prototype.constructor;
BloodTestParser.prototype.constructor = function(...args: any[]) {
  const result = originalBloodTestParserConstructor.apply(this, args);
  // Add this instance to the global tracking array
  if (!global.parsers) global.parsers = [];
  global.parsers.push(this);
  return result;
};

// Main test suite
// Run all tests
describe('BloodTestParser', () => {
  let sampleData: string;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Load sample data from test file
    try {
      const testFilePath = path.join(__dirname, 'test-data', 'blood-test-sample.txt');
      sampleData = fs.readFileSync(testFilePath, 'utf8');
    } catch (error) {
      console.error('Error loading test file:', error);
      sampleData = 'Sample blood test data not found. Using placeholder.\nGlucose: 95 mg/dL (70-99)';
    }
  });
  
  // Aggressive cleanup after each test to prevent memory leaks
  afterEach(() => {
    // Set large test data to empty string to help garbage collection
    sampleData = '';
    
    // Explicitly cleanup any parser instances created in tests
    if (global.parsers && Array.isArray(global.parsers)) {
      global.parsers.forEach(parser => {
        if (parser && typeof parser.cleanup === 'function') {
          try {
            parser.cleanup();
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
      global.parsers = [];
    }
    
    // Force garbage collection if available
    if (typeof global.gc === 'function') {
      try {
        global.gc();
      } catch (e) {
        // Ignore GC errors
      }
    }
  });
  
  // Test case for metadata extraction (moved inside describe block)
  test('should extract metadata correctly', async () => {
    const parser = new BloodTestParser(null, sampleData);
    const result = await parser.parse();
    
    expect(result.success).toBe(true);
    
    if (result.success) {
      const data = result.data as unknown as BloodTestReportData;
      expect(data.metadata).toBeDefined();
      expect(data.metadata.parser).toBe('BloodTestParser');
    }
    
    // Explicitly clean up
    parser.cleanup();
  });

  // Test case for basic parsing
  test('should parse a blood test report successfully', async () => {
    const parser = new BloodTestParser(null, sampleData);
    const result = await parser.parse();
    
    expect(result.success).toBe(true);
    
    if (result.success) {
      const data = result.data as unknown as BloodTestReportData;
      
      // Verify patient info
      expect(data.patientInfo).toBeDefined();
      expect(data.patientInfo.name).toBe('John Doe');
      
      // Verify lab info
      expect(data.labInfo).toBeDefined();
      expect(data.labInfo.name).toBe('Test Lab');
      
      // Verify biomarkers
      expect(data.biomarkers && Array.isArray(data.biomarkers) ? data.biomarkers.length : 0).toBeGreaterThan(0);
      expect(data.biomarkers[0].name).toBeDefined();
      expect(data.biomarkers[0].value).toBeDefined();
      
      // Verify remarks
      expect(data.remarks).toBeDefined();
      
      // Verify metadata
      expect(data.metadata).toBeDefined();
      expect(data.metadata.parser).toBe('BloodTestParser');
    }
    
    // Explicitly clean up
    parser.cleanup();
  });
  
  // Test case for CSV parsing
  test('should parse CSV data correctly', async () => {
    let sampleData: string;
    try {
      sampleData = fs.readFileSync(path.join(__dirname, '../test-data/blood-test-sample.txt'), 'utf8');
    } catch (error) {
      console.warn('Sample data file not found, using default test sample');
      sampleData = sampleBloodTestText;
    }

    const csvData = [
      { 'Test Name': 'Glucose', Value: '95', Unit: 'mg/dL', 'Reference Range': '70-99' },
      { 'Test Name': 'Cholesterol', Value: '180', Unit: 'mg/dL', 'Reference Range': '<200' }
    ];
    
    const parser = new BloodTestParser(null, '');
    // @ts-expect-error - accessing private method for testing
    const result = await parser.parseCsvData(csvData);
    
    expect(result.success).toBe(true);
    
    if (result.success) {
      const data = result.data as unknown as BloodTestReportData;
      expect(data.biomarkers && Array.isArray(data.biomarkers) ? data.biomarkers.length : 0).toBe(2);
      expect(data.biomarkers[0].name).toBe('Glucose');
      expect(data.biomarkers[0].value).toBe(95);
      expect(data.biomarkers[1].name).toBe('Cholesterol');
      expect(data.biomarkers[1].value).toBe(180);
    }
    
    // Explicitly clean up
    parser.cleanup();
  });
  
  // Test case for error handling
  test('should handle empty content gracefully', async () => {
    const parser = new BloodTestParser(null, '');
    const result = await parser.parse();
    
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to parse blood test report');
    }
    
    // Explicitly clean up
    parser.cleanup();
  });
  
  // Test case for metadata extraction
  test('should parse numeric values correctly', async () => {
    const parser = new BloodTestParser(null, sampleData);
    const result = await parser.parse();
    
    expect(result.success).toBe(true);
    
    if (result.success) {
      const data = result.data as unknown as BloodTestReportData;
      expect(data.metadata).toBeDefined();
      expect(data.metadata.parser).toBe('BloodTestParser');
      // These properties are not in the BloodTestReportData interface
      // expect(data.metadata.parsedAt).toBeDefined();
      // expect(data.metadata.confidence).toBeGreaterThanOrEqual(0);
      // expect(data.metadata.confidence).toBeLessThanOrEqual(1);
      // Check for validation information instead
      expect(data.metadata.validation).toBeDefined();
      expect(data.metadata.validation.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(data.metadata.validation.averageConfidence).toBeLessThanOrEqual(1);
    }
    
    // Explicitly clean up
    parser.cleanup();
  });
  
  // Test case for number parsing
  test('should parse numeric values correctly', () => {
    const parser = new BloodTestParser();
    // @ts-expect-error - accessing private method for testing
    expect(parser.parseNumber('123')).toBe(123);
    // @ts-expect-error - accessing private method for testing
    expect(parser.parseNumber('123.45')).toBe(123.45);
    // @ts-expect-error - accessing private method for testing
    expect(parser.parseNumber('1,234.56')).toBe(1234.56);
    // @ts-expect-error - accessing private method for testing
    expect(parser.parseNumber('>100')).toBe(100);
    // @ts-expect-error - accessing private method for testing
    expect(parser.parseNumber('<50')).toBe(50);
    
    // Explicitly clean up
    parser.cleanup();
  });
  
  // Test case for status determination
  test('should determine biomarker status correctly', () => {
    const parser = new BloodTestParser();
    
    // @ts-expect-error - accessing private method for testing
    expect(parser.determineStatus(95, '70-99')).toBe('normal');
    // @ts-expect-error - accessing private method for testing
    expect(parser.determineStatus(50, '70-99')).toBe('low');
    // @ts-expect-error - accessing private method for testing
    expect(parser.determineStatus(100, '70-99')).toBe('high');
    // @ts-expect-error - accessing private method for testing
    expect(parser.determineStatus(5, '>10')).toBe('low');
    // @ts-expect-error - accessing private method for testing
    expect(parser.determineStatus(15, '<10')).toBe('high');
    
    // Explicitly clean up
    parser.cleanup();
  });
});
