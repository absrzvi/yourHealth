import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClaimInput, canTransition, ClaimStatus } from '@/lib/claims/validation';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
      include: {
        claimLines: true,
        claimEvents: true,
        insurancePlan: true,
        eligibilityCheck: true,
      },
    });
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
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
    const data = await req.json();
    const errors = validateClaimInput(data);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }
    const currentClaim = await prisma.claim.findUnique({ where: { id: params.id } });
    if (!currentClaim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }
    if (!canTransition(currentClaim.status as ClaimStatus, data.status as ClaimStatus)) {
      return NextResponse.json({ error: 'Invalid status transition.' }, { status: 400 });
    }
    const updated = await prisma.claim.update({
      where: { id: params.id },
      data: {
        claimNumber: data.claimNumber,
        totalCharge: data.totalCharge,
        status: data.status,
        // Add other fields as needed
      },
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
    const claim = await prisma.claim.findUnique({ where: { id: params.id } });
    await prisma.claim.delete({ where: { id: params.id } });
    // HIPAA-compliant event logging for deletion
    await prisma.claimEvent.create({
      data: {
        eventType: 'claim_deleted',
        eventData: { claimNumber: claim?.claimNumber },
        claimId: params.id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete claim', details: error }, { status: 500 });
  }
} 