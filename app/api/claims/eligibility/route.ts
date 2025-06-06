import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import your eligibility checker logic here

export async function POST(req: NextRequest) {
  try {
    const { patientId, insurancePlanId, serviceCode, claimId } = await req.json();
    
    // Validate required fields
    if (!patientId || !insurancePlanId || !serviceCode) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: 'patientId, insurancePlanId, and serviceCode are required' 
      }, { status: 400 });
    }
    
    // Validate insurancePlanId exists
    const insurancePlan = await prisma.insurancePlan.findUnique({
      where: { id: insurancePlanId }
    });
    
    if (!insurancePlan) {
      return NextResponse.json({ 
        error: 'Invalid insurancePlanId',
        details: 'The specified insurance plan does not exist'
      }, { status: 404 });
    }
    
    // Simulate eligibility check result (replace with real logic)
    const result = {
      eligible: true,
      details: `Eligibility check successful for patient ${patientId}, plan ${insurancePlanId}, service ${serviceCode}`,
      checkedAt: new Date().toISOString(),
    };
    
    // Create an eligibility check record
    const eligibilityCheck = await prisma.eligibilityCheck.create({
      data: {
        status: result.eligible ? 'ELIGIBLE' : 'INELIGIBLE',
        responseData: result,
        checkedAt: new Date(),
        insurancePlan: {
          connect: { id: insurancePlanId }
        },
        // Only connect to claim if valid claimId is provided
        ...(claimId && claimId.trim().length > 0 ? {
          claim: { connect: { id: claimId } }
        } : {})
      }
    });
    
    // HIPAA-compliant event logging for eligibility check
    const claimEventData: any = {
      eventType: 'eligibility_checked',
      eventData: { ...result, patientId, insurancePlanId, serviceCode, eligibilityCheckId: eligibilityCheck.id },
    };
    
    // Connect to claim if valid claimId is provided
    if (typeof claimId === 'string' && claimId.trim().length > 0) {
      claimEventData.claim = { connect: { id: claimId } };
    }
    
    // Create the claim event for audit trail
    await prisma.claimEvent.create({ data: claimEventData });
    
    // Return successful result to client
    return NextResponse.json({ 
      eligible: result.eligible, 
      details: result.details,
      eligibilityCheckId: eligibilityCheck.id 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check eligibility', details: error }, { status: 500 });
  }
}