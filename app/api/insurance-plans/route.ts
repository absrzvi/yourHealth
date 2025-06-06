import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    // Fetch insurance plans for the user
    const insurancePlans = await prisma.insurancePlan.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      orderBy: {
        isPrimary: 'desc' // Primary plans first
      }
    });

    return NextResponse.json(insurancePlans);
  } catch (error) {
    console.error('Error fetching insurance plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance plans' }, 
      { status: 500 }
    );
  }
}
