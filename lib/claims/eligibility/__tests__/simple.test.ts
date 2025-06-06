import { DefaultEligibilityParser } from '../parsers/default.parser';

// Enable debug logging for tests
const debug = (message: string, ...args: any[]) => {
  console.log(`[DEBUG] ${message}`, ...args);
};

describe('Simple Test', () => {
  let originalConsoleLog: any;
  
  beforeAll(() => {
    // Store original console.log
    originalConsoleLog = console.log;
    // Replace console.log with our debug function
    console.log = (...args) => {
      debug(...args);
      originalConsoleLog(...args);
    };
  });

  afterAll(() => {
    // Restore original console.log
    console.log = originalConsoleLog;
  });

  it('should pass a simple test', () => {
    debug('Starting simple test');
    expect(true).toBe(true);
    debug('Simple test completed');
  });

  it('should test DefaultEligibilityParser', async () => {
    debug('Creating DefaultEligibilityParser instance');
    const parser = new DefaultEligibilityParser();
    
    debug('Creating mock plan');
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

    debug('Calling parser.parse()');
    const result = await parser.parse(response, mockPlan);
    
    debug('Parser result:', JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
    expect(result.isEligible).toBe(true);
    debug('Test completed successfully');
  });
});
