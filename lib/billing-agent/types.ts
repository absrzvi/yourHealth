// Enums that match the Prisma schema
export enum AgentTaskStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING'
}

// Interface definitions for agent-related types

export interface AgentStatus {
  isRunning: boolean;
  queueLength: number;
  taskStats: {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    retrying: number;
  };
  knowledgeStats: {
    totalPatterns: number;
    successRate: number;
  };
}

export interface TaskWithMetadata {
  // Task data with metadata for processing
  id: string;
  taskType: TaskType;
  data: Record<string, unknown>;
  status: AgentTaskStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  scheduledFor?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  errorData?: Record<string, unknown> | null;
  resultData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null; // Will be properly typed based on task type
}

export interface KnowledgePattern {
  // Pattern data for knowledge tracking
  id: string;
  taskType: TaskType;
  payerId?: string | null;
  patternType: 'SUCCESS' | 'FAILURE';
  data: Record<string, unknown>;
  occurrences: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TaskProcessor = (task: TaskWithMetadata) => Promise<any>;

export type TaskType = 
  | 'CREATE_CLAIM'
  | 'CHECK_ELIGIBILITY'
  | 'GENERATE_EDI'
  | 'SUBMIT_CLAIM'
  | 'CHECK_STATUS'
  | 'FILE_APPEAL';
