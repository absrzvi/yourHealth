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
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const metrics = await prisma.healthMetric.findMany({
      where: {
        user: { email: session.user.email },
        ...(type && { type }),
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health metrics' },
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
    if (!data.type || !data.name || !data.value || !data.date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const metric = await prisma.healthMetric.create({
      data: {
        ...data,
        userId: user.id,
        date: new Date(data.date),
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error('Error creating health metric:', error);
    return NextResponse.json(
      { error: 'Failed to create health metric' },
      { status: 500 }
    );
  }
}
