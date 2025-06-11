import { validateClaimInput, ClaimInput, ClaimLineInput } from '../../lib/claims/validation';
import { ClaimStatus } from '@prisma/client';

describe('Claim Validation', () => {
  describe('validateClaimInput', () => {
    it('should validate a valid claim with multiple service lines', () => {
      const validClaim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            serviceDate: new Date().toISOString(),
            icd10Codes: ['E11.9', 'Z00.00']
          },
          {
            lineNumber: 2,
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 100.00,
            serviceDate: new Date().toISOString(),
            icd10Codes: ['R73.9']
          }
        ]
      };

      const errors = validateClaimInput(validClaim);
      expect(errors).toHaveLength(0);
    });

    it('should validate claim lines total matches claim total charge', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 300.00, // Incorrect total (should be 250.00)
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            serviceDate: new Date().toISOString()
          },
          {
            lineNumber: 2,
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 100.00,
            serviceDate: new Date().toISOString()
          }
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Total charge (300) does not match sum of line charges (250.00)');
    });

    it('should handle units in charge calculation', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 350.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: 1,
            serviceDate: new Date().toISOString()
          },
          {
            lineNumber: 2,
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 100.00,
            units: 2, // Two units at $100 each = $200
            serviceDate: new Date().toISOString()
          }
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(0);
    });

    it('should validate CPT code format', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            serviceDate: new Date().toISOString()
          },
          {
            lineNumber: 2,
            cptCode: '829', // Invalid CPT code (too short)
            description: 'Glucose, quantitative',
            charge: 100.00,
            serviceDate: new Date().toISOString()
          }
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('CPT code must be 5 digits');
    });

    it('should validate ICD-10 code format', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            serviceDate: new Date().toISOString(),
            icd10Codes: ['E11.9', 'Z00'] // Z00 is invalid (should be Z00.00)
          }
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid ICD-10 format');
    });

    it('should detect duplicate line numbers', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 350.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            serviceDate: new Date().toISOString()
          },
          {
            lineNumber: 1, // Duplicate line number
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 200.00,
            serviceDate: new Date().toISOString()
          }
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Duplicate line numbers are not allowed');
    });

    it('should require insurance plan ID for new claims', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            serviceDate: new Date().toISOString()
          },
          {
            lineNumber: 2,
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 100.00,
            serviceDate: new Date().toISOString()
          }
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Insurance plan ID is required');
    });

    it('should not require insurance plan ID for updates', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        isUpdate: true,
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            serviceDate: new Date().toISOString()
          },
          {
            lineNumber: 2,
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 100.00,
            serviceDate: new Date().toISOString()
          }
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(0);
    });

    it('should validate required fields for each claim line', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            // Missing serviceDate
          } as ClaimLineInput,
          {
            lineNumber: 2,
            // Missing cptCode
            description: 'Glucose, quantitative',
            charge: 100.00,
            serviceDate: new Date().toISOString()
          } as ClaimLineInput
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(2);
      expect(errors).toContain('Line 1: Service date is required.');
      expect(errors).toContain('Line 2: CPT code is required.');
    });

    it('should validate units are positive numbers', () => {
      const claim: ClaimInput = {
        claimNumber: 'CLM12345',
        totalCharge: 150.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        claimLines: [
          {
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: -1, // Negative units
            serviceDate: new Date().toISOString()
          }
        ]
      };

      const errors = validateClaimInput(claim);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Units must be a positive number');
    });
  });
});
