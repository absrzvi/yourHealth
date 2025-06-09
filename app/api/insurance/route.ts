import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.insurancePlan.findMany({
      where: { userId: session.user.id },
      include: {
        user: true,
        claims: true,
        eligibilities: true,
      },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching insurance plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance plans', details: error },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Basic validation
    if (!data.payerName || !data.memberId) {
      return NextResponse.json(
        { error: 'Missing required fields: payerName and memberId are required' },
        { status: 400 }
      );
    }

    // Create a copy of data without non-existent fields
    const validData = { ...data };
    
    // Remove fields that don't exist in the schema
    delete validData.isActive;
    delete validData.isPrimary;
    
    const newPlan = await prisma.insurancePlan.create({
      data: {
        ...validData,
        userId: session.user.id,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : new Date(),
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      },
    });

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance plan:', error);
    return NextResponse.json(
      { error: 'Failed to create insurance plan', details: error },
      { status: 500 }
    );
  }
}