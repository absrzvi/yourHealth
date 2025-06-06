import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClaimInput } from '@/lib/claims/validation';
import { ClaimStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;
    
    const url = new URL(req.url!);
    const status = req.nextUrl.searchParams.get("status");
    
    // Base where clause always includes the user ID for security
    let where: any = { userId };
    
    // Add status filter if provided
    if (status && Object.values(ClaimStatus).includes(status as ClaimStatus)) {
      where.status = status as ClaimStatus;
    }

    const claims = await prisma.claim.findMany({
      where,
      include: {
        claimLines: true,
        claimEvents: true,
        insurancePlan: true,
        eligibilityCheck: true,
      },
      orderBy: {
        createdAt: 'desc' // Most recent claims first
      }
    });
    return NextResponse.json(claims);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch claims', details: error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;
    
    const data = await req.json();
    // Defensive validation for required fields
    const requiredFields = ['claimNumber', 'totalCharge', 'status', 'insurancePlanId'];
    const missingFields = requiredFields.filter(f => !data[f]);
    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
    }
    
    // Validate that insurancePlanId is not empty string
    if (typeof data.insurancePlanId !== 'string' || !data.insurancePlanId.trim()) {
      return NextResponse.json({ error: `Invalid insurancePlanId: must be a non-empty string` }, { status: 400 });
    }
    // Validate status is a valid ClaimStatus
    if (!Object.values(ClaimStatus).includes(data.status)) {
      return NextResponse.json({ error: `Invalid status value: ${data.status}` }, { status: 400 });
    }
    
    // Verify the insurance plan belongs to the authenticated user
    try {
      const insurancePlan = await prisma.insurancePlan.findFirst({
        where: {
          id: data.insurancePlanId,
          userId: userId
        }
      });
      
      if (!insurancePlan) {
        return NextResponse.json({ error: 'Insurance plan not found or does not belong to this user' }, { status: 404 });
      }
    } catch (verifyError) {
      console.error('Error verifying insurance plan:', verifyError);
      return NextResponse.json({ error: 'Failed to verify insurance plan', details: verifyError }, { status: 500 });
    }
    
    // Build data object with proper relations
    const claimData: any = {
      user: {
        connect: {
          id: userId
        }
      },
      claimNumber: data.claimNumber,
      totalCharge: data.totalCharge,
      status: data.status,
      insurancePlan: {
        connect: {
          id: data.insurancePlanId
        }
      },
    };
    
    // Optional fields
    if (data.claimLines && Array.isArray(data.claimLines) && data.claimLines.length > 0) {
      claimData.claimLines = { create: data.claimLines };
    }
    if (data.reportId) claimData.reportId = data.reportId;
    
    // Log the data we're about to use for claim creation (sensitive data redacted for logs)
    console.log('Creating claim with data:', {
      userId: userId,
      hasInsurancePlanConnect: !!claimData.insurancePlan,
      claimNumber: claimData.claimNumber,
      status: claimData.status,
      totalCharge: claimData.totalCharge
    });
    
    let claim;
    try {
      claim = await prisma.claim.create({
        data: claimData,
        include: {
          claimLines: true,
          claimEvents: true,
          insurancePlan: true,
          eligibilityCheck: true,
        },
      });
      
      // HIPAA-compliant event logging for claim creation
      await prisma.claimEvent.create({
        data: {
          eventType: 'claim_created',
          eventData: { claimNumber: claim.claimNumber },
          claimId: claim.id,
        },
      });
    } catch (createError: any) {
      console.error('Error creating claim:', createError);
      
      // Check for specific database errors
      if (createError.code) {
        // Handle specific Prisma error codes
        if (createError.code === 'P2025') {
          return NextResponse.json({ error: 'Record not found - likely the insurance plan does not exist' }, { status: 404 });
        } else if (createError.code === 'P2003') {
          return NextResponse.json({ error: 'Foreign key constraint failed - check that the insurance plan ID is valid' }, { status: 400 });
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to create claim', 
        details: createError.message || 'Unknown database error' 
      }, { status: 500 });
    }
    return NextResponse.json(claim);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create claim', details: error }, { status: 500 });
  }
} 