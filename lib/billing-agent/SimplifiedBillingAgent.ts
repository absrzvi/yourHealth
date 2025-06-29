import { PrismaClient } from '@prisma/client';
import { 
  AgentStatus, 
  TaskWithMetadata, 
  TaskProcessor, 
  TaskType, 
  AgentTaskStatus 
} from './types';
import { 
  processCreateClaimTask, 
  processCheckEligibilityTask, 
  processGenerateEdiTask, 
  processSubmitClaimTask, 
  processCheckStatusTask, 
  processFileAppealTask 
} from './taskProcessors';

// Constants
const MAX_BACKOFF_MS = 15 * 60 * 1000; // 15 minutes max backoff

// Helper function to convert task status from string to enum
function convertTaskStatus(status: string): AgentTaskStatus {
  return AgentTaskStatus[status as keyof typeof AgentTaskStatus] || AgentTaskStatus.PENDING;
}

// Define interfaces for task data structure
interface AgentTaskData {
  id: string;
  taskType: TaskType;
  entityId: string;
  entityType: string;
  metadata?: Record<string, unknown> | null;
  status: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  error?: string | null;
  result?: Record<string, unknown> | null;
}

// Define interfaces for knowledge data structure
interface AgentKnowledgeData {
  id: string;
  category: string;
  payerId: string;
  successCount: number;
  failureCount: number;
  lastUpdated: Date;
  data?: Record<string, unknown>;
  pattern?: Record<string, unknown>;
}

