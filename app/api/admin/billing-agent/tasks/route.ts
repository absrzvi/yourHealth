import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SimplifiedBillingAgent } from '@/lib/billing-agent/SimplifiedBillingAgent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExtendedUser, ExtendedPrismaClient } from '../types';

// GET /api/admin/billing-agent/tasks - Get all tasks with optional status filter
export async function GET(request: NextRequest) {
  try {
    // Check for authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // NOTE: For production, this endpoint should be restricted to admin users only
    // for HIPAA compliance reasons. The role check has been removed for the MVP.

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    // Build query
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }
    
    // Get tasks from database
    const tasks = await (prisma as unknown as ExtendedPrismaClient).agentTask.findMany({
      where: query,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return NextResponse.json(tasks);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/admin/billing-agent/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    // Check for authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // NOTE: For production, this endpoint should be restricted to admin users only
    // for HIPAA compliance reasons. The role check has been removed for the MVP.

    // Parse request body
    const body = await request.json();
    const { taskType, entityId, entityType, priority } = body;
    
    // Validate required fields
    if (!taskType || !entityId || !entityType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get billing agent instance
    const billingAgent = SimplifiedBillingAgent.getInstance(prisma);
    
    // Create task
    const task = await billingAgent.createTask({
      taskType,
      entityId,
      entityType,
      priority: priority || 1
    });
    
    return NextResponse.json(task);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
    console.error('Error creating task:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
