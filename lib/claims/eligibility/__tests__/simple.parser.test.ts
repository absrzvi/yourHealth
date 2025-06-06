import { DefaultEligibilityParser } from '../parsers/default.parser';

describe('Simple DefaultEligibilityParser Test', () => {
  let parser: DefaultEligibilityParser;
  
  beforeEach(() => {
    parser = new DefaultEligibilityParser();
  });

  it('should parse a simple response', async () => {
    const mockPlan = {
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
    };

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
        coinsurance: 20
      },
      plan: {
        type: 'PPO',
        name: 'Test Payer',
        id: 'payer-1'
      }
    };

    console.log('Running simple test...');
    const result = await parser.parse(response, mockPlan);
    console.log('Test result:', JSON.stringify(result, null, 2));
    
    expect(result.isEligible).toBe(true);
    expect(result.effectiveDate).toBeDefined();
    expect(result.termDate).toBeDefined();
    expect(result.coverage).toBeDefined();
    expect(result.plan).toBeDefined();
  });
});
