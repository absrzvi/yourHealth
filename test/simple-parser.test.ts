// Simple parser test file to isolate issues
import { jest, describe, it, expect } from '@jest/globals';
import { BloodTestParser } from '../lib/parsers/bloodTestParser';

// Mock the dependencies
jest.mock('../lib/parsers/remarksExtractor', () => {
  const actualRemarksExtractorModule = jest.requireActual('../lib/parsers/remarksExtractor') as typeof import('../lib/parsers/remarksExtractor');
  return {
    RemarksExtractor: {
      ...actualRemarksExtractorModule.RemarksExtractor,
      splitIntoSections: jest.fn().mockImplementation((content: string) => [
        { name: 'main', content: 'Main content', type: 'body' },
        { name: 'Liver Enzymes', content: 'ALT: 25 U/L\nAST: 28 U/L', type: 'body' }
      ])
      // calculateSectionConfidence was part of the old sectionExtractor mock.
      // It's not directly available in RemarksExtractor. If tests depend on it,
      // further investigation is needed to find its new location or adapt tests.
    }
  };
});

jest.mock('../lib/parsers/sectionParser', () => {
  const actualSectionParserModule = jest.requireActual('../lib/parsers/sectionParser') as typeof import('../lib/parsers/sectionParser');
  return {
    SectionParser: {
      ...actualSectionParserModule.SectionParser,
      extractPatientInfo: jest.fn().mockImplementation((content: string) => ({
        name: 'John Doe',
        dob: '01/01/1980',
        sex: 'Male',
        idNumber: 'ID12345',
        address: '123 Main St, Anytown, USA',
        phoneNumber: '555-1234',
        insuranceProvider: 'HealthIns Co.',
        insuranceId: 'HI98765'
      })),
      extractLabInfo: jest.fn().mockImplementation((content: string) => ({
        name: 'Test Lab',
        address: '123 Test St, Test City',
        date: '01/15/2023',
        reportDate: '2023-01-01'
      }))
    }
  };
});

// Simple test suite
describe('Basic BloodTestParser', () => {
  it('should create an instance', () => {
    const parser = new BloodTestParser();
    expect(parser).toBeDefined();
  });
});