// Define interfaces for Prisma model extensions with proper typing
interface PrismaExtensions {
  agentTask: {
    findUnique: (args: { where: { id: string } }) => Promise<AgentTaskData | null>;
    findMany: (args: { 
      where?: Record<string, unknown>; 
      take?: number; 
      skip?: number; 
      orderBy?: Array<Record<string, 'asc' | 'desc'>> 
    }) => Promise<AgentTaskData[]>;
    update: (args: { 
      where: { id: string }; 
      data: Record<string, unknown> 
    }) => Promise<AgentTaskData>;
    create: (args: { data: Record<string, unknown> }) => Promise<AgentTaskData>;
    upsert: (args: Record<string, unknown>) => Promise<AgentTaskData>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
    aggregate: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
    delete: (args: { where: { id: string } }) => Promise<AgentTaskData>;
  };
  agentKnowledge: {
    findUnique: (args: Record<string, unknown>) => Promise<AgentKnowledgeData | null>;
    findMany: (args?: Record<string, unknown>) => Promise<AgentKnowledgeData[]>;
    update: (args: Record<string, unknown>) => Promise<AgentKnowledgeData>;
    create: (args: { data: Record<string, unknown> }) => Promise<AgentKnowledgeData>;
    upsert: (args: { 
      where: { category_payerId?: { category: string; payerId: string } };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<AgentKnowledgeData>;
    count: (args?: Record<string, unknown>) => Promise<number>;
    aggregate: (args: { _sum?: Record<string, boolean> }) => Promise<{ _sum: { successCount?: number; failureCount?: number } }>;
  };
}

// Extended PrismaClient type
type ExtendedPrismaClient = PrismaClient & PrismaExtensions;

/**
 * SimplifiedBillingAgent
 * 
 * A singleton class that manages insurance claim tasks asynchronously
 * with a priority queue, retry logic, and knowledge tracking.
 * 
 * This implementation is designed for on-premise deployment with
 * limited resources (16GB RAM) and avoids external dependencies.
 */
export class SimplifiedBillingAgent {
  private static instance: SimplifiedBillingAgent;
  // Using the ExtendedPrismaClient type for better type safety
  private prisma: ExtendedPrismaClient;
  private isRunning: boolean = false;
  private taskQueue: TaskWithMetadata[] = [];
  private currentTask: TaskWithMetadata | null = null;
  private taskProcessors: Record<string, TaskProcessor>;
  private processingPromise: Promise<void> | null = null;
  
  private constructor(prisma: PrismaClient) {
    this.prisma = prisma as ExtendedPrismaClient;
    
    // Initialize task processors
    this.taskProcessors = {
      'CREATE_CLAIM': processCreateClaimTask,
      'CHECK_ELIGIBILITY': processCheckEligibilityTask,
      'GENERATE_EDI': processGenerateEdiTask,
      'SUBMIT_CLAIM': processSubmitClaimTask,
      'CHECK_STATUS': processCheckStatusTask,
      'FILE_APPEAL': processFileAppealTask
    };
    // prisma is already set above
  }

  /**
   * Get the singleton instance of the SimplifiedBillingAgent
   */
  public static getInstance(prisma: PrismaClient): SimplifiedBillingAgent {
    if (!SimplifiedBillingAgent.instance) {
      SimplifiedBillingAgent.instance = new SimplifiedBillingAgent(prisma);
    }
    return SimplifiedBillingAgent.instance;
  }

  /**
   * Start the agent to process tasks
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    await this.loadTasksFromDatabase();
    // Start processing the queue
    setTimeout(() => this.processQueue(), 100);
  }

  /**
   * Stop the agent from processing tasks
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    
    // Wait for current task to complete if there is one
    if (this.processingPromise) {
      await this.processingPromise;
    }
  }

  /**
   * Check if the agent is running
   */
  public getRunningStatus(): boolean {
    return this.isRunning;
  }

  /**
   * Get a task by its ID
   */
  public async getTaskById(taskId: string): Promise<TaskWithMetadata | null> {
    const task = await this.prisma.agentTask.findUnique({
      where: { id: taskId }
    });
    
    if (!task) return null;
    
    // Convert Prisma model to TaskWithMetadata with proper type safety
    const taskWithMetadata: TaskWithMetadata = {
      id: String(task.id),
      taskType: task.taskType as TaskType,
      data: { entityId: task.entityId, entityType: task.entityType },
      status: convertTaskStatus(String(task.status)),
      priority: Number(task.priority),
      attempts: Number(task.attempts),
      maxAttempts: Number(task.maxAttempts),
      scheduledFor: task.scheduledFor instanceof Date ? task.scheduledFor : new Date(task.scheduledFor),
      createdAt: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt),
      updatedAt: task.updatedAt instanceof Date ? task.updatedAt : new Date(task.updatedAt),
      errorData: task.error ? { message: String(task.error) } : null,
      resultData: task.result ? (typeof task.result === 'string' ? JSON.parse(String(task.result)) : task.result as Record<string, unknown>) : null,
      metadata: (task.metadata as Record<string, unknown>) || {}
    };
    
    return taskWithMetadata;
  }

  /**
   * Get tasks with optional filtering
   */
  public async getTasks(status?: string, limit = 10, offset = 0): Promise<TaskWithMetadata[]> {
    const tasks = await this.prisma.agentTask.findMany({
      where: status ? { status } : {},
      take: limit,
      skip: offset,
      orderBy: [
        { priority: 'asc' },
        { scheduledFor: 'asc' }
      ]
    });
    
    // Convert database tasks to TaskWithMetadata with proper type safety
    return tasks.map(task => {
      const taskWithMetadata: TaskWithMetadata = {
        id: String(task.id),
        taskType: task.taskType as TaskType,
        data: { entityId: task.entityId, entityType: task.entityType },
        status: convertTaskStatus(String(task.status)),
        priority: Number(task.priority),
        attempts: Number(task.attempts),
        maxAttempts: Number(task.maxAttempts),
        scheduledFor: task.scheduledFor instanceof Date ? task.scheduledFor : new Date(task.scheduledFor),
        createdAt: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt),
        updatedAt: task.updatedAt instanceof Date ? task.updatedAt : new Date(task.updatedAt),
        errorData: task.error ? { message: String(task.error) } : null,
        resultData: task.result ? (typeof task.result === 'string' ? JSON.parse(task.result) : task.result as Record<string, unknown>) : null,
        metadata: (task.metadata as Record<string, unknown>) || {}
      };
      return taskWithMetadata;
    });
  }


  /**
   * Get the current queue size
   */
  public getQueueSize(): number {
    return this.taskQueue.length;
  }

