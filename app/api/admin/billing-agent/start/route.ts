import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SimplifiedBillingAgent } from '@/lib/billing-agent/SimplifiedBillingAgent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/admin/billing-agent/start - Start the billing agent
export async function POST() {
  try {
    // Check for authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // NOTE: For production, this endpoint should be restricted to admin users only
    // for HIPAA compliance reasons. The role check has been removed for the MVP.

    try {
      // Get billing agent instance
      const billingAgent = SimplifiedBillingAgent.getInstance(prisma);
      
      // Start the agent if it's not already running
      // Start the agent if it's not already running
      if (!billingAgent.getRunningStatus()) {
        await billingAgent.start();
      }
      
      return NextResponse.json({ success: true, isRunning: true });
    } catch (agentError) {
      console.error('Error in billing agent start operation:', agentError);
      return NextResponse.json({ 
        error: agentError instanceof Error ? agentError.message : 'Failed to start billing agent',
        details: 'Check server logs for more information'
      }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to start billing agent';
    console.error('Error starting billing agent:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
