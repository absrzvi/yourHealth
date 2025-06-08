import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SimplifiedBillingAgent } from '@/lib/billing-agent/SimplifiedBillingAgent';
import { AgentTaskStatus } from '@/lib/billing-agent/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExtendedPrismaClient } from '../types';

// GET /api/admin/billing-agent/status - Get agent status
export async function GET() {
  try {
    // Check for authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // NOTE: For production, this endpoint should be restricted to admin users only
    // for HIPAA compliance reasons. The role check has been removed for the MVP.

    // Get billing agent instance
    const billingAgent = SimplifiedBillingAgent.getInstance(prisma);
    
    // Get task counts from database
    const [
      pendingTasks,
      runningTasks,
      completedTasks,
      failedTasks
    ] = await Promise.all([
      (prisma as unknown as ExtendedPrismaClient).agentTask.count({ where: { status: AgentTaskStatus.PENDING } }),
      (prisma as unknown as ExtendedPrismaClient).agentTask.count({ where: { status: AgentTaskStatus.RUNNING } }),
      (prisma as unknown as ExtendedPrismaClient).agentTask.count({ where: { status: AgentTaskStatus.COMPLETED } }),
      (prisma as unknown as ExtendedPrismaClient).agentTask.count({ where: { status: AgentTaskStatus.FAILED } })
    ]);
    
    // Calculate success rate
    const totalProcessedTasks = completedTasks + failedTasks;
    const successRate = totalProcessedTasks > 0 
      ? (completedTasks / totalProcessedTasks) * 100 
      : null;
    
    // Get average processing time (mock data for now)
    // In a real implementation, you would calculate this from task history
    // Set to null if no tasks have been processed yet
    const averageProcessingTime = completedTasks > 0 ? 1500 : null; // 1.5 seconds when available
    
    return NextResponse.json({
      isRunning: billingAgent.getRunningStatus(),
      queueSize: billingAgent.getQueueSize(),
      pendingTasks,
      runningTasks,
      completedTasks,
      failedTasks,
      successRate,
      averageProcessingTime
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch agent status';
    console.error('Error fetching agent status:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
