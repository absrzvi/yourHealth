import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rsid = searchParams.get('rsid');
    const chromosome = searchParams.get('chromosome');

    const sequences = await prisma.dNASequence.findMany({
      where: {
        user: { email: session.user.email },
        ...(rsid && { rsid }),
        ...(chromosome && { chromosome }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sequences);
  } catch (error) {
    console.error('Error fetching DNA sequences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DNA sequences' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.rsid || !data.chromosome || !data.position || !data.genotype) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if this rsid already exists for the user
    const existingSequence = await prisma.dNASequence.findFirst({
      where: {
        userId: user.id,
        rsid: data.rsid,
      },
    });

    if (existingSequence) {
      return NextResponse.json(
        { error: 'DNA sequence with this rsid already exists' },
        { status: 409 }
      );
    }

    const sequence = await prisma.dNASequence.create({
      data: {
        ...data,
        userId: user.id,
        position: parseInt(data.position, 10),
      },
    });

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    console.error('Error creating DNA sequence:', error);
    return NextResponse.json(
      { error: 'Failed to create DNA sequence' },
      { status: 500 }
    );
  }
}
