import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { PrismaClient, ClaimStatus, Prisma } from '@prisma/client';
import { EnhancedClaimsProcessor } from '../../../../lib/claims/processor/enhanced-processor';

const prisma = new PrismaClient();

/**
 * API endpoint for testing the enhanced claims processor
 * This is a development-only endpoint and should be disabled in production
 */
export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, claimId, userId, insurancePlanId } = await req.json();
    const processor = new EnhancedClaimsProcessor();
    let result;

    switch (action) {
      case 'processClaim':
        if (!claimId) {
          return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 });
        }
        await processor.processClaim(claimId);
        result = { success: true, message: 'Claim processed successfully' };
        break;

      case 'analyzeDenialRisk':
        if (!claimId) {
          return NextResponse.json({ error: 'Claim ID is required' }, { status: 400 });
        }
        // Use the stage 4 method for denial risk analysis
        const stage4Result = await processor.processStage4(claimId);
        result = {
          riskScore: stage4Result.riskScore,
          confidence: stage4Result.confidence,
          riskFactors: stage4Result.riskFactors,
          recommendations: stage4Result.recommendations
        };
        break;

      case 'checkEligibility':
        if (!insurancePlanId) {
          return NextResponse.json({ error: 'Insurance plan ID is required' }, { status: 400 });
        }
        // Use the stage 1 method for eligibility check
        const stage1Result = await processor.processStage1(claimId || '');
        result = {
          eligibility: stage1Result.eligibility,
          priorAuthRequired: stage1Result.priorAuthRequired,
          priorAuthStatus: stage1Result.priorAuthStatus
        };
        break;

      case 'optimizeRevenue':
        if (!userId) {
          return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }
        // Use the stage 8 method for revenue optimization
        const stage8Result = await processor.processStage8(claimId || '');
        result = {
          analysis: stage8Result.analysis,
          optimization: stage8Result.optimization,
          forecast: stage8Result.forecast
        };
        break;

      case 'createTestClaim':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });

        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Use provided insurance plan ID or get/create a default one
        const planIdToUse = insurancePlanId || await getDefaultInsurancePlan(userId);
        
        // Generate a unique claim number
        const claimNumber = `TEST-${Date.now()}`;
        
        try {
          // Verify user exists with all required fields
          const userRecord = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true }
          });

          if (!userRecord) {
            throw new Error(`User with ID ${userId} not found in database`);
          }

          
          // Try to find the specified insurance plan
          let insurancePlan = await prisma.insurancePlan.findUnique({
            where: { id: planIdToUse },
            select: { id: true, userId: true }
          });

          // If plan doesn't exist, create a default one
          if (!insurancePlan) {
            console.log(`Insurance plan ${planIdToUse} not found, creating default plan...`);
            
            try {
              insurancePlan = await prisma.insurancePlan.create({
                data: {
                  id: planIdToUse,
                  userId: userId,
                  payerName: planIdToUse.startsWith('BCBS') ? 'Blue Cross Blue Shield' : 
                              planIdToUse.startsWith('AETNA') ? 'Aetna' : 'Test Insurance',
                  payerId: planIdToUse,
                  memberId: `MEM-${Date.now().toString().slice(-6)}`,
                  planType: 'COMMERCIAL',
                  isPrimary: true,
                  isActive: true,
                  effectiveDate: new Date(),
                  groupNumber: 'GRP12345'
                },
                select: { id: true, userId: true }
              });
              console.log(`Created default insurance plan: ${insurancePlan.id}`);
            } catch (createError) {
              console.error('Error creating default insurance plan:', createError);
              throw new Error(`Failed to create default insurance plan: ${(createError as Error).message}`);
            }
          }
          
          // Verify the plan belongs to the user
          if (insurancePlan.userId !== userId) {
            throw new Error(`Insurance plan ${planIdToUse} does not belong to user ${userId}`);
          }

          console.log('Creating test claim with:', {
            userId,
            userName: userRecord.name,
            userEmail: userRecord.email,
            insurancePlanId: planIdToUse,
            claimNumber,
            timestamp: new Date().toISOString()
          });

          // Create claim data with all required fields - properly connect to relations
          const claimData = {
            user: {
              connect: { id: userId }
            },
            insurancePlan: {
              connect: { id: planIdToUse }
            },
            claimNumber: claimNumber,
            status: ClaimStatus.DRAFT,
            totalCharge: 125.00,
            claimLines: {
              create: [
                {
                  lineNumber: 1,
                  description: 'Comprehensive Metabolic Panel',
                  cptCode: '80053',
                  serviceDate: new Date(),
                  charge: 125.00,
                  units: 1,
                  icd10Codes: ['E78.5'] as unknown as Prisma.InputJsonValue
                }
              ]
            }
          };


          console.log('Claim data prepared:', JSON.stringify(claimData, null, 2));

          // Create the test claim
          const testClaim = await prisma.claim.create({
            data: claimData,
            include: {
              claimLines: true,
              insurancePlan: true
            }
          });
          
          console.log('Successfully created test claim:', {
            claimId: testClaim.id,
            claimNumber: testClaim.claimNumber,
            status: testClaim.status,
            insurancePlanId: testClaim.insurancePlanId,
            claimLinesCount: testClaim.claimLines?.length || 0
          });
          
          result = testClaim;
        } catch (error) {
          console.error('Error creating test claim:', {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error,
            prismaError: (error as any).code,
            meta: (error as any).meta,
            userId,
            insurancePlanId: planIdToUse
          });
          throw new Error(`Failed to create test claim: ${(error as Error).message}`);
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Claims test API error:', error);
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        ...(error as any).cause && { cause: (error as any).cause }
      });
    }

    // Return a more detailed error response
    const errorResponse: any = {
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    // Add Prisma error details if available
    if (error instanceof Error && 'code' in error) {
      errorResponse.code = (error as any).code;
      errorResponse.meta = (error as any).meta;
    }

    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}

/**
 * Get default insurance plan ID for a user
 * Falls back to creating a test plan if none exists
 */
async function getDefaultInsurancePlan(userId: string): Promise<string> {
  try {
    // Verify user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Try to find an existing plan
    const existingPlan = await prisma.insurancePlan.findFirst({
      where: { userId },
      select: { id: true }
    });

    if (existingPlan) {
      return existingPlan.id;
    }

    // Create a test plan if none exists with all required fields
    const newPlan = await prisma.insurancePlan.create({
      data: {
        userId,
        payerName: 'Test Insurance Co.',
        payerId: 'TEST123',
        memberId: `MEM-${Date.now().toString().slice(-6)}`,
        planName: 'Standard Plan',
        relationToInsured: 'self',
        effectiveDate: new Date(),
        groupNumber: 'GRP12345',
      },
      select: { id: true }
    });

    if (!newPlan || !newPlan.id) {
      throw new Error('Failed to create new insurance plan');
    }

    return newPlan.id;
  } catch (error) {
    console.error('Error in getDefaultInsurancePlan:', error);
    throw new Error(`Failed to get or create insurance plan: ${(error as Error).message}`);
  }
}

