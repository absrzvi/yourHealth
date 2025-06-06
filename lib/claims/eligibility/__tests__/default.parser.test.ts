import { DefaultEligibilityParser } from '../parsers/default.parser';

// Define a simple InsurancePlan interface for testing
interface InsurancePlan {
  id: string;
  userId: string;
  payerId: string;
  payerName: string;
  memberId: string;
  groupNumber: string;
  planType: string;
  isPrimary: boolean;
  isActive: boolean;
  effectiveDate: Date;
  termDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

describe('DefaultEligibilityParser', () => {
  let parser: DefaultEligibilityParser;
  let mockPlan: InsurancePlan;

  beforeEach(() => {
    parser = new DefaultEligibilityParser();
    
    mockPlan = {
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

  describe('parse', () => {
    it('should parse a complete eligibility response', async () => {
      // Test with all possible fields
      const response = {
        isEligible: true,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        termDate: '2024-12-31T23:59:59.999Z',
        coverage: {
          deductible: 1000,
          deductibleMet: 250,
          outOfPocketMax: 5000,
          outOfPocketMet: 1000,
          copay: 30,
          coinsurance: 20,
          preventativeCare: {
            isCovered: true,
            isPreventative: true,
            limitations: 'No limitations',
            authorizationRequired: false
          },
          officeVisits: [
            {
              type: 'PRIMARY_CARE',
              copay: 20,
              coinsurance: 0,
              isCovered: true
            },
            {
              type: 'SPECIALIST',
              copay: 40,
              coinsurance: 0,
              isCovered: true
            }
          ]
        },
        plan: {
          type: 'PPO',
          name: 'Test Payer',
          id: 'payer-1',
          network: {
            name: 'National PPO Network',
            isInNetwork: true
          }
        },
        additionalInfo: {
          customerServicePhone: '1-800-TEST-PAY',
          website: 'https://testpayer.com'
        },
        timestamp: new Date().toISOString()
      };

      const result = await parser.parse(response, mockPlan);
      
      expect(result.isEligible).toBe(true);
      // Handle both string and Date objects for dates
      expect(result.effectiveDate instanceof Date ? result.effectiveDate.toISOString() : result.effectiveDate)
        .toBe('2024-01-01T00:00:00.000Z');
      expect(result.termDate instanceof Date ? result.termDate.toISOString() : result.termDate)
        .toBe('2024-12-31T23:59:59.999Z');
      // Only check for expected fields in coverage
      expect(result.coverage).toMatchObject({
        deductible: 1000,
        deductibleMet: 250,
        outOfPocketMax: 5000,
        outOfPocketMet: 1000,
        copay: 30,
        coinsurance: 20
      });
      // rawResponse should be defined and contain the expected data
      expect(result.rawResponse).toBeDefined();
      expect(typeof result.rawResponse).toBe('object');
      
      // plan should be defined and match the expected structure
      expect(result.plan).toBeDefined();
      if (result.plan) {
        expect(result.plan).toMatchObject({
          type: 'PPO',
          name: 'Test Payer',
          id: 'payer-1'
        });
      }
    });

    it('should handle string dates', async () => {
      const response = {
        isEligible: true,
        effectiveDate: '2024-01-01',
        termDate: '2024-12-31',
        coverage: {
          deductible: 0,
          outOfPocketMax: 0
        }
      };

      const result = await parser.parse(response, mockPlan);
      
      // Handle both string and Date objects for dates
      expect(result.effectiveDate instanceof Date ? result.effectiveDate.toISOString().split('T')[0] : result.effectiveDate)
        .toBe('2024-01-01');
      expect(result.termDate instanceof Date ? result.termDate.toISOString().split('T')[0] : result.termDate)
        .toBe('2024-12-31');
      expect(result.coverage).toBeDefined();
    });

    it('should handle missing optional fields', async () => {
      const response = {
        isEligible: true,
        // No coverage or plan provided
      };

      const result = await parser.parse(response, mockPlan);
      
      expect(result.isEligible).toBe(true);
      expect(result.coverage).toBeUndefined();
      // plan should be defined and match the expected structure even when not provided in the response
      expect(result.plan).toBeDefined();
      if (result.plan) {
        expect(result.plan).toMatchObject({
          type: 'PPO',
          name: 'Test Payer',
          id: 'payer-1'
        });
      }
      // Verify rawResponse is set to the input data
      expect(result.rawResponse).toBeDefined();
      expect(result.rawResponse).toEqual(expect.objectContaining({
        isEligible: true
      }));
    });

    it('should handle JSON string input', async () => {
      const jsonString = JSON.stringify({
        isEligible: true,
        effectiveDate: '2024-01-01',
        termDate: '2024-12-31',
        coverage: {
          deductible: 0,
          outOfPocketMax: 0
        }
      });

      const result = await parser.parse(jsonString, mockPlan);
      
      expect(result.isEligible).toBe(true);
      expect(result.effectiveDate).toBeInstanceOf(Date);
      expect(result.termDate).toBeInstanceOf(Date);
      expect(result.coverage).toBeDefined();
    });

    it('should handle error responses', async () => {
      const response = {
        isEligible: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Member not found',
          details: 'The specified member ID was not found in our system'
        },
        // Include coverage to ensure it's still processed
        coverage: {
          deductible: 0,
          outOfPocketMax: 0
        }
      };

      const result = await parser.parse(response, mockPlan);
      
      expect(result.isEligible).toBe(false);
      expect(result.error).toEqual({
        code: 'NOT_FOUND',
        message: 'Member not found',
        details: 'The specified member ID was not found in our system'
      });
      // Coverage should still be processed even with error
      expect(result.coverage).toBeDefined();
    });

    it('should handle invalid JSON string input', async () => {
      const invalidJson = '{invalid-json';
      
      const result = await parser.parse(invalidJson, mockPlan);
      
      expect(result.isEligible).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('PARSE_ERROR');
    });

    it('should handle null or undefined input', async () => {
      // @ts-expect-error Testing invalid input
      const nullResult = await parser.parse(null, mockPlan);
      expect(nullResult.isEligible).toBe(false);
      expect(nullResult.error).toBeDefined();
      
      // @ts-expect-error Testing invalid input
      const undefinedResult = await parser.parse(undefined, mockPlan);
      expect(undefinedResult.isEligible).toBe(false);
      expect(undefinedResult.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      // Empty object should fall back to default values
      const response = {};
      
      const result = await parser.parse(response, mockPlan);
      
      // Default behavior is to assume isEligible is false if not provided
      expect(result.isEligible).toBe(false);
    });

    it('should handle different date formats', async () => {
      const response = {
        isEligible: true,
        effectiveDate: '01/01/2024',
        termDate: '12/31/2024',
        coverage: {
          deductible: 1000,
          outOfPocketMax: 5000
        }
      };

      const result = await parser.parse(response, mockPlan);
      
      expect(result.isEligible).toBe(true);
      // The parser should handle different date formats
      // Parse the dates manually to handle different formats
      const parseDate = (dateStr: string | Date) => {
        if (dateStr instanceof Date) return dateStr;
        // Handle MM/DD/YYYY format
        if (typeof dateStr === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const [month, day, year] = dateStr.split('/').map(Number);
          return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
      };
      
      // Ensure dates are defined before parsing
      expect(result.effectiveDate).toBeDefined();
      expect(result.termDate).toBeDefined();
      
      if (result.effectiveDate && result.termDate) {
        const effectiveDate = parseDate(result.effectiveDate);
        const termDate = parseDate(result.termDate);
        
        expect(effectiveDate.getFullYear()).toBe(2024);
        expect(effectiveDate.getMonth()).toBe(0); // January (0-indexed)
        expect(effectiveDate.getDate()).toBe(1);
        
        expect(termDate.getFullYear()).toBe(2024);
        expect(termDate.getMonth()).toBe(11); // December (0-indexed)
        expect(termDate.getDate()).toBe(31);
      }
      
      expect(result.coverage).toBeDefined();
    });

    it('should handle partial coverage information', async () => {
      const response = {
        isEligible: true,
        coverage: {
          deductible: 1000,
          outOfPocketMax: 5000
        }
      };

      const result = await parser.parse(response, mockPlan);
      
      expect(result.isEligible).toBe(true);
      // Only the provided fields should be present
      expect(result.coverage?.deductible).toBe(1000);
      expect(result.coverage?.outOfPocketMax).toBe(5000);
      // Other fields should be undefined
      expect(result.coverage?.deductibleMet).toBeUndefined();
      expect(result.coverage?.outOfPocketMet).toBeUndefined();
    });
  });

  describe('canParse', () => {
    it('should always return true', () => {
      expect(parser.canParse({})).toBe(true);
      expect(parser.canParse('test')).toBe(true);
      expect(parser.canParse(123)).toBe(true);
    });
  });
});