  /**
   * Create a new task
   */
  public async createTask(taskData: {
    taskType: string;
    entityId: string;
    entityType: string;
    priority?: number;
    metadata?: Record<string, unknown>;
  }): Promise<TaskWithMetadata> {
    // Create task in database
    const task = await this.prisma.agentTask.create({
      data: {
        taskType: taskData.taskType,
        entityId: taskData.entityId,
        entityType: taskData.entityType,
        status: AgentTaskStatus.PENDING,
        priority: taskData.priority || 1,
        attempts: 0,
        maxAttempts: 5,
        scheduledFor: new Date(),
        metadata: taskData.metadata || {}
      }
    });
    
    // Convert to TaskWithMetadata
    const taskWithMetadata: TaskWithMetadata = {
      id: String(task.id),
      taskType: task.taskType as TaskType,
      data: { entityId: task.entityId, entityType: task.entityType },
      status: convertTaskStatus(String(task.status)),
      priority: Number(task.priority),
      attempts: Number(task.attempts),
      maxAttempts: Number(task.maxAttempts),
      scheduledFor: task.scheduledFor instanceof Date ? task.scheduledFor : new Date(task.scheduledFor),
      createdAt: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt),
      updatedAt: task.updatedAt instanceof Date ? task.updatedAt : new Date(task.updatedAt),
      errorData: task.error ? { message: String(task.error) } : null,
      resultData: task.result ? (typeof task.result === 'string' ? JSON.parse(String(task.result)) : task.result as Record<string, unknown>) : null,
      metadata: (task.metadata as Record<string, unknown>) || {}
    };
    
    // Add to queue if agent is running
    if (this.isRunning) {
      this.taskQueue.push(taskWithMetadata);
      // Trigger queue processing
      setTimeout(() => this.processQueue(), 100);
    }
    
