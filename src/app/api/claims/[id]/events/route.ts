import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';
import { ClaimsService } from '@/lib/claims';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const claimsService = new ClaimsService(prisma);
    
    // First verify the claim exists and user has access
    await claimsService.getClaimById(params.id, userId);
    
    // Get events for the claim
    const events = await prisma.claimEvent.findMany({
      where: { claimId: params.id },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(events);
  } catch (error: any) {
    console.error(`Error fetching events for claim ${params.id}:`, error);
    
    if (error.name === 'NotFoundError') {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }
    
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { eventType, notes, metadata } = await request.json();
    
    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    const claimsService = new ClaimsService(prisma);
    
    // Verify claim exists and user has access
    await claimsService.getClaimById(params.id, userId);
    
    // Add the event
    const event = await claimsService.addClaimEvent(
      params.id,
      {
        eventType,
        notes,
        metadata,
      },
      userId
    );
    
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error(`Error adding event to claim ${params.id}:`, error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }
    
    if (error.name === 'NotFoundError') {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }
    
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function HEAD() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
