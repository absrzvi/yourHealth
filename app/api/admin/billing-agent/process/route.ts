import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SimplifiedBillingAgent } from '@/lib/billing-agent/SimplifiedBillingAgent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ExtendedUser } from '../types';

// POST /api/admin/billing-agent/process - Manually process the queue
export async function POST() {
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
    
    // Use the new triggerProcessQueue method which handles running check internally
    try {
      await billingAgent.triggerProcessQueue();
    } catch (error) {
      if (error instanceof Error && error.message === 'Cannot process queue when agent is not running') {
        return NextResponse.json({ error: 'Billing agent is not running' }, { status: 400 });
      }
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to process queue';
    console.error('Error processing queue:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
