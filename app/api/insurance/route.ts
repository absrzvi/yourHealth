import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.insurancePlan.findMany({
      include: {
        user: true,
        claims: true,
        eligibilities: true,
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch insurance plans', details: error }, { status: 500 });
  }
} 