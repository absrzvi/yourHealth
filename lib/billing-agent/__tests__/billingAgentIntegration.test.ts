import { SimplifiedBillingAgent } from '../SimplifiedBillingAgent';
import { TaskType, TaskStatus } from '../types';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    agentTask: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
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
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('Billing Agent Integration Tests', () => {
  let agent: SimplifiedBillingAgent;
  let mockPrisma: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    
    // Reset singleton for testing
    (SimplifiedBillingAgent as any).instance = null;
    agent = SimplifiedBillingAgent.getInstance();
    
    // Mock the setTimeout to execute immediately
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('End-to-end claim processing workflow', () => {
    it('should process a claim through the entire workflow', async () => {
      // Setup mocks for the entire workflow
      const mockReport = {
        id: 'report-1',
        userId: 'user-1',
        data: { biomarkers: [{ name: 'Glucose', value: 100 }] }
      };
      
      const mockClaim = {
        id: 'claim-1',
        reportId: 'report-1',
        userId: 'user-1',
        status: 'DRAFT',
        insurancePlanId: 'plan-1',
        patientInfo: { firstName: 'John', lastName: 'Doe' }
      };
      
      const mockEligibilityCheck = {
        id: 'elig-1',
        claimId: 'claim-1',
        status: 'COMPLETED',
        result: { eligible: true }
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
      
      const mockStatusCheck = {
        id: 'status-1',
        claimId: 'claim-1',
        status: 'COMPLETED',
        result: { status: 'ACCEPTED' }
      };
      
      // Mock task creation responses
      const mockTasks = {
        'create-claim': {
          id: 'task-create-claim',
          taskType: 'CREATE_CLAIM',
          entityId: 'report-1',
          entityType: 'REPORT',
          status: 'PENDING',
          priority: 5,
          attempts: 0,
          maxAttempts: 3,
          scheduledFor: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'check-eligibility': {
          id: 'task-check-eligibility',
          taskType: 'CHECK_ELIGIBILITY',
          entityId: 'claim-1',
          entityType: 'CLAIM',
          status: 'PENDING',
          priority: 4,
          attempts: 0,
          maxAttempts: 3,
          scheduledFor: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'generate-edi': {
          id: 'task-generate-edi',
          taskType: 'GENERATE_EDI',
          entityId: 'claim-1',
          entityType: 'CLAIM',
          status: 'PENDING',
          priority: 3,
          attempts: 0,
          maxAttempts: 3,
          scheduledFor: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'submit-claim': {
          id: 'task-submit-claim',
          entityId: 'claim-1',
          entityType: 'CLAIM',
          taskType: 'SUBMIT_CLAIM',
          status: 'PENDING',
          priority: 2,
          attempts: 0,
          maxAttempts: 3,
          scheduledFor: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'check-status': {
          id: 'task-check-status',
          taskType: 'CHECK_STATUS',
          entityId: 'claim-1',
          entityType: 'CLAIM',
          status: 'PENDING',
          priority: 1,
          attempts: 0,
          maxAttempts: 3,
          scheduledFor: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      // Setup mock implementations
      mockPrisma.agentTask.create.mockImplementation((args) => {
        const taskType = args.data.taskType;
        if (taskType === 'CREATE_CLAIM') return mockTasks['create-claim'];
        if (taskType === 'CHECK_ELIGIBILITY') return mockTasks['check-eligibility'];
        if (taskType === 'GENERATE_EDI') return mockTasks['generate-edi'];
        if (taskType === 'SUBMIT_CLAIM') return mockTasks['submit-claim'];
        if (taskType === 'CHECK_STATUS') return mockTasks['check-status'];
        return null;
      });
      
      mockPrisma.agentTask.findMany.mockImplementation(() => {
        // Return tasks in order of processing
        return [mockTasks['create-claim']];
      });
      
      mockPrisma.agentTask.findUnique.mockImplementation((args) => {
        const taskId = args.where.id;
        if (taskId === 'task-create-claim') return mockTasks['create-claim'];
        if (taskId === 'task-check-eligibility') return mockTasks['check-eligibility'];
        if (taskId === 'task-generate-edi') return mockTasks['generate-edi'];
        if (taskId === 'task-submit-claim') return mockTasks['submit-claim'];
        if (taskId === 'task-check-status') return mockTasks['check-status'];
        return null;
      });
      
      mockPrisma.report.findUnique.mockResolvedValue(mockReport);
      mockPrisma.claim.create.mockResolvedValue(mockClaim);
      mockPrisma.claim.findUnique.mockResolvedValue(mockClaim);
      mockPrisma.eligibilityCheck.create.mockResolvedValue(mockEligibilityCheck);
      mockPrisma.ediFile.create.mockResolvedValue(mockEdiFile);
      mockPrisma.ediFile.findFirst.mockResolvedValue(mockEdiFile);
      mockPrisma.claimSubmission.create.mockResolvedValue(mockSubmission);
      mockPrisma.claimSubmission.findFirst.mockResolvedValue(mockSubmission);
      mockPrisma.claimStatusCheck.create.mockResolvedValue(mockStatusCheck);
      
      // Mock the agent's processTask method to simulate task processing
      const processTaskSpy = jest.spyOn(agent, 'processTask');
      processTaskSpy.mockImplementation(async (task) => {
        // After processing create-claim task, update findMany to return the next task
        if (task.id === 'task-create-claim') {
          mockPrisma.agentTask.findMany.mockResolvedValueOnce([mockTasks['check-eligibility']]);
        } else if (task.id === 'task-check-eligibility') {
          mockPrisma.agentTask.findMany.mockResolvedValueOnce([mockTasks['generate-edi']]);
        } else if (task.id === 'task-generate-edi') {
          mockPrisma.agentTask.findMany.mockResolvedValueOnce([mockTasks['submit-claim']]);
        } else if (task.id === 'task-submit-claim') {
          mockPrisma.agentTask.findMany.mockResolvedValueOnce([mockTasks['check-status']]);
        } else if (task.id === 'task-check-status') {
          mockPrisma.agentTask.findMany.mockResolvedValueOnce([]);
        }
        
        return true;
      });
      
      // Start the agent
      await agent.start();
      
      // Create the initial task
      const createClaimTaskId = await agent.createTask({
        taskType: TaskType.CREATE_CLAIM,
        entityId: 'report-1',
        entityType: 'REPORT',
        priority: 5
      });
      
      expect(createClaimTaskId).toBe('task-create-claim');
      
      // Run the queue processing multiple times to process all tasks
      for (let i = 0; i < 5; i++) {
        await agent.processQueue();
        jest.runAllTimers(); // Run any scheduled timers
      }
      
      // Verify all tasks were processed
      expect(processTaskSpy).toHaveBeenCalledTimes(5);
      
      // Verify the tasks were processed in the correct order
      const processedTaskIds = processTaskSpy.mock.calls.map(call => call[0].id);
      expect(processedTaskIds).toEqual([
        'task-create-claim',
        'task-check-eligibility',
        'task-generate-edi',
        'task-submit-claim',
        'task-check-status'
      ]);
      
      // Verify the claim status was updated correctly through the workflow
      expect(mockPrisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'claim-1' },
          data: { status: 'ACCEPTED' }
        })
      );
      
      // Stop the agent
      await agent.stop();
    });
    
    it('should handle task failures and retry with exponential backoff', async () => {
      // Setup a task that will fail on first attempt
      const mockTask = {
        id: 'task-fail',
        taskType: 'CHECK_ELIGIBILITY',
        entityId: 'claim-1',
        entityType: 'CLAIM',
        status: 'PENDING',
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.agentTask.findMany.mockResolvedValue([mockTask]);
      mockPrisma.agentTask.findUnique.mockResolvedValue(mockTask);
      
      // Mock claim.findUnique to throw an error on first call, then succeed
      let attemptCount = 0;
      mockPrisma.claim.findUnique.mockImplementation(() => {
        if (attemptCount === 0) {
          attemptCount++;
          throw new Error('Database connection error');
        }
        
        return {
          id: 'claim-1',
          status: 'DRAFT',
          insurancePlanId: 'plan-1'
        };
      });
      
      mockPrisma.eligibilityCheck.create.mockResolvedValue({
        id: 'elig-1',
        claimId: 'claim-1',
        status: 'COMPLETED'
      });
      
      // Start the agent
      await agent.start();
      
      // Process the queue - first attempt will fail
      await agent.processQueue();
      
      // Verify task was updated with increased attempts and rescheduled
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-fail' },
          data: expect.objectContaining({
            attempts: 1,
            status: 'PENDING',
            scheduledFor: expect.any(Date),
            error: expect.stringContaining('Database connection error')
          })
        })
      );
      
      // Reset the mock to simulate second attempt
      mockPrisma.agentTask.update.mockClear();
      
      // Process the queue again - second attempt should succeed
      await agent.processQueue();
      
      // Verify eligibility check was created on second attempt
      expect(mockPrisma.eligibilityCheck.create).toHaveBeenCalled();
      
      // Verify task was updated to completed
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-fail' },
          data: { status: 'COMPLETED' }
        })
      );
      
      // Stop the agent
      await agent.stop();
    });
  });
});