    return taskWithMetadata;
  }

  /**
   * Retry a failed task
   */
  public async retryTask(taskId: string): Promise<TaskWithMetadata | null> {
    // Get the task
    const task = await this.getTaskById(taskId);
    
    if (!task) {
      return null;
    }
    
    // Only retry failed tasks
    if (task.status !== AgentTaskStatus.FAILED) {
      throw new Error(`Cannot retry task with status: ${task.status}`);
    }
    
    // Update task in database
    const updatedTask = await this.prisma.agentTask.update({
      where: { id: taskId },
      data: {
        status: AgentTaskStatus.PENDING,
        attempts: 0, // Reset attempts
        scheduledFor: new Date(), // Schedule for immediate execution
        error: null // Clear previous error
      }
    });
    
    // Convert to TaskWithMetadata
    const taskWithMetadata: TaskWithMetadata = {
      id: String(updatedTask.id),
      taskType: updatedTask.taskType as TaskType,
      data: { entityId: updatedTask.entityId, entityType: updatedTask.entityType },
      status: convertTaskStatus(String(updatedTask.status)),
      priority: Number(updatedTask.priority),
      attempts: Number(updatedTask.attempts),
      maxAttempts: Number(updatedTask.maxAttempts),
      scheduledFor: updatedTask.scheduledFor instanceof Date ? updatedTask.scheduledFor : new Date(updatedTask.scheduledFor),
      createdAt: updatedTask.createdAt instanceof Date ? updatedTask.createdAt : new Date(updatedTask.createdAt),
      updatedAt: updatedTask.updatedAt instanceof Date ? updatedTask.updatedAt : new Date(updatedTask.updatedAt),
      errorData: updatedTask.error ? { message: String(updatedTask.error) } : null,
      resultData: updatedTask.result ? (typeof updatedTask.result === 'string' ? JSON.parse(String(updatedTask.result)) : updatedTask.result as Record<string, unknown>) : null,
      metadata: (updatedTask.metadata as Record<string, unknown>) || {}
    };
    
    // Add to queue if agent is running
    if (this.isRunning) {
      this.taskQueue.push(taskWithMetadata);
      // Trigger queue processing
      setTimeout(() => this.processQueue(), 100);
    }
    
    return taskWithMetadata;
  }

  /**
   * Delete a task
   */
  public async deleteTask(taskId: string): Promise<boolean> {
    try {
      // Check if task exists
      const task = await this.getTaskById(taskId);
      
      if (!task) {
        return false;
      }
      
      // Remove from queue if present
      this.taskQueue = this.taskQueue.filter(t => t.id !== taskId);
      
      // Delete from database
      // Using direct prisma client access since our interface doesn't expose delete
      await this.prisma.$queryRaw`DELETE FROM AgentTask WHERE id = ${taskId}`;
      
      return true;
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      return false;
    }
  }

  /**
   * Manually trigger queue processing
   */
  public async triggerProcessQueue(): Promise<boolean> {
    if (!this.isRunning) {
      throw new Error('Cannot process queue when agent is not running');
    }
    
    // Reload tasks from database to ensure we have the latest state
    await this.loadTasksFromDatabase();
    
    // Trigger queue processing
    setTimeout(() => this.processQueue(), 100);
    
    return true;
  }

  /**
   * Get the current status of the agent
   */
  public async getStatus(): Promise<AgentStatus> {
    // Create a type-safe wrapper for count operations
    const countTasks = async (status: AgentTaskStatus): Promise<number> => {
      return await this.prisma.agentTask.count({ where: { status: String(status) } });
    };
    
    // Get counts for different task statuses
    const [
      pendingCount,
      runningCount,
      completedCount,
      failedCount,
      retryingCount
    ] = await Promise.all([
      countTasks(AgentTaskStatus.PENDING),
      countTasks(AgentTaskStatus.RUNNING),
      countTasks(AgentTaskStatus.COMPLETED),
      countTasks(AgentTaskStatus.FAILED),
      countTasks(AgentTaskStatus.RETRYING)
    ]);
    
    // Get knowledge count
    const knowledgeCount = await this.prisma.agentKnowledge.count();
    
    // Get aggregate statistics for knowledge
    // Since we can't directly use the aggregate function with our type definition,
    // we'll use a workaround to get the sum of success and failure counts
    const knowledgeItems = await this.prisma.agentKnowledge.findMany();
    
    // Calculate success and failure counts manually
    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    
    for (const item of knowledgeItems) {
      totalSuccessCount += item.successCount;
      totalFailureCount += item.failureCount;
    }
    
    const totalAttempts = totalSuccessCount + totalFailureCount;
    const successRate = totalAttempts > 0 ? totalSuccessCount / totalAttempts : 0;
    
    return {
      isRunning: this.isRunning,
      queueLength: this.taskQueue.length,
      taskStats: {
        pending: pendingCount,
        running: runningCount,
        completed: completedCount,
        failed: failedCount,
        retrying: retryingCount
      },
      knowledgeStats: {
        totalPatterns: knowledgeCount,
        successRate
      }
    };
  }

  /**
   * Load tasks from database into the queue
   */
  private async loadTasksFromDatabase(): Promise<void> {
    try {
      // Get all pending and retrying tasks
      const tasks = await this.prisma.agentTask.findMany({
        where: {
          OR: [
            { status: AgentTaskStatus.PENDING },
            { status: AgentTaskStatus.RETRYING }
          ],
          scheduledFor: {
            lte: new Date()
          }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' }
        ]
      });
      
      // Convert to TaskWithMetadata and add to queue
      this.taskQueue = tasks.map(task => {
        // Ensure we have proper type safety
        const taskWithMetadata: TaskWithMetadata = {
          id: String(task.id),
          taskType: task.taskType as TaskType,
          data: { entityId: task.entityId, entityType: task.entityType },
          status: convertTaskStatus(String(task.status)),
          priority: Number(task.priority),
          attempts: Number(task.attempts),
          maxAttempts: Number(task.maxAttempts),
          scheduledFor: task.scheduledFor instanceof Date ? task.scheduledFor : new Date(task.scheduledFor),
          createdAt: task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt),
          updatedAt: task.updatedAt instanceof Date ? task.updatedAt : new Date(task.updatedAt),
          errorData: task.error ? { message: String(task.error) } : null,
          resultData: task.result ? (typeof task.result === 'string' ? JSON.parse(task.result) : task.result as Record<string, unknown>) : null,
          metadata: (task.metadata as Record<string, unknown>) || {}
        };
        
        return taskWithMetadata;
      });
    } catch (error) {
      console.error('Error loading tasks from database:', error);
      // Initialize with empty queue on error
      this.taskQueue = [];
    }



  }

  /**
   * Process the task queue
   */
  private async processQueue(): Promise<void> {
    if (!this.isRunning || this.taskQueue.length === 0 || this.currentTask) {
      // Schedule next run if the agent is still running
      if (this.isRunning) {
        setTimeout(() => this.processQueue(), 1000);
      }
      return;
    }

    // Sort queue by priority and scheduled time
    this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return (a.scheduledFor?.getTime() || 0) - (b.scheduledFor?.getTime() || 0); // Earlier scheduled time first
    });

    // Get the next task
    const task = this.taskQueue.shift();
    if (!task) {
      // Schedule next run
      if (this.isRunning) {
        setTimeout(() => this.processQueue(), 1000);
      }
      return;
    }

    // Set as current task and process
    this.currentTask = task;
    
    try {
      // Update task status to RUNNING
      await this.prisma.agentTask.update({
        where: { id: task.id },
        data: { status: AgentTaskStatus.RUNNING }
      });

      // Process the task
      await this.processTask(task);
      
      // Schedule next run
      if (this.isRunning) {
        setTimeout(() => this.processQueue(), 100);
      }
    } catch (error: unknown) {
      console.error(`Error processing task ${task.id}:`, error);
      // Schedule next run despite error
      if (this.isRunning) {
        setTimeout(() => this.processQueue(), 1000);
      }
    } finally {
      this.currentTask = null;
    }
  }

  /**
   * Process a single task
   */
  private async processTask(task: TaskWithMetadata): Promise<void> {
    try {
      // Get the appropriate processor
      const processor = this.taskProcessors[task.taskType];
      if (!processor) {
        throw new Error(`No processor found for task type: ${task.taskType}`);
      }

      // Process the task with type-safe data
      const result = await processor(task);

      // Safely serialize the result
      let serializedResult: string;
      try {
        serializedResult = JSON.stringify(result);
      } catch (serializeError: unknown) {
        // If result can't be serialized, convert to a safe format
        serializedResult = JSON.stringify({
          error: 'Result could not be serialized',
          message: String(serializeError)
        });
      }

      // Update task with result
      await this.prisma.agentTask.update({
        where: { id: task.id },
        data: {
          status: AgentTaskStatus.COMPLETED,
          result: serializedResult
        }
      });

      // Record success
      await this.recordSuccess(task.taskType);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Increment attempts and check if we should retry
      const attempts = task.attempts + 1;
      const shouldRetry = attempts < task.maxAttempts;
      const status = shouldRetry ? AgentTaskStatus.RETRYING : AgentTaskStatus.FAILED;

      try {
        // Update task with error
        await this.prisma.agentTask.update({
          where: { id: task.id },
          data: {
            status,
            attempts,
            error: errorMessage.substring(0, 1000) // Limit error message length
          }
        });
      } catch (dbError) {
        console.error(`Failed to update task ${task.id} with error status:`, dbError);
      }

      // If we should retry, add it back to the queue with exponential backoff
      if (shouldRetry) {
        // Calculate backoff time: 2^attempts * 1000ms (1s, 2s, 4s, 8s, ...)
        const backoffMs = Math.min(2 ** attempts * 1000, MAX_BACKOFF_MS);
        const scheduledFor = new Date(Date.now() + backoffMs);

        // Add task back to queue with updated scheduledFor time
        this.taskQueue.push({
          ...task,
          attempts,
          status: AgentTaskStatus.RETRYING,
          scheduledFor
        });
      }

      // Record failure
      await this.recordFailure(task.taskType, undefined, errorMessage);
    }
  }

  /**
   * Record a successful task for knowledge tracking
   */
  private async recordSuccess(taskType: string): Promise<void> {
    try {
      await this.prisma.agentKnowledge.upsert({
        where: {
          category_payerId: {
            category: taskType,
            payerId: 'GENERIC'
          }
        },
        update: {
          successCount: { increment: 1 },
          lastUpdated: new Date()
        },
        create: {
          category: taskType,
          payerId: 'GENERIC',
          pattern: {},
          successCount: 1,
          failureCount: 0,
          lastUpdated: new Date()
        }
      });
    } catch (error: unknown) {
      console.error('Error recording success:', error);
    }
  }

  /**
   * Record a failure for knowledge tracking
   */
  private async recordFailure(taskType: string, entityId?: string, errorMessage?: string): Promise<void> {
    try {
      await this.prisma.agentKnowledge.upsert({
        where: {
          category_payerId: {
            category: taskType,
            payerId: entityId || 'GENERIC'
          }
        },
        update: {
          failureCount: { increment: 1 },
          pattern: { lastError: errorMessage || 'Unknown error' },
          lastUpdated: new Date()
        },
        create: {
          category: taskType,
          payerId: entityId || 'GENERIC',
          pattern: { lastError: errorMessage || 'Unknown error' },
          successCount: 0,
          failureCount: 1,
          lastUpdated: new Date()
        }
      });
    } catch (error: unknown) {
      console.error('Error recording failure:', error);
    }
  }
}

/**
 * Get the singleton instance of the SimplifiedBillingAgent
 */
export function getBillingAgent(prisma: PrismaClient): SimplifiedBillingAgent {
  return SimplifiedBillingAgent.getInstance(prisma);
}
