import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user first to get the user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [
      // Get latest health metrics by type
      latestMetrics,
      // Count of DNA sequences
      dnaCount,
      // Latest microbiome samples with organisms
      microbiomeSamples,
      // Latest weekly insight
      latestInsight,
    ] = await Promise.all([
      // Get the latest health metric for each type
      prisma.healthMetric.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        distinct: ['type'],
      }),
      
      // Count DNA sequences
      prisma.dNASequence.count({
        where: { userId: user.id },
      }),
      
      // Get latest microbiome samples with their organisms
      prisma.microbiomeSample.findMany({
        where: { userId: user.id },
        orderBy: { sampleDate: 'desc' },
        take: 3, // Limit to 3 most recent samples
        include: {
          organisms: {
            orderBy: { relativeAbundance: 'desc' },
            take: 3, // Limit to 3 most abundant organisms per sample
          },
        },
      }),
      
      // Get the latest weekly insight
      prisma.weeklyInsight.findFirst({
        where: { userId: user.id },
        orderBy: { generatedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      metrics: latestMetrics,
      dnaSequences: { count: dnaCount },
      microbiomeSamples,
      latestInsight,
    });
  } catch (error) {
    console.error('Error fetching health summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health summary' },
      { status: 500 }
    );
  }
}
