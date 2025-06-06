import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';
import { ClaimsService } from '@/lib/claims';
import { UpdateClaimInput } from '@/lib/claims/types/claims.types';

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
    const claim = await claimsService.getClaimById(params.id, userId);
    
    return NextResponse.json(claim);
  } catch (error: any) {
    console.error(`Error fetching claim ${params.id}:`, error);
    
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

export async function PATCH(
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

    const body: UpdateClaimInput = await request.json();
    const claimsService = new ClaimsService(prisma);
    
    const updatedClaim = await claimsService.updateClaim(
      params.id,
      body,
      userId,
      {
        eventType: 'CLAIM_UPDATED',
        notes: 'Claim was updated',
        metadata: body,
      }
    );
    
    return NextResponse.json(updatedClaim);
  } catch (error: any) {
    console.error(`Error updating claim ${params.id}:`, error);
    
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

export async function DELETE(
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
    const deletedClaim = await claimsService.deleteClaim(params.id, userId);
    
    return NextResponse.json({
      success: true,
      message: 'Claim cancelled successfully',
      claim: deletedClaim,
    });
  } catch (error: any) {
    console.error(`Error cancelling claim ${params.id}:`, error);
    
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
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
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
