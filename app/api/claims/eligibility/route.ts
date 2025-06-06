import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { EligibilityChecker } from '../../../../lib/claims/eligibility/checker';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const prisma = new PrismaClient();
// Status is a string in the model, not an enum

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Extract request data
    const { insurancePlanId, serviceDate, forceRefresh = false, serviceCode, claimId } = await req.json();
    
    // Validate required fields
    if (!insurancePlanId) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'insurancePlanId is required' 
      }, { status: 400 });
    }
    
    // Validate insurancePlanId exists and belongs to the user
    const insurancePlan = await prisma.insurancePlan.findFirst({
      where: { 
        id: insurancePlanId,
        userId: session.user.id 
      }
    });
    
    if (!insurancePlan) {
      return NextResponse.json({ 
        error: 'Invalid insurancePlanId',
        details: 'The specified insurance plan does not exist or does not belong to this user'
      }, { status: 404 });
    }
    
    // Initialize eligibility checker
    const eligibilityChecker = new EligibilityChecker({
      prisma,
      cacheType: 'memory',
      cacheOptions: { ttl: 3600 } // 1 hour TTL
    });
    
    // Parse service date if provided
    let parsedServiceDate: Date | undefined;
    if (serviceDate) {
      parsedServiceDate = new Date(serviceDate);
      if (isNaN(parsedServiceDate.getTime())) {
        return NextResponse.json({
          error: 'Invalid serviceDate',
          details: 'The serviceDate must be a valid date'
        }, { status: 400 });
      }
    }
    
    // Perform eligibility check
    const eligibilityResult = await eligibilityChecker.checkEligibility(
      insurancePlan.memberId,
      {
        forceRefresh,
        serviceDate: parsedServiceDate,
        context: { serviceCode }
      }
    );
    
    // Create an eligibility check record
    const eligibilityCheck = await prisma.eligibilityCheck.create({
      data: {
        status: eligibilityResult.isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
        responseData: eligibilityResult as unknown as Prisma.InputJsonValue,
        checkedAt: new Date(),
        insurancePlan: {
          connect: { id: insurancePlanId }
        },
        // Only connect to claim if valid claimId is provided
        ...(claimId && typeof claimId === 'string' && claimId.trim().length > 0 ? {
          claim: { connect: { id: claimId } }
        } : {})
      }
    });
    
    // HIPAA-compliant event logging for eligibility check
    // Only create claim event if we have a valid claimId
    if (typeof claimId === 'string' && claimId.trim().length > 0) {
      // Create the claim event for audit trail with connected claim
      await prisma.claimEvent.create({ 
        data: {
          eventType: 'eligibility_checked',
          eventData: { 
            eligibilityCheckId: eligibilityCheck.id,
            isEligible: eligibilityResult.isEligible,
            serviceDate: parsedServiceDate?.toISOString() || new Date().toISOString(),
            serviceCode
          },
          claim: { 
            connect: { id: claimId } 
          }
        }
      });
    } else {
      console.log('Skipping claim event creation - no valid claimId provided');
    }
    
    // Return eligibility result to client
    return NextResponse.json({
      isEligible: eligibilityResult.isEligible,
      coverage: eligibilityResult.coverage,
      plan: eligibilityResult.plan,
      eligibilityCheckId: eligibilityCheck.id,
      error: eligibilityResult.error,
      checkedAt: eligibilityCheck.checkedAt
    });
  } catch (error) {
    console.error('Eligibility check failed:', error);
    return NextResponse.json({ 
      error: 'Failed to check eligibility', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}