import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClaimInput, canTransition, ClaimStatus } from '@/lib/claims/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Get authenticated session properly
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get user ID from session
  const userId = session.user.id;
  try {
    // Find claim belonging to this user only - security check
    const claim = await prisma.claim.findFirst({
      where: { 
        id: params.id,
        user: {
          id: userId 
        }
      },
      include: {
        claimLines: true,
        claimEvents: true,
        insurancePlan: true,
        eligibilityCheck: true,
      },
    });
    
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found or you do not have permission to view it' }, { status: 404 });
    }
    // HIPAA-compliant event logging for claim view
    await prisma.claimEvent.create({
      data: {
        eventType: 'claim_viewed',
        eventData: { claimNumber: claim.claimNumber },
        claimId: claim.id,
      },
    });
    return NextResponse.json(claim);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch claim', details: error }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Parse the data from the request
    const data = await req.json();
    console.log('Update data received:', data);
    
    // Mark this as an update operation for validation
    const dataWithUpdateFlag = {
      ...data,
      isUpdate: true // Flag to indicate this is an update operation
    };
    
    // Validate the input data for update operation
    const errors = validateClaimInput(dataWithUpdateFlag);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    
    // Find the current claim and verify ownership
    const currentClaim = await prisma.claim.findFirst({ 
      where: { 
        id: params.id,
        user: {
          id: userId
        }
      } 
    });
    
    if (!currentClaim) {
      return NextResponse.json({ error: 'Claim not found or you do not have permission to modify it' }, { status: 404 });
    }
    
    // Verify the status transition is valid - allow keeping the same status during updates
    if (currentClaim.status !== data.status && !canTransition(currentClaim.status as ClaimStatus, data.status as ClaimStatus)) {
      console.log(`Invalid status transition attempted: ${currentClaim.status} -> ${data.status}`);
      return NextResponse.json({ error: 'Invalid status transition.' }, { status: 400 });
    }
    
    // Prepare update data
    const updateData: any = {
      claimNumber: data.claimNumber,
      totalCharge: parseFloat(data.totalCharge.toString()),
      status: data.status
    };
    
    // Add insurance plan connection if provided
    if (data.insurancePlanId) {
      // Verify the insurance plan belongs to this user
      const insurancePlan = await prisma.insurancePlan.findFirst({
        where: {
          id: data.insurancePlanId,
          userId: userId
        }
      });
      
      if (!insurancePlan) {
        return NextResponse.json({ 
          error: 'Insurance plan not found or does not belong to this user' 
        }, { status: 404 });
      }
      
      updateData.insurancePlan = {
        connect: { id: data.insurancePlanId }
      };
    }
    
    // Update the claim
    const updated = await prisma.claim.update({
      where: { id: params.id },
      data: updateData,
      include: {
        claimLines: true,
        claimEvents: true,
        insurancePlan: true,
        eligibilityCheck: true,
      },
    });

    // HIPAA-compliant event logging
    const events = [];
    if (currentClaim.status !== data.status) {
      events.push({
        eventType: 'status_change',
        eventData: { from: currentClaim.status, to: data.status },
        claimId: params.id,
      });
    }
    // Log field changes
    const changedFields: Record<string, { from: any; to: any }> = {};
    const currentClaimAny = currentClaim as any;
    for (const key of Object.keys(data)) {
      if (
        key !== 'status' &&
        Object.prototype.hasOwnProperty.call(currentClaimAny, key) &&
        (data[key] !== currentClaimAny[key])
      ) {
        changedFields[key] = { from: currentClaimAny[key], to: data[key] };
      }
    }
    if (Object.keys(changedFields).length > 0) {
      events.push({
        eventType: 'claim_updated',
        eventData: changedFields,
        claimId: params.id,
      });
    }
    // Write events
    if (events.length > 0) {
      await prisma.claimEvent.createMany({ data: events });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update claim', details: error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Find claim and verify ownership
    const claim = await prisma.claim.findFirst({
      where: {
        id: params.id,
        user: {
          id: userId
        }
      }
    });
    
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found or you do not have permission to delete it' }, { status: 404 });
    }
    
    // Delete the claim
    await prisma.claim.delete({ where: { id: params.id } });
    
    // HIPAA-compliant event logging for deletion
    await prisma.claimEvent.create({
      data: {
        eventType: 'claim_deleted',
        eventData: { claimNumber: claim.claimNumber },
        claimId: params.id,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting claim:', error);
    return NextResponse.json({ error: 'Failed to delete claim', details: error }, { status: 500 });
  }
} 