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
    agentKnowledge: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('SimplifiedBillingAgent', () => {
  let agent: SimplifiedBillingAgent;
  let mockPrisma: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    agent = SimplifiedBillingAgent.getInstance();
    
    // Reset singleton for testing
    (SimplifiedBillingAgent as any).instance = null;
    agent = SimplifiedBillingAgent.getInstance();
  });
  
  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = SimplifiedBillingAgent.getInstance();
      const instance2 = SimplifiedBillingAgent.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('start and stop', () => {
    it('should start and stop the agent', async () => {
      const startSpy = jest.spyOn(agent, 'processQueue').mockImplementation(jest.fn());
      
      await agent.start();
      expect(agent.isRunning).toBe(true);
      expect(startSpy).toHaveBeenCalled();
      
      await agent.stop();
      expect(agent.isRunning).toBe(false);
    });
  });
  
  describe('getTaskById', () => {
    it('should return null if task is not found', async () => {
      mockPrisma.agentTask.findUnique.mockResolvedValue(null);
      
      const result = await agent.getTaskById('non-existent-id');
      expect(result).toBeNull();
      expect(mockPrisma.agentTask.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' }
      });
    });
    
    it('should convert Prisma task to TaskWithMetadata', async () => {
      const mockTask = {
        id: 'task-1',
        taskType: 'CHECK_ELIGIBILITY',
        entityId: 'claim-1',
        entityType: 'CLAIM',
        status: 'PENDING',
        priority: 1,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        error: null
      };
      
      mockPrisma.agentTask.findUnique.mockResolvedValue(mockTask);
      
      const result = await agent.getTaskById('task-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('task-1');
      expect(result?.taskType).toBe(TaskType.CHECK_ELIGIBILITY);
      expect(result?.data).toEqual({ entityId: 'claim-1', entityType: 'CLAIM' });
      expect(result?.status).toBe(TaskStatus.PENDING);
    });
  });
  
  describe('createTask', () => {
    it('should create a new task', async () => {
      const mockTask = {
        id: 'new-task',
        taskType: 'CREATE_CLAIM',
        entityId: 'report-1',
        entityType: 'REPORT',
        status: 'PENDING',
        priority: 2,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrisma.agentTask.create.mockResolvedValue(mockTask);
      
      const taskData = {
        taskType: TaskType.CREATE_CLAIM,
        entityId: 'report-1',
        entityType: 'REPORT',
        priority: 2
      };
      
      const result = await agent.createTask(taskData);
      expect(result).toBe('new-task');
      expect(mockPrisma.agentTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskType: 'CREATE_CLAIM',
          entityId: 'report-1',
          entityType: 'REPORT',
          priority: 2,
          status: 'PENDING',
          attempts: 0,
          maxAttempts: 3
        })
      });
    });
  });
  
  describe('processQueue', () => {
    it('should process pending tasks in order of priority', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          taskType: 'CHECK_ELIGIBILITY',
          entityId: 'claim-1',
          entityType: 'CLAIM',
          status: 'PENDING',
          priority: 1,
          attempts: 0,
          maxAttempts: 3,
          scheduledFor: new Date(Date.now() - 1000), // Past date
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      mockPrisma.agentTask.findMany.mockResolvedValue(mockTasks);
      
      const processTaskSpy = jest.spyOn(agent, 'processTask').mockResolvedValue(true);
      
      await agent.processQueue();
      
      expect(mockPrisma.agentTask.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          scheduledFor: { lte: expect.any(Date) }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' }
        ],
        take: 10
      });
      
      expect(processTaskSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'task-1',
        taskType: TaskType.CHECK_ELIGIBILITY
      }));
    });
    
    it('should not process tasks if agent is not running', async () => {
      agent.isRunning = false;
      
      const processTaskSpy = jest.spyOn(agent, 'processTask');
      
      await agent.processQueue();
      
      expect(processTaskSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('updateTaskStatus', () => {
    it('should update task status', async () => {
      const mockTask = {
        id: 'task-1',
        status: 'COMPLETED'
      };
      
      mockPrisma.agentTask.update.mockResolvedValue(mockTask);
      
      await agent.updateTaskStatus('task-1', TaskStatus.COMPLETED);
      
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { status: 'COMPLETED' }
      });
    });
  });
  
  describe('handleTaskFailure', () => {
    it('should reschedule task with exponential backoff if attempts < maxAttempts', async () => {
      const mockTask = {
        id: 'task-1',
        attempts: 1,
        maxAttempts: 3,
        status: 'PENDING',
        scheduledFor: new Date()
      };
      
      mockPrisma.agentTask.update.mockResolvedValue(mockTask);
      
      const error = new Error('Test error');
      await agent.handleTaskFailure('task-1', error);
      
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: expect.objectContaining({
          attempts: 2,
          status: 'PENDING',
          scheduledFor: expect.any(Date),
          error: JSON.stringify({ message: 'Test error' })
        })
      });
    });
    
    it('should mark task as failed if attempts >= maxAttempts', async () => {
      const mockTask = {
        id: 'task-1',
        attempts: 3,
        maxAttempts: 3,
        status: 'FAILED'
      };
      
      mockPrisma.agentTask.update.mockResolvedValue(mockTask);
      
      const error = new Error('Test error');
      await agent.handleTaskFailure('task-1', error);
      
      expect(mockPrisma.agentTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: expect.objectContaining({
          attempts: 4,
          status: 'FAILED',
          error: JSON.stringify({ message: 'Test error' })
        })
      });
    });
  });
});
