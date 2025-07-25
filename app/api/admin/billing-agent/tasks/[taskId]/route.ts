import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SimplifiedBillingAgent } from '@/lib/billing-agent/SimplifiedBillingAgent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExtendedPrismaClient } from '../../types';

// GET /api/admin/billing-agent/tasks/[taskId] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as ExtendedUser).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { taskId } = params;
    
    // Get task from database
    const task = await (prisma as unknown as ExtendedPrismaClient).agentTask.findUnique({
      where: { id: taskId }
    });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch task';
    console.error(`Error fetching task ${params.taskId}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/admin/billing-agent/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as ExtendedUser).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { taskId } = params;
    
    // Get billing agent instance and use the new deleteTask method
    const billingAgent = SimplifiedBillingAgent.getInstance(prisma);
    await billingAgent.deleteTask(taskId);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
    console.error(`Error deleting task ${params.taskId}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
