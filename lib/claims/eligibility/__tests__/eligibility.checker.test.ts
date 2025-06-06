import { PrismaClient } from '@prisma/client';
import { EligibilityChecker, DefaultEligibilityParser, DefaultEligibilityValidator } from '../..';
import { CacheFactory } from '../cache';
import { CheckEligibilityOptions } from '../types';

// Mock Prisma client
const mockPrisma = {
  insurancePlan: {
    findFirst: jest.fn(),
  },
} as unknown as PrismaClient;

describe('EligibilityChecker', () => {
  let checker: EligibilityChecker;
  let mockCache: any;
  
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
      clear: jest.fn().mockResolvedValue(true),
    };
    
    // Mock CacheFactory
    jest.spyOn(CacheFactory, 'create').mockReturnValue(mockCache);
    
    // Create checker instance
    checker = new EligibilityChecker({
      prisma: mockPrisma,
      cacheType: 'memory',
    });
    
    // Register default parser and validator
    checker.registerParser(new DefaultEligibilityParser());
    checker.registerValidator('payer-1', new DefaultEligibilityValidator());
    
    // Setup default mock for findFirst
    (mockPrisma.insurancePlan.findFirst as jest.Mock).mockResolvedValue(mockPlan);
  });

  describe('checkEligibility', () => {
    it('should return cached result if available', async () => {
      const cachedResult = {
        isEligible: true,
        effectiveDate: '2024-01-01T00:00:00.000Z',
        termDate: '2024-12-31T00:00:00.000Z',
        plan: {
          type: 'PPO',
          name: 'Test Payer',
          id: 'payer-1'
        },
        coverage: {
          deductible: 1000,
          deductibleMet: 250,
          outOfPocketMax: 5000,
          outOfPocketMet: 1000,
          copay: 30,
          coinsurance: 20
        },
        cached: true
      };
      
      mockCache.get.mockResolvedValueOnce(cachedResult);
      
      const result = await checker.checkEligibility('member-1');
      
      expect(result).toEqual(cachedResult);
      expect(mockCache.get).toHaveBeenCalledWith('eligibility:member-1:test-plan-1:default');
    });

    it('should return basic eligibility when no real-time check is needed', async () => {
      const result = await checker.checkEligibility('member-1');
      
      expect(result.isEligible).toBe(true);
      expect(result.plan).toEqual({
        type: 'PPO',
        name: 'Test Payer',
        id: 'payer-1'
      });
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should return error when no active plan is found', async () => {
      (mockPrisma.insurancePlan.findFirst as jest.Mock).mockResolvedValueOnce(null);
      
      const result = await checker.checkEligibility('non-existent-member');
      
      expect(result.isEligible).toBe(false);
      expect(result.error?.code).toBe('NO_ACTIVE_PLAN');
    });

    it('should validate the insurance plan before checking eligibility', async () => {
      const invalidPlan = { ...mockPlan, memberId: '' };
      (mockPrisma.insurancePlan.findFirst as jest.Mock).mockResolvedValueOnce(invalidPlan);
      
      const result = await checker.checkEligibility('member-1');
      
      expect(result.isEligible).toBe(false);
      expect(result.error?.code).toBe('INVALID_PLAN');
    });

    it('should use real-time check when payer supports it', async () => {
      // Configure payer to support real-time checks
      checker.configurePayer({
        id: 'payer-1',
        name: 'Test Payer',
        supportsRealtime: true,
        defaultResponseTime: 1000,
      });
      
      const result = await checker.checkEligibility('member-1');
      
      expect(result.isEligible).toBe(true);
      expect(result.coverage).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear the cache for a member', async () => {
      await checker.clearCache('member-1');
      
      expect(mockCache.clear).toHaveBeenCalled();
    });
  });
});
