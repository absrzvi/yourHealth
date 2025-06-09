import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClaimInput, ClaimLineInput } from '@/lib/claims/validation';
import { ClaimStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Helper function to get a specific claim by ID
 * Ensures the claim belongs to the requesting user
 */
async function getClaimById(claimId: string, userId: string) {
  try {
    const claim = await prisma.claim.findFirst({
      where: {
        id: claimId,
        userId: userId // Security check: ensure claim belongs to user
      },
      include: {
        claimLines: {
          orderBy: {
            lineNumber: 'asc'
          }
        },
        claimEvents: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        insurancePlan: true,
        eligibilityCheck: true,
        report: {
          select: {
            id: true,
            type: true,
            fileName: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }
    
    logger.info(`Retrieved claim ${claimId} for user ${userId}`);
    return NextResponse.json(claim);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error retrieving claim: ${errorMessage}`);
    return NextResponse.json({ error: 'Failed to retrieve claim', details: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;
    
    // Check if a specific claim ID is requested
    const claimId = req.nextUrl.searchParams.get("id");
    if (claimId) {
      return await getClaimById(claimId, userId);
    }
    
    const status = req.nextUrl.searchParams.get("status");
    
    // Base where clause always includes the user ID for security
    const where: Record<string, unknown> = { userId };
    
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching claims: ${errorMessage}`);
    return NextResponse.json({ error: 'Failed to fetch claims', details: errorMessage }, { status: 500 });
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
    
    // Add userId to the data for validation
    data.userId = userId;
    
    // Perform comprehensive validation using the enhanced validation function
    const validationErrors = validateClaimInput(data);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 });
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
      const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
      logger.error(`Error verifying insurance plan: ${errorMessage}`);
      return NextResponse.json({ error: 'Failed to verify insurance plan', details: errorMessage }, { status: 500 });
    }
    
    // Process claim lines if they exist
    let claimLines;
    if (data.claimLines && Array.isArray(data.claimLines) && data.claimLines.length > 0) {
      // Ensure each claim line has a line number
      claimLines = data.claimLines.map((line: ClaimLineInput, index: number) => ({
        ...line,
        lineNumber: line.lineNumber || index + 1,
        // Ensure service date is properly formatted
        serviceDate: line.serviceDate ? new Date(line.serviceDate) : new Date()
      }));
    }
    
    // Define the claim data with proper typing to satisfy TypeScript
    // Using Prisma's expected structure for claim creation
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
    
    // Add claim lines if they exist
    if (claimLines && claimLines.length > 0) {
      claimData.claimLines = { create: claimLines };
    }
    
    // Add optional fields
    if (data.reportId) claimData.reportId = data.reportId;
    if (data.patientId) claimData.patientId = data.patientId;
    if (data.providerNpi) claimData.providerNpi = data.providerNpi;
    if (data.billingProviderNpi) claimData.billingProviderNpi = data.billingProviderNpi;
    if (data.diagnosisCodes) claimData.diagnosisCodes = data.diagnosisCodes;
    if (data.submissionDate) claimData.submissionDate = new Date(data.submissionDate);
    
    // Log the data we're about to use for claim creation (sensitive data redacted for logs)
    logger.info('Creating claim', {
      userId,
      claimNumber: data.claimNumber,
      status: data.status,
      totalCharge: data.totalCharge,
      claimLinesCount: claimLines?.length || 0
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
          eventData: { 
            claimNumber: claim.claimNumber,
            source: 'api',
            timestamp: new Date().toISOString()
          },
          claimId: claim.id,
        },
      });
      
      logger.info(`Claim created successfully: ${claim.claimNumber}`);
    } catch (createError) {
      const error = createError as { code?: string; message?: string };
      const errorMessage = error.message || 'Unknown database error';
      logger.error(`Error creating claim: ${errorMessage}`, { code: error.code });
      
      // Check for specific database errors
      if (error.code) {
        // Handle specific Prisma error codes
        if (error.code === 'P2025') {
          return NextResponse.json({ error: 'Record not found - likely the insurance plan does not exist' }, { status: 404 });
        } else if (error.code === 'P2003') {
          return NextResponse.json({ error: 'Foreign key constraint failed - check that the insurance plan ID is valid' }, { status: 400 });
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to create claim', 
        details: errorMessage
      }, { status: 500 });
    }
    
    return NextResponse.json(claim);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Unexpected error in claims POST: ${errorMessage}`);
    return NextResponse.json({ error: 'Failed to create claim', details: errorMessage }, { status: 500 });
  }
} 
