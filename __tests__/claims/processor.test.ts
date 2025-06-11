import { ClaimsProcessor } from '../../lib/claims/processor';
import { Report, Biomarker } from '@prisma/client';
import * as bloodTestCoding from '../../lib/claims/bloodTestCoding';

// Mock the bloodTestCoding module
jest.mock('../../lib/claims/bloodTestCoding', () => ({
  generateBloodTestCPTCodes: jest.fn(),
  mapBiomarkersToDiagnoses: jest.fn(),
  checkForAbnormalValues: jest.fn()
}));

describe('ClaimsProcessor', () => {
  let processor: ClaimsProcessor;
  
  beforeEach(() => {
    processor = new ClaimsProcessor();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock implementations
    (bloodTestCoding.generateBloodTestCPTCodes as jest.Mock).mockReturnValue([
      { code: '80053', description: 'Comprehensive Metabolic Panel' },
      { code: '82947', description: 'Glucose, quantitative' }
    ]);
    
    (bloodTestCoding.mapBiomarkersToDiagnoses as jest.Mock).mockReturnValue(['Z00.00', 'E88.9']);
    
    (bloodTestCoding.checkForAbnormalValues as jest.Mock).mockReturnValue(['R73.9']);
  });
  
  describe('generateCPTCodes', () => {
    it('should generate CPT codes for blood test reports with biomarkers', async () => {
      const report = {
        id: 'report123',
        userId: 'user123',
        title: 'Blood Test Report',
        type: 'BLOOD_TEST',
        source: 'Lab',
        fileUrl: 'https://example.com/report.pdf',
        parsedData: JSON.stringify({
          biomarkers: [
            { name: 'Glucose', value: '120', unit: 'mg/dL', referenceRange: '70-99' },
            { name: 'Cholesterol', value: '220', unit: 'mg/dL', referenceRange: '0-200' }
          ]
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
        biomarkers: [
          {
            id: 'bio1',
            reportId: 'report123',
            name: 'Glucose',
            category: 'Metabolic',
            value: '120',
            unit: 'mg/dL',
            referenceRange: '70-99',
            isAbnormal: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'bio2',
            reportId: 'report123',
            name: 'Cholesterol',
            category: 'Lipid',
            value: '220',
            unit: 'mg/dL',
            referenceRange: '0-200',
            isAbnormal: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Report & { biomarkers: Biomarker[] };
      
      const cptCodes = await processor.generateCPTCodes(report);
      
      // Verify the specialized blood test CPT code generation was called
      expect(bloodTestCoding.generateBloodTestCPTCodes).toHaveBeenCalledWith([
        'Glucose', 'Cholesterol'
      ]);
      
      // Verify diagnosis code mapping was called
      expect(bloodTestCoding.mapBiomarkersToDiagnoses).toHaveBeenCalledWith(report.biomarkers);
      
      // Verify abnormal value checking was called
      expect(bloodTestCoding.checkForAbnormalValues).toHaveBeenCalledWith(report.biomarkers);
      
      // Verify the result structure
      expect(cptCodes).toHaveLength(2);
      expect(cptCodes[0]).toEqual({
        cpt: '80053',
        description: 'Comprehensive Metabolic Panel',
        diagnoses: ['Z00.00', 'E88.9', 'R73.9'],
        units: 1
      });
      expect(cptCodes[1]).toEqual({
        cpt: '82947',
        description: 'Glucose, quantitative',
        diagnoses: ['Z00.00', 'E88.9', 'R73.9'],
        units: 1
      });
    });
    
    it('should fall back to default CPT code for non-blood test reports', async () => {
      const report = {
        id: 'report456',
        userId: 'user123',
        title: 'X-Ray Report',
        type: 'RADIOLOGY',
        source: 'Hospital',
        fileUrl: 'https://example.com/xray.pdf',
        parsedData: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Report;
      
      const cptCodes = await processor.generateCPTCodes(report);
      
      // Verify the specialized blood test CPT code generation was NOT called
      expect(bloodTestCoding.generateBloodTestCPTCodes).not.toHaveBeenCalled();
      
      // Verify the result is the default CPT code
      expect(cptCodes).toHaveLength(1);
      expect(cptCodes[0]).toEqual({
        cpt: '80050',
        description: 'General health panel',
        diagnoses: ['Z00.00'],
        units: 1
      });
    });
    
    it('should handle errors gracefully', async () => {
      // Mock a failure in the blood test coding module
      (bloodTestCoding.generateBloodTestCPTCodes as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const report = {
        id: 'report123',
        userId: 'user123',
        title: 'Blood Test Report',
        type: 'BLOOD_TEST',
        source: 'Lab',
        fileUrl: 'https://example.com/report.pdf',
        parsedData: JSON.stringify({
          biomarkers: [
            { name: 'Glucose', value: '120', unit: 'mg/dL' }
          ]
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
        biomarkers: [
          {
            id: 'bio1',
            reportId: 'report123',
            name: 'Glucose',
            category: 'Metabolic',
            value: '120',
            unit: 'mg/dL',
            referenceRange: '70-99',
            isAbnormal: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Report & { biomarkers: Biomarker[] };
      
      const cptCodes = await processor.generateCPTCodes(report);
      
      // Verify the result falls back to the default CPT code
      expect(cptCodes).toHaveLength(1);
      expect(cptCodes[0]).toEqual({
        cpt: '80050',
        description: 'General health panel',
        diagnoses: ['Z00.00'],
        units: 1
      });
    });
    
    it('should handle reports with no biomarkers', async () => {
      const report = {
        id: 'report123',
        userId: 'user123',
        title: 'Blood Test Report',
        type: 'BLOOD_TEST',
        source: 'Lab',
        fileUrl: 'https://example.com/report.pdf',
        parsedData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        biomarkers: [] // Empty biomarkers array
      } as unknown as Report & { biomarkers: Biomarker[] };
      
      const cptCodes = await processor.generateCPTCodes(report);
      
      // Verify the result falls back to the default CPT code
      expect(cptCodes).toHaveLength(1);
      expect(cptCodes[0]).toEqual({
        cpt: '80050',
        description: 'General health panel',
        diagnoses: ['Z00.00'],
        units: 1
      });
    });
    
    it('should handle reports with parsedData but no biomarkers property', async () => {
      const report = {
        id: 'report123',
        userId: 'user123',
        title: 'Blood Test Report',
        type: 'BLOOD_TEST',
        source: 'Lab',
        fileUrl: 'https://example.com/report.pdf',
        parsedData: JSON.stringify({
          otherData: 'Some data but no biomarkers'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      } as Report;
      
      const cptCodes = await processor.generateCPTCodes(report);
      
      // Verify the result falls back to the default CPT code
      expect(cptCodes).toHaveLength(1);
      expect(cptCodes[0]).toEqual({
        cpt: '80050',
        description: 'General health panel',
        diagnoses: ['Z00.00'],
        units: 1
      });
    });
  });
});
