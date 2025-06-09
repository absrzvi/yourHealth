import { PrismaClient } from '@prisma/client';

// Define extended user type with role
export interface ExtendedUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
}

// Define AgentTask type
export interface AgentTask {
  id: string;
  taskType: string;
  entityId: string;
  entityType: string;
  status: string;
  priority: number;
  result?: string | null;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

// Define query types
export type AgentTaskWhereInput = {
  id?: string;
  status?: string;
  taskType?: string;
  entityId?: string;
  entityType?: string;
};

export type AgentTaskOrderByInput = {
  priority?: 'asc' | 'desc';
  createdAt?: 'asc' | 'desc';
};

// Define extended prisma client type
export interface ExtendedPrismaClient extends PrismaClient {
  agentTask: {
    findMany: (args?: {
      where?: AgentTaskWhereInput;
      orderBy?: AgentTaskOrderByInput[] | AgentTaskOrderByInput;
      skip?: number;
      take?: number;
    }) => Promise<AgentTask[]>;
    findUnique: (args: { where: { id: string } }) => Promise<AgentTask | null>;
    count: (args?: { where?: AgentTaskWhereInput }) => Promise<number>;
    update: (args: { where: { id: string }; data: Partial<AgentTask> }) => Promise<AgentTask>;
    create: (args: { data: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt'> }) => Promise<AgentTask>;
  };
}
