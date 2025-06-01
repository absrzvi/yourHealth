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
    const sampleType = searchParams.get('sampleType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const samples = await prisma.microbiomeSample.findMany({
      where: {
        user: { email: session.user.email },
        ...(sampleType && { sampleType }),
        ...(startDate && { sampleDate: { gte: new Date(startDate) } }),
        ...(endDate && { sampleDate: { lte: new Date(endDate) } }),
      },
      include: {
        organisms: {
          orderBy: { relativeAbundance: 'desc' },
          take: 10, // Only get top 10 most abundant organisms
        },
      },
      orderBy: { sampleDate: 'desc' },
    });

    return NextResponse.json(samples);
  } catch (error) {
    console.error('Error fetching microbiome samples:', error);
    return NextResponse.json(
      { error: 'Failed to fetch microbiome samples' },
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
    if (!data.sampleDate || !data.sampleType || !data.organisms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // Create the sample
      const sample = await prisma.microbiomeSample.create({
        data: {
          userId: user.id,
          sampleDate: new Date(data.sampleDate),
          sampleType: data.sampleType,
          diversityScore: data.diversityScore,
        },
      });

      // Create associated organisms
      const organisms = await Promise.all(
        data.organisms.map((org: any) =>
          prisma.microbiomeOrganism.create({
            data: {
              sampleId: sample.id,
              name: org.name,
              taxaLevel: org.taxaLevel || 'species',
              abundance: org.abundance,
              relativeAbundance: org.relativeAbundance,
            },
          })
        )
      );

      return { ...sample, organisms };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating microbiome sample:', error);
    return NextResponse.json(
      { error: 'Failed to create microbiome sample' },
      { status: 500 }
    );
  }
}
