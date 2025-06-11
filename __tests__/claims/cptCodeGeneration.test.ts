import { ClaimsProcessor } from '@/lib/claims/processor';
import { generateCPTCodes } from '@/lib/claims/coding';
import { prisma } from '@/lib/db';

// Mock the prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    bloodTest: {
      findFirst: jest.fn()
    }
  }
}));

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the coding module
jest.mock('@/lib/claims/coding', () => ({
  generateCPTCodes: jest.fn(),
  validateCPTCode: jest.fn().mockReturnValue(true),
  getCPTDescription: jest.fn().mockImplementation((code) => `Test description for ${code}`)
}));

describe('CPT Code Generation', () => {
  let claimsProcessor: ClaimsProcessor;
  
  beforeEach(() => {
    claimsProcessor = new ClaimsProcessor();
    jest.clearAllMocks();
    
    // Default mock implementation for bloodTest.findFirst
    (prisma.bloodTest.findFirst as jest.Mock).mockResolvedValue({
      id: 'test-blood-test-id',
      biomarkers: [
        { name: 'Glucose', value: 100, unit: 'mg/dL' },
        { name: 'Hemoglobin', value: 14, unit: 'g/dL' }
      ]
    });
    
    // Default mock implementation for generateCPTCodes
    (generateCPTCodes as jest.Mock).mockReturnValue(['80053', '85025']);
  });
  
  test('should generate CPT codes from report with biomarkers', async () => {
    const report = {
      id: 'test-report-id',
      type: 'BLOOD_TEST',
      parsedData: JSON.stringify({
        biomarkers: [
          { name: 'Glucose', value: 100 },
          { name: 'Hemoglobin', value: 14 }
        ]
      })
    };
    
    const result = await claimsProcessor.generateCPTCodes(report);
    
    expect(generateCPTCodes).toHaveBeenCalled();
    expect(prisma.bloodTest.findFirst).toHaveBeenCalledWith({
      where: { reportId: 'test-report-id' },
      include: { biomarkers: true }
    });
    
    expect(result).toHaveLength(2);
    expect(result[0].cpt).toBe('80053');
    expect(result[0].description).toBe('Test description for 80053');
    expect(result[0].diagnoses).toContain('E88.9'); // Metabolic disorder code
    expect(result[0].diagnoses).toContain('D64.9'); // Hematology disorder code
  });
  
  test('should handle reports with no biomarkers', async () => {
    const report = {
      id: 'test-report-id',
      type: 'BLOOD_TEST',
      parsedData: null
    };
    
    (prisma.bloodTest.findFirst as jest.Mock).mockResolvedValue(null);
    (generateCPTCodes as jest.Mock).mockReturnValue([]);
    
    const result = await claimsProcessor.generateCPTCodes(report);
    
    expect(result).toHaveLength(1);
    expect(result[0].cpt).toBe('80050'); // Default general health panel
    expect(result[0].diagnoses).toContain('Z00.00'); // General health check
  });
  
  test('should handle parsing errors gracefully', async () => {
    const report = {
      id: 'test-report-id',
      type: 'BLOOD_TEST',
      parsedData: '{invalid-json}'
    };
    
    const result = await claimsProcessor.generateCPTCodes(report);
    
    // Should still return valid CPT codes despite parsing error
    expect(result.length).toBeGreaterThan(0);
  });
  
  test('should handle missing report gracefully', async () => {
    const result = await claimsProcessor.generateCPTCodes(null as any);
    
    expect(result).toHaveLength(1);
    expect(result[0].cpt).toBe('80050'); // Default general health panel
  });
  
  test('should map biomarker categories to appropriate ICD-10 codes', async () => {
    const report = {
      id: 'test-report-id',
      type: 'BLOOD_TEST',
      parsedData: JSON.stringify({
        biomarkers: [
          { name: 'ALT', value: 30 },
          { name: 'AST', value: 35 },
          { name: 'Cholesterol', value: 200 }
        ]
      })
    };
    
    (prisma.bloodTest.findFirst as jest.Mock).mockResolvedValue({
      id: 'test-blood-test-id',
      biomarkers: [
        { name: 'ALT', value: 30, unit: 'U/L' },
        { name: 'AST', value: 35, unit: 'U/L' },
        { name: 'Cholesterol', value: 200, unit: 'mg/dL' }
      ]
    });
    
    const result = await claimsProcessor.generateCPTCodes(report);
    
    // Should include Liver Function and Lipid Panel related ICD-10 codes
    const diagnoses = result[0].diagnoses;
    expect(diagnoses.some(code => code.startsWith('R74') || code.startsWith('K76'))).toBeTruthy(); // Liver function
    expect(diagnoses.some(code => code.startsWith('E78'))).toBeTruthy(); // Lipid disorder
  });
});
