import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    const { claimId, fileName } = await req.json();
    if (!claimId || !fileName) {
      return new NextResponse('Missing claimId or fileName', { status: 400 });
    }
    await prisma.claimEvent.create({
      data: {
        eventType: 'edi_downloaded',
        eventData: { fileName },
        claim: { connect: { id: claimId } },
      },
    });
    return new NextResponse('Logged', { status: 200 });
  } catch (error) {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
