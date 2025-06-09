import { NextRequest } from 'next/server';
import { POST, GET } from '../../app/api/claims/route';
import * as validation from '../../lib/claims/validation';
import { getServerSession } from 'next-auth';
import { logger } from '../../lib/logger';
import prisma from '../../lib/prisma';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    claim: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn()
    },
    insurancePlan: {
      findUnique: jest.fn()
    }
  }
}));
jest.mock('../../lib/claims/validation');

describe('Claims API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for getServerSession
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user123', name: 'Test User', email: 'test@example.com' }
    });
    
    // Default mock for validation
    (validation.validateClaimInput as jest.Mock).mockReturnValue([]);
  });
  
  describe('POST handler', () => {
    it('should create a claim with multiple service lines', async () => {
      // Mock successful claim creation
      (prisma.claim.create as jest.Mock).mockResolvedValue({
        id: 'claim123',
        userId: 'user123',
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT',
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
      });
      
      // Mock insurance plan verification
      (prisma.insurancePlan.findUnique as jest.Mock).mockResolvedValue({
        id: 'plan123',
        userId: 'user123',
        planName: 'Test Insurance'
      });
      
      // Create request with claim data
      const request = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          claimNumber: 'CLM12345',
          totalCharge: 250.00,
          status: 'DRAFT',
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
        })
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(201);
      expect(responseData.id).toBe('claim123');
      expect(responseData.claimLines).toHaveLength(2);
      expect(validation.validateClaimInput).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Claim created'),
        expect.objectContaining({ claimId: 'claim123' })
      );
    });
    
    it('should return validation errors when claim is invalid', async () => {
      // Mock validation errors
      (validation.validateClaimInput as jest.Mock).mockReturnValue([
        'Total charge (300) does not match sum of line charges (250.00)',
        'Line 2: CPT code must be 5 digits'
      ]);
      
      // Create request with invalid claim data
      const request = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          claimNumber: 'CLM12345',
          totalCharge: 300.00, // Incorrect total
          status: 'DRAFT',
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
              cptCode: '829', // Invalid CPT code
              description: 'Glucose, quantitative',
              charge: 100.00,
              serviceDate: new Date().toISOString()
            }
          ]
        })
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.errors).toHaveLength(2);
      expect(responseData.errors).toContain('Total charge (300) does not match sum of line charges (250.00)');
      expect(responseData.errors).toContain('Line 2: CPT code must be 5 digits');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Claim validation failed'),
        expect.objectContaining({
          errors: expect.arrayContaining([
            'Total charge (300) does not match sum of line charges (250.00)',
            'Line 2: CPT code must be 5 digits'
          ])
        })
      );
    });
    
    it('should verify insurance plan ownership', async () => {
      // Mock insurance plan with different user ID
      (prisma.insurancePlan.findUnique as jest.Mock).mockResolvedValue({
        id: 'plan123',
        userId: 'different_user', // Different user ID
        planName: 'Test Insurance'
      });
      
      // Create request with claim data
      const request = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          claimNumber: 'CLM12345',
          totalCharge: 250.00,
          status: 'DRAFT',
          insurancePlanId: 'plan123',
          claimLines: [
            {
              lineNumber: 1,
              cptCode: '80053',
              description: 'Comprehensive Metabolic Panel',
              charge: 250.00,
              serviceDate: new Date().toISOString()
            }
          ]
        })
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Insurance plan not found or not owned by user');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Insurance plan ownership verification failed'),
        expect.objectContaining({ planId: 'plan123', userId: 'user123' })
      );
    });
    
    it('should handle database errors gracefully', async () => {
      // Mock validation success
      (validation.validateClaimInput as jest.Mock).mockReturnValue([]);
      
      // Mock insurance plan verification success
      (prisma.insurancePlan.findUnique as jest.Mock).mockResolvedValue({
        id: 'plan123',
        userId: 'user123',
        planName: 'Test Insurance'
      });
      
      // Mock database error
      (prisma.claim.create as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Create request with claim data
      const request = new NextRequest('http://localhost:3000/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          claimNumber: 'CLM12345',
          totalCharge: 250.00,
          status: 'DRAFT',
          insurancePlanId: 'plan123',
          claimLines: [
            {
              lineNumber: 1,
              cptCode: '80053',
              description: 'Comprehensive Metabolic Panel',
              charge: 250.00,
              serviceDate: new Date().toISOString()
            }
          ]
        })
      });
      
      const response = await POST(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Failed to create claim');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error creating claim'),
        expect.objectContaining({ error: expect.any(Error) })
      );
    });
  });
  
  describe('GET handler', () => {
    it('should fetch claims filtered by status', async () => {
      // Mock claims data
      (prisma.claim.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'claim123',
          userId: 'user123',
          claimNumber: 'CLM12345',
          totalCharge: 250.00,
          status: 'DRAFT',
          insurancePlanId: 'plan123',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'claim456',
          userId: 'user123',
          claimNumber: 'CLM67890',
          totalCharge: 350.00,
          status: 'DRAFT',
          insurancePlanId: 'plan123',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      
      // Create request with status filter
      const url = new URL('http://localhost:3000/api/claims');
      url.searchParams.append('status', 'DRAFT');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.claims).toHaveLength(2);
      expect(prisma.claim.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user123',
            status: 'DRAFT'
          })
        })
      );
    });
    
    it('should fetch a specific claim by ID with related data', async () => {
      // Mock claim data with related entities
      (prisma.claim.findUnique as jest.Mock).mockResolvedValue({
        id: 'claim123',
        userId: 'user123',
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT',
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
        ],
        claimEvents: [
          {
            id: 'event1',
            claimId: 'claim123',
            eventType: 'created',
            details: 'Claim created',
            createdAt: new Date()
          }
        ],
        insurancePlan: {
          id: 'plan123',
          userId: 'user123',
          planName: 'Test Insurance',
          payerId: 'payer123',
          payerName: 'Test Payer'
        }
      });
      
      // Create request with claim ID
      const url = new URL('http://localhost:3000/api/claims');
      url.searchParams.append('id', 'claim123');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.id).toBe('claim123');
      expect(responseData.claimLines).toHaveLength(2);
      expect(responseData.claimEvents).toHaveLength(1);
      expect(responseData.insurancePlan).toBeDefined();
      expect(prisma.claim.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'claim123' },
          include: expect.objectContaining({
            claimLines: true,
            claimEvents: true,
            insurancePlan: true
          })
        })
      );
    });
    
    it('should return 404 for claim not found', async () => {
      // Mock claim not found
      (prisma.claim.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Create request with non-existent claim ID
      const url = new URL('http://localhost:3000/api/claims');
      url.searchParams.append('id', 'nonexistent');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Claim not found');
    });
    
    it('should return 403 for unauthorized claim access', async () => {
      // Mock claim with different user ID
      (prisma.claim.findUnique as jest.Mock).mockResolvedValue({
        id: 'claim123',
        userId: 'different_user', // Different user ID
        claimNumber: 'CLM12345',
        totalCharge: 250.00,
        status: 'DRAFT',
        insurancePlanId: 'plan123',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create request with claim ID
      const url = new URL('http://localhost:3000/api/claims');
      url.searchParams.append('id', 'claim123');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(403);
      expect(responseData.error).toBe('Not authorized to access this claim');
    });
    
    it('should handle unauthenticated requests', async () => {
      // Mock no session
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/claims');
      
      const response = await GET(request);
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Not authenticated');
    });
  });
});
