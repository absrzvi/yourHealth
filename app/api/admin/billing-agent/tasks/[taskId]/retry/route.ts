import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SimplifiedBillingAgent } from '@/lib/billing-agent/SimplifiedBillingAgent';
import { AgentTaskStatus } from '@/lib/billing-agent/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExtendedPrismaClient } from '../../../types';

// POST /api/admin/billing-agent/tasks/[taskId]/retry - Retry a failed task
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Check for authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // NOTE: For production, this endpoint should be restricted to admin users only
    // for HIPAA compliance reasons. The role check has been removed for the MVP.

    const { taskId } = params;
    
    // Get task from database
    const task = await (prisma as unknown as ExtendedPrismaClient).agentTask.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Only failed tasks can be retried
    if (task.status !== AgentTaskStatus.FAILED) {
      return NextResponse.json({ error: 'Only failed tasks can be retried' }, { status: 400 });
    }
    
    // Get billing agent instance
    const billingAgent = SimplifiedBillingAgent.getInstance(prisma);
    
    // Use the new retryTask method
    const updatedTask = await billingAgent.retryTask(taskId);
    
    return NextResponse.json(updatedTask);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to retry task';
    console.error(`Error retrying task ${params.taskId}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
