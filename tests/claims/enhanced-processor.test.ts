import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EnhancedClaimsProcessor } from '@/lib/claims/processor';
import { prisma } from '@/lib/db';
import { ClaimStatus } from '@prisma/client';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    claim: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    claimLine: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    insurancePlan: {
      findUnique: jest.fn(),
    },
    report: {
      findUnique: jest.fn(),
    },
    claimEvent: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('EnhancedClaimsProcessor', () => {
  let processor: EnhancedClaimsProcessor;
  
  beforeEach(() => {
    jest.clearAllMocks();
    processor = new EnhancedClaimsProcessor();
  });

  describe('processNewClaim', () => {
    it('should process a new claim successfully', async () => {
      // Mock data
      const mockClaim = {
        id: 'claim123',
        userId: 'user123',
        insurancePlanId: 'plan123',
        claimNumber: 'CLM12345',
        status: ClaimStatus.DRAFT,
        totalCharge: 150.00,
        allowedAmount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        reportId: 'report123',
      };
      
      const mockClaimLines = [
        {
          id: 'line1',
          claimId: 'claim123',
          cptCode: '80053',
          serviceDate: new Date().toISOString(),
          charge: 45.00,
          units: 1,
          icd10Codes: ['E11.9'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      const mockInsurancePlan = {
        id: 'plan123',
        userId: 'user123',
        payerName: 'Blue Cross',
        payerId: 'BCBS123',
        memberId: 'MEM456',
        groupNumber: 'GRP789',
        planType: 'COMMERCIAL',
        isPrimary: true,
        isActive: true,
        effectiveDate: new Date(),
        termDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const mockReport = {
        id: 'report123',
        userId: 'user123',
        title: 'Comprehensive Metabolic Panel',
        type: 'LAB',
        date: new Date(),
        provider: 'Lab Corp',
        parsedData: JSON.stringify({
          biomarkers: [
            { name: 'GLUCOSE', value: '95', unit: 'mg/dL', range: '70-99' },
            { name: 'CREATININE', value: '0.9', unit: 'mg/dL', range: '0.6-1.2' }
          ]
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Setup mocks
      (prisma.claim.findUnique as jest.Mock).mockResolvedValue({
        ...mockClaim,
        claimLines: mockClaimLines,
        insurancePlan: mockInsurancePlan,
        report: mockReport
      });
      
      (prisma.claimLine.findMany as jest.Mock).mockResolvedValue(mockClaimLines);
      (prisma.insurancePlan.findUnique as jest.Mock).mockResolvedValue(mockInsurancePlan);
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockReport);
      (prisma.claimEvent.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.claim.update as jest.Mock).mockResolvedValue({
        ...mockClaim,
        status: ClaimStatus.SUBMITTED
      });
      
      // Execute
      const result = await processor.processNewClaim('claim123');
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.eligibility).toBeDefined();
      expect(result.denialPrediction).toBeDefined();
      expect(result.validationResults).toBeDefined();
      expect(prisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'claim123' },
          data: expect.objectContaining({
            status: ClaimStatus.SUBMITTED
          })
        })
      );
    });
  });
  
  describe('checkEligibility', () => {
    it('should verify patient eligibility', async () => {
      // Mock data
      const mockInsurancePlan = {
        id: 'plan123',
        userId: 'user123',
        payerName: 'Blue Cross',
        payerId: 'BCBS123',
        memberId: 'MEM456',
        groupNumber: 'GRP789',
        planType: 'COMMERCIAL',
        isPrimary: true,
        isActive: true,
        effectiveDate: new Date(),
        termDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const mockUser = {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1980-01-01'),
        email: 'john@example.com',
      };
      
      // Setup mocks
      (prisma.insurancePlan.findUnique as jest.Mock).mockResolvedValue(mockInsurancePlan);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      // Execute
      const result = await processor.checkEligibility('plan123', new Date());
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.coverageActive).toBe(true);
      expect(result.deductibleMet).toBeGreaterThanOrEqual(0);
      expect(result.outOfPocketMet).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('analyzeDenialRisk', () => {
    it('should analyze claim for denial risk', async () => {
      // Mock data
      const mockClaim = {
        id: 'claim123',
        userId: 'user123',
        insurancePlanId: 'plan123',
        claimNumber: 'CLM12345',
        status: ClaimStatus.DRAFT,
        totalCharge: 150.00,
        allowedAmount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        reportId: 'report123',
      };
      
      const mockClaimLines = [
        {
          id: 'line1',
          claimId: 'claim123',
          cptCode: '80053',
          serviceDate: new Date().toISOString(),
          charge: 45.00,
          units: 1,
          icd10Codes: ['E11.9'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
      
      const mockInsurancePlan = {
        id: 'plan123',
        userId: 'user123',
        payerName: 'Blue Cross',
        payerId: 'BCBS123',
        memberId: 'MEM456',
        groupNumber: 'GRP789',
        planType: 'COMMERCIAL',
        isPrimary: true,
        isActive: true,
        effectiveDate: new Date(),
        termDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Setup mocks
      (prisma.claim.findUnique as jest.Mock).mockResolvedValue({
        ...mockClaim,
        claimLines: mockClaimLines,
        insurancePlan: mockInsurancePlan,
      });
      
      (prisma.claimLine.findMany as jest.Mock).mockResolvedValue(mockClaimLines);
      (prisma.claimEvent.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.claimEvent.findFirst as jest.Mock).mockResolvedValue(null);
      
      // Execute
      const result = await processor.analyzeDenialRisk('claim123');
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.denialProbability).toBeGreaterThanOrEqual(0);
      expect(result.denialProbability).toBeLessThanOrEqual(1);
      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
      expect(result.recommendedActions).toBeDefined();
      expect(Array.isArray(result.recommendedActions)).toBe(true);
    });
  });
  
  describe('optimizeRevenue', () => {
    it('should generate revenue optimization suggestions', async () => {
      // Mock data
      const mockClaims = [
        {
          id: 'claim1',
          status: ClaimStatus.PAID,
          totalCharge: 150.00,
          allowedAmount: 120.00,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          claimEvents: [
            {
              eventType: 'payment_received',
              eventDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            }
          ],
          claimLines: [
            { cptCode: '80053', charge: 45.00 }
          ]
        },
        {
          id: 'claim2',
          status: ClaimStatus.DENIED,
          totalCharge: 200.00,
          allowedAmount: 0,
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
          claimEvents: [],
          claimLines: [
            { cptCode: '99213', charge: 120.00 }
          ]
        }
      ];
      
      // Setup mocks
      (prisma.claim.findMany as jest.Mock).mockResolvedValue(mockClaims);
      
      // Execute
      const result = await processor.optimizeRevenue('user123');
      
      // Assertions
      expect(result).toBeDefined();
      expect(result.revenueMetrics).toBeDefined();
      expect(result.optimizationSuggestions).toBeDefined();
      expect(Array.isArray(result.optimizationSuggestions)).toBe(true);
      expect(result.revenueMetrics.totalBilled).toBeGreaterThan(0);
      expect(result.revenueMetrics.totalCollected).toBeGreaterThanOrEqual(0);
    });
  });
});
