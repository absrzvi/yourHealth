import { 
  processCreateClaimTask,
  processCheckEligibilityTask,
  processGenerateEdiTask,
  processSubmitClaimTask,
  processCheckStatusTask,
  processFileAppealTask
} from '../taskProcessors';
import { PrismaClient } from '@prisma/client';
import { TaskWithMetadata, TaskStatus } from '../types';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    claim: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    report: {
      findUnique: jest.fn(),
    },
    eligibilityCheck: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    ediFile: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    claimSubmission: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    claimStatusCheck: {
      create: jest.fn(),
    },
    claimAppeal: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Task Processors', () => {
  let mockPrisma: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
  });
  
  describe('processCreateClaimTask', () => {
    it('should create a claim from report data', async () => {
      const mockReport = {
        id: 'report-1',
        userId: 'user-1',
        data: { biomarkers: [{ name: 'Glucose', value: 100 }] }
      };
      
      const mockClaim = {
        id: 'claim-1',
        reportId: 'report-1',
        status: 'DRAFT'
      };
      
      mockPrisma.report.findUnique.mockResolvedValue(mockReport);
      mockPrisma.claim.create.mockResolvedValue(mockClaim);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'CREATE_CLAIM',
        data: { entityId: 'report-1', entityType: 'REPORT' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processCreateClaimTask(task, mockPrisma);
      
      expect(result).toBe(true);
      expect(mockPrisma.report.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-1' }
      });
      expect(mockPrisma.claim.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reportId: 'report-1',
          userId: 'user-1',
          status: 'DRAFT'
        })
      });
    });
    
    it('should return false if report is not found', async () => {
      mockPrisma.report.findUnique.mockResolvedValue(null);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'CREATE_CLAIM',
        data: { entityId: 'report-1', entityType: 'REPORT' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processCreateClaimTask(task, mockPrisma);
      
      expect(result).toBe(false);
    });
  });
  
  describe('processCheckEligibilityTask', () => {
    it('should check eligibility for a claim', async () => {
      const mockClaim = {
        id: 'claim-1',
        userId: 'user-1',
        insurancePlanId: 'plan-1',
        patientInfo: { firstName: 'John', lastName: 'Doe' }
      };
      
      const mockEligibilityCheck = {
        id: 'elig-1',
        claimId: 'claim-1',
        status: 'COMPLETED',
        result: { eligible: true }
      };
      
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim);
      mockPrisma.eligibilityCheck.create.mockResolvedValue(mockEligibilityCheck);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'CHECK_ELIGIBILITY',
        data: { entityId: 'claim-1', entityType: 'CLAIM' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processCheckEligibilityTask(task, mockPrisma);
      
      expect(result).toBe(true);
      expect(mockPrisma.claim.findUnique).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        include: { insurancePlan: true }
      });
      expect(mockPrisma.eligibilityCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          claimId: 'claim-1',
          status: 'COMPLETED'
        })
      });
    });
    
    it('should return false if claim is not found', async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(null);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'CHECK_ELIGIBILITY',
        data: { entityId: 'claim-1', entityType: 'CLAIM' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processCheckEligibilityTask(task, mockPrisma);
      
      expect(result).toBe(false);
    });
  });
  
  describe('processGenerateEdiTask', () => {
    it('should generate EDI file for a claim', async () => {
      const mockClaim = {
        id: 'claim-1',
        userId: 'user-1',
        insurancePlanId: 'plan-1',
        status: 'READY',
        claimLines: [{ id: 'line-1', service: 'Test', amount: 100 }]
      };
      
      const mockEdiFile = {
        id: 'edi-1',
        claimId: 'claim-1',
        content: 'EDI content',
        status: 'GENERATED'
      };
      
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim);
      mockPrisma.ediFile.create.mockResolvedValue(mockEdiFile);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'GENERATE_EDI',
        data: { entityId: 'claim-1', entityType: 'CLAIM' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processGenerateEdiTask(task, mockPrisma);
      
      expect(result).toBe(true);
      expect(mockPrisma.claim.findUnique).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        include: {
          claimLines: true,
          insurancePlan: true,
          user: true
        }
      });
      expect(mockPrisma.ediFile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          claimId: 'claim-1',
          status: 'GENERATED'
        })
      });
    });
    
    it('should return false if claim is not found', async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(null);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'GENERATE_EDI',
        data: { entityId: 'claim-1', entityType: 'CLAIM' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processGenerateEdiTask(task, mockPrisma);
      
      expect(result).toBe(false);
    });
  });
  
  describe('processSubmitClaimTask', () => {
    it('should submit a claim with EDI file', async () => {
      const mockClaim = {
        id: 'claim-1',
        status: 'READY'
      };
      
      const mockEdiFile = {
        id: 'edi-1',
        claimId: 'claim-1',
        content: 'EDI content',
        status: 'GENERATED'
      };
      
      const mockSubmission = {
        id: 'sub-1',
        claimId: 'claim-1',
        status: 'SUBMITTED',
        trackingNumber: '12345'
      };
      
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim);
      mockPrisma.ediFile.findFirst.mockResolvedValue(mockEdiFile);
      mockPrisma.claimSubmission.create.mockResolvedValue(mockSubmission);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'SUBMIT_CLAIM',
        data: { entityId: 'claim-1', entityType: 'CLAIM' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processSubmitClaimTask(task, mockPrisma);
      
      expect(result).toBe(true);
      expect(mockPrisma.claim.findUnique).toHaveBeenCalledWith({
        where: { id: 'claim-1' }
      });
      expect(mockPrisma.ediFile.findFirst).toHaveBeenCalledWith({
        where: { claimId: 'claim-1', status: 'GENERATED' }
      });
      expect(mockPrisma.claimSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          claimId: 'claim-1',
          status: 'SUBMITTED'
        })
      });
      expect(mockPrisma.claim.update).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        data: { status: 'SUBMITTED' }
      });
    });
    
    it('should return false if claim or EDI file is not found', async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(null);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'SUBMIT_CLAIM',
        data: { entityId: 'claim-1', entityType: 'CLAIM' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processSubmitClaimTask(task, mockPrisma);
      
      expect(result).toBe(false);
    });
  });
  
  describe('processCheckStatusTask', () => {
    it('should check status of a submitted claim', async () => {
      const mockClaim = {
        id: 'claim-1',
        status: 'SUBMITTED'
      };
      
      const mockSubmission = {
        id: 'sub-1',
        claimId: 'claim-1',
        trackingNumber: '12345'
      };
      
      const mockStatusCheck = {
        id: 'status-1',
        claimId: 'claim-1',
        status: 'COMPLETED',
        result: { status: 'ACCEPTED' }
      };
      
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim);
      mockPrisma.claimSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrisma.claimStatusCheck.create.mockResolvedValue(mockStatusCheck);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'CHECK_STATUS',
        data: { entityId: 'claim-1', entityType: 'CLAIM' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processCheckStatusTask(task, mockPrisma);
      
      expect(result).toBe(true);
      expect(mockPrisma.claim.findUnique).toHaveBeenCalledWith({
        where: { id: 'claim-1' }
      });
      expect(mockPrisma.claimSubmission.findFirst).toHaveBeenCalledWith({
        where: { claimId: 'claim-1' }
      });
      expect(mockPrisma.claimStatusCheck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          claimId: 'claim-1',
          status: 'COMPLETED'
        })
      });
      expect(mockPrisma.claim.update).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        data: { status: 'ACCEPTED' }
      });
    });
    
    it('should return false if claim or submission is not found', async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(null);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'CHECK_STATUS',
        data: { entityId: 'claim-1', entityType: 'CLAIM' },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processCheckStatusTask(task, mockPrisma);
      
      expect(result).toBe(false);
    });
  });
  
  describe('processFileAppealTask', () => {
    it('should file an appeal for a denied claim', async () => {
      const mockClaim = {
        id: 'claim-1',
        status: 'DENIED'
      };
      
      const mockAppeal = {
        id: 'appeal-1',
        claimId: 'claim-1',
        status: 'SUBMITTED',
        reason: 'Incorrect denial'
      };
      
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim);
      mockPrisma.claimAppeal.create.mockResolvedValue(mockAppeal);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'FILE_APPEAL',
        data: { 
          entityId: 'claim-1', 
          entityType: 'CLAIM',
          metadata: { reason: 'Incorrect denial' }
        },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processFileAppealTask(task, mockPrisma);
      
      expect(result).toBe(true);
      expect(mockPrisma.claim.findUnique).toHaveBeenCalledWith({
        where: { id: 'claim-1' }
      });
      expect(mockPrisma.claimAppeal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          claimId: 'claim-1',
          status: 'SUBMITTED',
          reason: 'Incorrect denial'
        })
      });
      expect(mockPrisma.claim.update).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        data: { status: 'APPEALED' }
      });
    });
    
    it('should return false if claim is not found', async () => {
      mockPrisma.claim.findUnique.mockResolvedValue(null);
      
      const task: TaskWithMetadata = {
        id: 'task-1',
        taskType: 'FILE_APPEAL',
        data: { 
          entityId: 'claim-1', 
          entityType: 'CLAIM',
          metadata: { reason: 'Incorrect denial' }
        },
        status: TaskStatus.PENDING,
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        errorData: null
      };
      
      const result = await processFileAppealTask(task, mockPrisma);
      
      expect(result).toBe(false);
    });
  });
});
