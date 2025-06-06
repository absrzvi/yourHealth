import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';
import { ClaimsService } from '@/lib/claims';

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

    const claimsService = new ClaimsService(prisma);
    const claim = await claimsService.getClaimById(params.id, userId);

    // Additional validation before submission can go here
    // For example, check if claim is in a submittable state
    
    // Update claim status to SUBMITTED
    const updatedClaim = await claimsService.updateClaim(
      params.id,
      { status: 'SUBMITTED', submissionDate: new Date() },
      userId,
      {
        eventType: 'CLAIM_SUBMITTED',
        notes: 'Claim was submitted for processing',
      }
    );

    // Here you would typically integrate with a clearinghouse or payer API
    // For now, we'll just update the status to PENDING
    // In a real implementation, this would be an async process
    
    return NextResponse.json({
      success: true,
      message: 'Claim submitted successfully',
      claim: updatedClaim,
    });
  } catch (error: any) {
    console.error(`Error submitting claim ${params.id}:`, error);
    
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
      { error: 'Failed to submit claim', details: error.message },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
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
