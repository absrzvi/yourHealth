import { 
  generateBloodTestCPTCodes, 
  mapBiomarkersToDiagnoses, 
  checkForAbnormalValues 
} from '../../lib/claims/bloodTestCoding';
import { Biomarker } from '@prisma/client';

describe('Blood Test CPT Code Generation', () => {
  describe('generateBloodTestCPTCodes', () => {
    it('should generate CPT codes for common blood test biomarkers', () => {
      const biomarkerNames = ['Glucose', 'Hemoglobin A1c', 'Cholesterol'];
      const cptCodes = generateBloodTestCPTCodes(biomarkerNames);
      
      expect(cptCodes).toBeInstanceOf(Array);
      expect(cptCodes.length).toBeGreaterThan(0);
      
      // Check that each CPT code has the required properties
      cptCodes.forEach(cpt => {
        expect(cpt).toHaveProperty('code');
        expect(cpt).toHaveProperty('description');
        expect(typeof cpt.code).toBe('string');
        expect(typeof cpt.description).toBe('string');
      });
      
      // Check for specific CPT codes based on the biomarkers
      const cptCodeValues = cptCodes.map(c => c.code);
      expect(cptCodeValues).toContain('82947'); // Glucose
      expect(cptCodeValues).toContain('83036'); // Hemoglobin A1c
      expect(cptCodeValues).toContain('82465'); // Cholesterol
    });
    
    it('should handle empty biomarker list', () => {
      const cptCodes = generateBloodTestCPTCodes([]);
      expect(cptCodes).toBeInstanceOf(Array);
      expect(cptCodes.length).toBe(0);
    });
    
    it('should handle unknown biomarkers', () => {
      const cptCodes = generateBloodTestCPTCodes(['UnknownBiomarker1', 'UnknownBiomarker2']);
      expect(cptCodes).toBeInstanceOf(Array);
      // Unknown biomarkers should not generate CPT codes
      expect(cptCodes.length).toBe(0);
    });
    
    it('should generate panel CPT codes for related biomarkers', () => {
      // Comprehensive metabolic panel biomarkers
      const biomarkerNames = [
        'Glucose', 'Calcium', 'Albumin', 'Total Protein', 
        'Sodium', 'Potassium', 'CO2', 'Chloride', 
        'BUN', 'Creatinine', 'ALP', 'ALT', 'AST', 'Bilirubin'
      ];
      
      const cptCodes = generateBloodTestCPTCodes(biomarkerNames);
      
      // Should include the CMP panel code
      const cptCodeValues = cptCodes.map(c => c.code);
      expect(cptCodeValues).toContain('80053'); // Comprehensive Metabolic Panel
    });
  });
  
  describe('mapBiomarkersToDiagnoses', () => {
    it('should map biomarkers to appropriate ICD-10 diagnosis codes', () => {
      const biomarkers = [
        { name: 'Glucose', category: 'Metabolic', value: '100', unit: 'mg/dL' },
        { name: 'Cholesterol', category: 'Lipid', value: '220', unit: 'mg/dL' }
      ] as Biomarker[];
      
      const diagnosisCodes = mapBiomarkersToDiagnoses(biomarkers);
      
      expect(diagnosisCodes).toBeInstanceOf(Array);
      expect(diagnosisCodes.length).toBeGreaterThan(0);
      
      // Check for specific diagnosis codes based on categories
      expect(diagnosisCodes).toContain('E88.9'); // Metabolic disorder, unspecified
      expect(diagnosisCodes).toContain('E78.9'); // Disorder of lipoprotein metabolism, unspecified
    });
    
    it('should handle empty biomarker list', () => {
      const diagnosisCodes = mapBiomarkersToDiagnoses([]);
      expect(diagnosisCodes).toBeInstanceOf(Array);
      expect(diagnosisCodes.length).toBe(0);
    });
    
    it('should include Z00.00 for routine examination', () => {
      const biomarkers = [
        { name: 'Glucose', category: 'Metabolic', value: '85', unit: 'mg/dL' }
      ] as Biomarker[];
      
      const diagnosisCodes = mapBiomarkersToDiagnoses(biomarkers);
      
      expect(diagnosisCodes).toContain('Z00.00'); // Encounter for general adult medical examination without abnormal findings
    });
  });
  
  describe('checkForAbnormalValues', () => {
    it('should identify abnormal biomarker values and return appropriate diagnosis codes', () => {
      const biomarkers = [
        { 
          name: 'Glucose', 
          category: 'Metabolic', 
          value: '180', // Abnormally high
          unit: 'mg/dL',
          referenceRange: '70-99'
        },
        { 
          name: 'Hemoglobin', 
          category: 'Hematology', 
          value: '10.0', // Abnormally low
          unit: 'g/dL',
          referenceRange: '13.5-17.5'
        }
      ] as Biomarker[];
      
      const abnormalCodes = checkForAbnormalValues(biomarkers);
      
      expect(abnormalCodes).toBeInstanceOf(Array);
      expect(abnormalCodes.length).toBeGreaterThan(0);
      
      // Check for specific diagnosis codes for abnormal values
      expect(abnormalCodes).toContain('R73.9'); // Hyperglycemia, unspecified
      expect(abnormalCodes).toContain('D64.9'); // Anemia, unspecified
    });
    
    it('should return empty array for normal values', () => {
      const biomarkers = [
        { 
          name: 'Glucose', 
          category: 'Metabolic', 
          value: '85', // Normal
          unit: 'mg/dL',
          referenceRange: '70-99'
        }
      ] as Biomarker[];
      
      const abnormalCodes = checkForAbnormalValues(biomarkers);
      expect(abnormalCodes).toBeInstanceOf(Array);
      expect(abnormalCodes.length).toBe(0);
    });
    
    it('should handle missing reference ranges', () => {
      const biomarkers = [
        { 
          name: 'Glucose', 
          category: 'Metabolic', 
          value: '180', // Abnormally high but no reference range
          unit: 'mg/dL'
          // No referenceRange provided
        }
      ] as Biomarker[];
      
      const abnormalCodes = checkForAbnormalValues(biomarkers);
      
      // Should use default reference ranges when not provided
      expect(abnormalCodes).toBeInstanceOf(Array);
      expect(abnormalCodes.length).toBeGreaterThan(0);
      expect(abnormalCodes).toContain('R73.9'); // Hyperglycemia, unspecified
    });
  });
});
