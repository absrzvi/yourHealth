import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { PrismaClient, ClaimStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get authenticated session [SFT]
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get claims statistics for the current user
    const stats = await prisma.claim.groupBy({
      by: ['status'],
      where: {
        userId: session.user.id,
      },
      _count: {
        status: true,
      },
    });

    // Calculate total claims [SF]
    const total = stats.reduce((sum, item) => sum + item._count.status, 0);

    // Define ClaimStats interface with string index signature for safer typing [RP, SF]
    interface ClaimStats {
      total: number;
      draft: number;
      submitted: number;
      processing: number;
      approved: number;
      denied: 0;
      paid: number;
      [key: string]: number;  // Add index signature to allow string indexing
    }
    
    // Format the response to match the ClaimStats interface [RP]
    const result: ClaimStats = {
      total,
      draft: 0,
      submitted: 0,
      processing: 0,
      approved: 0,
      denied: 0,
      paid: 0,
    };

    // Map ClaimStatus enum values to result object keys [SF, RP]
    const statusMap: Record<ClaimStatus, keyof ClaimStats> = {
      DRAFT: 'draft',
      READY: 'processing',
      SUBMITTED: 'submitted',
      ACCEPTED: 'processing',
      REJECTED: 'denied',
      DENIED: 'denied',
      PARTIALLY_PAID: 'paid',
      PAID: 'paid',
      APPEALED: 'processing'
    };
    
    // Populate counts for each status using the mapping [SF]
    stats.forEach(item => {
      const statusKey = statusMap[item.status as ClaimStatus];
      if (statusKey) {
        result[statusKey] += item._count.status;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    // Robust error handling [REH]
    console.error('Error fetching claim statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim statistics', details: error },
      { status: 500 }
    );
  }
}
