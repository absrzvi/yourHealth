import { ClaimsProcessor } from '../../lib/claims/processor';
import { Claim, ClaimLine, ClaimStatus } from '@prisma/client';
import { logger } from '../../lib/logger';

// Mock the logger
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('ClaimsProcessor Validation', () => {
  let processor: ClaimsProcessor;
  
  beforeEach(() => {
    processor = new ClaimsProcessor();
    jest.clearAllMocks();
  });
  
  describe('validateClaim', () => {
    it('should validate a valid claim with multiple claim lines', async () => {
      const validClaim = {
        id: 'claim123',
        userId: 'user123',
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        createdAt: new Date(),
        updatedAt: new Date(),
        claimLines: [
          {
            id: 'line1',
            claimId: 'claim123',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'line2',
            claimId: 'claim123',
            lineNumber: 2,
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 100.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Claim & { claimLines: ClaimLine[] };

      const result = await processor.validateClaim(validClaim);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Validated claim CLM12345: Valid')
      );
    });

    it('should detect missing required fields', async () => {
      const invalidClaim = {
        id: 'claim123',
        userId: 'user123',
        // Missing claimNumber
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        createdAt: new Date(),
        updatedAt: new Date(),
        claimLines: [
          {
            id: 'line1',
            claimId: 'claim123',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Claim & { claimLines: ClaimLine[] };

      const result = await processor.validateClaim(invalidClaim);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Claim number is required');
      // No need to check logger.error call as it's not used in the validateClaim method
    });

    it('should validate charge is positive', async () => {
      const invalidClaim = {
        id: 'claim123',
        userId: 'user123',
        claimNumber: 'CLM12345',
        totalCharge: -250.00, // Negative charge
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        createdAt: new Date(),
        updatedAt: new Date(),
        claimLines: [
          {
            id: 'line1',
            claimId: 'claim123',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: -150.00, // Negative charge
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Claim & { claimLines: ClaimLine[] };

      const result = await processor.validateClaim(invalidClaim);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total charge must be positive');
      expect(result.errors).toContain('Line 1: Charge must be positive');
    });

    it('should validate insurance plan is present', async () => {
      const invalidClaim = {
        id: 'claim123',
        userId: 'user123',
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        // Missing insurancePlanId
        createdAt: new Date(),
        updatedAt: new Date(),
        claimLines: [
          {
            id: 'line1',
            claimId: 'claim123',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Claim & { claimLines: ClaimLine[] };

      const result = await processor.validateClaim(invalidClaim);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Insurance plan is required');
    });

    it('should validate claim status is valid', async () => {
      const invalidClaim = {
        id: 'claim123',
        userId: 'user123',
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'INVALID_STATUS' as ClaimStatus, // Invalid status
        insurancePlanId: 'plan123',
        createdAt: new Date(),
        updatedAt: new Date(),
        claimLines: [
          {
            id: 'line1',
            claimId: 'claim123',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Claim & { claimLines: ClaimLine[] };

      const result = await processor.validateClaim(invalidClaim);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid claim status: INVALID_STATUS');
    });

    it('should validate HIPAA compliance (user ID presence if patient ID is present)', async () => {
      const invalidClaim = {
        id: 'claim123',
        // Missing userId
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        patientId: 'patient123', // Patient ID is present but user ID is missing
        createdAt: new Date(),
        updatedAt: new Date(),
        claimLines: [
          {
            id: 'line1',
            claimId: 'claim123',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Claim & { claimLines: ClaimLine[] };

      const result = await processor.validateClaim(invalidClaim);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User ID is required for HIPAA compliance when patient ID is provided');
    });

    it('should validate claim lines total matches claim total charge', async () => {
      const invalidClaim = {
        id: 'claim123',
        userId: 'user123',
        claimNumber: 'CLM12345',
        totalCharge: 300.00, // Incorrect total (should be 250.00)
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        createdAt: new Date(),
        updatedAt: new Date(),
        claimLines: [
          {
            id: 'line1',
            claimId: 'claim123',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'line2',
            claimId: 'claim123',
            lineNumber: 2,
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 100.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Claim & { claimLines: ClaimLine[] };

      const result = await processor.validateClaim(invalidClaim);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Total charge (300) does not match sum of line charges (250.00)');
    });

    it('should handle units in charge calculation', async () => {
      const validClaim = {
        id: 'claim123',
        userId: 'user123',
        claimNumber: 'CLM12345',
        totalCharge: 350.00,
        status: 'DRAFT' as ClaimStatus,
        insurancePlanId: 'plan123',
        createdAt: new Date(),
        updatedAt: new Date(),
        claimLines: [
          {
            id: 'line1',
            claimId: 'claim123',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 150.00,
            units: 1,
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'line2',
            claimId: 'claim123',
            lineNumber: 2,
            cptCode: '82947',
            description: 'Glucose, quantitative',
            charge: 100.00,
            units: 2, // Two units at $100 each = $200
            serviceDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      } as unknown as Claim & { claimLines: ClaimLine[] };

      const result = await processor.validateClaim(validClaim);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
