import { DefaultEligibilityValidator } from '../validators/default.validator';
import { InsurancePlan } from '@prisma/client';

describe('DefaultEligibilityValidator', () => {
  let validator: DefaultEligibilityValidator;
  let validPlan: InsurancePlan;

  beforeEach(() => {
    validator = new DefaultEligibilityValidator();
    
    validPlan = {
      id: 'test-plan-1',
      userId: 'user-1',
      payerId: 'payer-1',
      payerName: 'Test Payer',
      memberId: 'M123456789',
      groupNumber: 'GRP123',
      planType: 'PPO',
      isPrimary: true,
      isActive: true,
      effectiveDate: new Date('2024-01-01'),
      termDate: new Date('2024-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as InsurancePlan;
  });

  describe('validate', () => {
    it('should validate a complete and valid plan', async () => {
      const result = await validator.validate(validPlan);
      
      expect(result).toBe(true);
      expect(validator.getErrors()).toHaveLength(0);
    });

    it('should fail validation for missing required fields', async () => {
      const invalidPlan = { ...validPlan, payerId: '', memberId: '' };
      
      const result = await validator.validate(invalidPlan);
      
      expect(result).toBe(false);
      const errors = validator.getErrors();
      expect(errors).toContain('Payer ID is required');
      expect(errors).toContain('Member ID is required');
    });

    it('should fail validation for invalid date range', async () => {
      const invalidPlan = {
        ...validPlan,
        effectiveDate: new Date('2024-12-31'),
        termDate: new Date('2024-01-01'),
      };
      
      const result = await validator.validate(invalidPlan);
      
      expect(result).toBe(false);
      expect(validator.getErrors()).toContain(
        'Effective date must be before term date'
      );
    });

    it('should fail validation for invalid member ID format', async () => {
      const invalidPlan = {
        ...validPlan,
        memberId: 'invalid@id!',
      };
      
      const result = await validator.validate(invalidPlan);
      
      expect(result).toBe(false);
      expect(validator.getErrors()).toContain(
        'Member ID contains invalid characters'
      );
    });

    it('should fail validation for invalid plan type', async () => {
      const invalidPlan = {
        ...validPlan,
        planType: 'INVALID_TYPE',
      };
      
      const result = await validator.validate(invalidPlan);
      
      expect(result).toBe(false);
      expect(validator.getErrors()[0]).toMatch(
        /Plan type must be one of: PPO, HMO, EPO, POS, HDHP, INDEMNITY/
      );
    });

    it('should pass validation with valid plan types', async () => {
      const validTypes = ['PPO', 'HMO', 'EPO', 'POS', 'HDHP', 'INDEMNITY'];
      
      for (const type of validTypes) {
        const testPlan = { ...validPlan, planType: type };
        validator = new DefaultEligibilityValidator();
        const result = await validator.validate(testPlan);
        
        expect(result).toBe(true);
        expect(validator.getErrors()).toHaveLength(0);
      }
    });
  });

  describe('error handling', () => {
    it('should handle validation rule errors gracefully', async () => {
      // Mock a failing validation rule
      const mockRule = {
        id: 'MOCK_RULE',
        description: 'Mock validation rule',
        validate: jest.fn().mockRejectedValue(new Error('Validation error')),
      };
      
      // Add the mock rule to the validator
      (validator as any).addRule(mockRule);
      
      const result = await validator.validate(validPlan);
      
      expect(result).toBe(false);
      expect(validator.getErrors()).toContain('Error validating Mock validation rule');
    });
  });
});
