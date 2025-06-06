import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const line = await prisma.claimLine.create({
      data: {
        ...data,
        claimId: params.id,
      },
    });
    // HIPAA-compliant event logging for claim line addition
    await prisma.claimEvent.create({
      data: {
        eventType: 'line_added',
        eventData: { ...line },
        claimId: params.id,
      },
    });
    return NextResponse.json(line);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add claim line', details: error }, { status: 500 });
  }
} 