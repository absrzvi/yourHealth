import { PrismaClient, ClaimStatus } from '@prisma/client';
import { TaskWithMetadata } from './types';

// Mock implementations for missing modules
const generateEdi = async (claimData: any) => {
  return { ediContent: 'MOCK_EDI_CONTENT' };
};

const checkEligibility = async (eligibilityData: any) => {
  return { 
    isEligible: true, 
    details: 'MOCK_ELIGIBILITY_DETAILS',
    status: 'active',
    deductible: 1000,
    deductibleMet: 500,
    outOfPocketMax: 5000,
    outOfPocketMet: 1000,
    copay: 20,
    coinsurance: 0.2,
    responseData: { raw: 'MOCK_RESPONSE_DATA' }
  };
};

const prisma = new PrismaClient();

/**
 * Process a task to create a claim from a report
 */
export async function processCreateClaimTask(task: TaskWithMetadata): Promise<any> {
  const reportId = task.data.reportId as string;
  
  if (!reportId) {
    throw new Error('Report ID is required for CREATE_CLAIM task');
  }
  
  // Get the report data
  const report = await prisma.report.findUnique({
    where: { id: reportId as string },
    include: { user: true }
  });
  
  if (!report) {
    throw new Error(`Report not found: ${reportId}`);
  }
  
  // Get user's primary insurance plan
  const insurancePlan = await prisma.insurancePlan.findFirst({
    where: { 
      userId: report.userId,
      isPrimary: true,
      isActive: true
    }
  });
  
  if (!insurancePlan) {
    throw new Error(`No active primary insurance plan found for user: ${report.userId}`);
  }
  
  // Parse report data and create claim
  // This is simplified - in a real implementation, you would extract
  // service lines, diagnoses, etc. from the report data
  const parsedData = report.parsedData ? JSON.parse(report.parsedData) : {};
  
  // Generate a unique claim number
  const claimNumber = `CL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Create the claim
  const claim = await prisma.claim.create({
    data: {
      userId: report.userId,
      reportId: report.id,
      insurancePlanId: insurancePlan.id,
      claimNumber,
      status: ClaimStatus.DRAFT,
      totalCharge: parsedData.totalCharge || 0,
      claimEvents: {
        create: {
          eventType: 'CREATED',
          notes: 'Claim created by Billing Agent',
          eventData: { source: 'BILLING_AGENT', taskId: task.id }
        }
      },
      // Add claim lines based on parsed data
      claimLines: {
        create: (parsedData.services || []).map((service: any, index: number) => ({
          lineNumber: index + 1,
          cptCode: service.cptCode || '99999',
          description: service.description || 'Unknown service',
          icd10Codes: service.diagnoses || [],
          charge: service.charge || 0,
          units: service.units || 1,
          serviceDate: service.date ? new Date(service.date) : new Date()
        }))
      }
    }
  });
  
  return { claimId: claim.id, claimNumber: claim.claimNumber };
}

/**
 * Process a task to check eligibility for a claim
 */
export async function processCheckEligibilityTask(task: TaskWithMetadata): Promise<any> {
  const claimId = task.metadata?.claimId as string;
  
  if (!claimId) {
    throw new Error('Claim ID is required for CHECK_ELIGIBILITY task');
  }
  
  // Get the claim with insurance plan
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { insurancePlan: true }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  // Check eligibility using the eligibility service
  // Get insurance plan details
  const insurancePlan = await prisma.insurancePlan.findUnique({
    where: { id: claim.insurancePlanId }
  });
  
  if (!insurancePlan) {
    throw new Error(`Insurance plan not found: ${claim.insurancePlanId}`);
  }
  
  const eligibilityResult = await checkEligibility({
    payerId: insurancePlan.payerId,
    memberId: insurancePlan.memberId,
    groupNumber: insurancePlan.groupNumber || ''
  });
  
  // Create or update eligibility record
  const eligibility = await prisma.eligibilityCheck.upsert({
    where: { claimId: claim.id },
    update: {
      status: eligibilityResult.status,
      deductible: eligibilityResult.deductible,
      deductibleMet: eligibilityResult.deductibleMet,
      outOfPocketMax: eligibilityResult.outOfPocketMax,
      outOfPocketMet: eligibilityResult.outOfPocketMet,
      copay: eligibilityResult.copay,
      coinsurance: eligibilityResult.coinsurance,
      responseData: eligibilityResult.responseData,
      checkedAt: new Date()
    },
    create: {
      insurancePlanId: claim.insurancePlanId,
      claimId: claim.id,
      status: eligibilityResult.status,
      deductible: eligibilityResult.deductible,
      deductibleMet: eligibilityResult.deductibleMet,
      outOfPocketMax: eligibilityResult.outOfPocketMax,
      outOfPocketMet: eligibilityResult.outOfPocketMet,
      copay: eligibilityResult.copay,
      coinsurance: eligibilityResult.coinsurance,
      responseData: eligibilityResult.responseData
    }
  });
  
  // Update claim status if eligible
  if (eligibilityResult.status === 'active') {
    await prisma.claim.update({
      where: { id: claim.id },
      data: { 
        status: ClaimStatus.READY,
        claimEvents: {
          create: {
            eventType: 'ELIGIBILITY_VERIFIED',
            notes: 'Eligibility verified by Billing Agent',
            eventData: { 
              source: 'BILLING_AGENT', 
              taskId: task.id,
              eligibilityId: eligibility.id
            }
          }
        }
      }
    });
  } else {
    await prisma.claim.update({
      where: { id: claim.id },
      data: {
        claimEvents: {
          create: {
            eventType: 'ELIGIBILITY_ISSUE',
            notes: `Eligibility issue: ${eligibilityResult.status}`,
            eventData: { 
              source: 'BILLING_AGENT', 
              taskId: task.id,
              eligibilityId: eligibility.id
            }
          }
        }
      }
    });
  }
  
  return eligibilityResult;
}

/**
 * Process a task to generate EDI file for a claim
 */
export async function processGenerateEdiTask(task: TaskWithMetadata): Promise<any> {
  const claimId = task.metadata?.claimId as string;
  
  if (!claimId) {
    throw new Error('Claim ID is required for GENERATE_EDI task');
  }
  
  // Get the claim with all related data
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { 
      user: true,
      insurancePlan: true,
      claimLines: true
    }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  if (claim.status !== ClaimStatus.READY) {
    throw new Error(`Claim is not in READY status: ${claimId}`);
  }
  
  // Generate EDI file
  const ediResult = await generateEdi(claim);
  
  // Extract the content string from the result
  // The generateEdi function might return an object with an ediContent property
  let ediContent: string;
  if (typeof ediResult === 'string') {
    ediContent = ediResult;
  } else if (ediResult && typeof ediResult === 'object' && 'ediContent' in ediResult) {
    ediContent = ediResult.ediContent as string;
  } else {
    // Fallback to stringifying the result
    ediContent = JSON.stringify(ediResult);
  }
  
  const fileName = `claim_${claim.claimNumber.replace(/[^a-zA-Z0-9]/g, '_')}.edi`;
  const filePath = `./uploads/edi/${fileName}`;
  
  // Save EDI file
  const ediFile = await prisma.ediFile.create({
    data: {
      claimId: claim.id,
      fileName,
      filePath,
      content: ediContent
    }
  });
  
  // Update claim with EDI file location
  await prisma.claim.update({
    where: { id: claim.id },
    data: { 
      ediFileLocation: filePath,
      claimEvents: {
        create: {
          eventType: 'EDI_GENERATED',
          notes: 'EDI file generated by Billing Agent',
          eventData: { 
            source: 'BILLING_AGENT', 
            taskId: task.id,
            ediFileId: ediFile.id
          }
        }
      }
    }
  });
  
  return { ediFileId: ediFile.id, filePath };
}

/**
 * Process a task to submit a claim to the clearinghouse
 */
export async function processSubmitClaimTask(task: TaskWithMetadata): Promise<any> {
  const claimId = task.metadata?.claimId as string;
  
  if (!claimId) {
    throw new Error('Claim ID is required for SUBMIT_CLAIM task');
  }
  
  // Get the claim with EDI file
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { ediFiles: true }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  // Check if EDI files exist (using metadata as a workaround)
  const ediFiles = (claim as any).ediFiles || [];
  if (ediFiles.length === 0) {
    throw new Error(`No EDI file found for claim: ${claimId}`);
  }
  
  // In a real implementation, this would submit to a clearinghouse
  // For the MVP, we'll simulate a submission
  const clearinghouseId = `CH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const submissionDate = new Date();
  
  // Update claim as submitted
  await prisma.claim.update({
    where: { id: claim.id },
    data: { 
      status: ClaimStatus.SUBMITTED,
      submissionDate,
      clearinghouseId,
      claimEvents: {
        create: {
          eventType: 'SUBMITTED',
          notes: 'Claim submitted by Billing Agent',
          eventData: { 
            source: 'BILLING_AGENT', 
            taskId: task.id,
            clearinghouseId,
            submissionDate: submissionDate.toISOString()
          }
        }
      }
    }
  });
  
  return { clearinghouseId, submissionDate };
}

/**
 * Process a task to check the status of a submitted claim
 */
export async function processCheckStatusTask(task: TaskWithMetadata): Promise<any> {
  const claimId = task.metadata?.claimId as string;
  
  if (!claimId) {
    throw new Error('Claim ID is required for CHECK_STATUS task');
  }
  
  // Get the claim
  const claim = await prisma.claim.findUnique({
    where: { id: claimId }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  if (!claim.clearinghouseId) {
    throw new Error(`Claim has not been submitted: ${claimId}`);
  }
  
  // In a real implementation, this would check with the clearinghouse
  // For the MVP, we'll simulate a status check with random outcomes
  const statusOptions = [
    { status: ClaimStatus.ACCEPTED, probability: 0.7 },
    { status: ClaimStatus.REJECTED, probability: 0.2 },
    { status: ClaimStatus.DENIED, probability: 0.1 }
  ];
  
  // Determine status based on probabilities
  const random = Math.random();
  let cumulativeProbability = 0;
  let newStatus: ClaimStatus = ClaimStatus.SUBMITTED;
  
  for (const option of statusOptions) {
    cumulativeProbability += option.probability;
    if (random <= cumulativeProbability) {
      // Type assertion to convert string to ClaimStatus
      newStatus = option.status as ClaimStatus;
      break;
    }
  }
  
  // If status changed, update the claim
  if (newStatus !== claim.status) {
    const processedDate = new Date();
    let denialReason = null;
    
    // Check if status indicates rejection or denial
  if (newStatus === 'REJECTED' || newStatus === 'DENIED') {
      const reasons = [
        'Missing information',
        'Service not covered',
        'Duplicate claim',
        'Authorization required',
        'Patient not eligible on date of service'
      ];
      denialReason = reasons[Math.floor(Math.random() * reasons.length)];
    }
    
    await prisma.claim.update({
      where: { id: claim.id },
      data: { 
        status: newStatus,
        processedDate,
        denialReason,
        claimEvents: {
          create: {
            eventType: `STATUS_${newStatus}`,
            notes: denialReason || `Claim ${newStatus.toLowerCase()} by payer`,
            eventData: { 
              source: 'BILLING_AGENT', 
              taskId: task.id,
              processedDate: processedDate.toISOString(),
              denialReason
            }
          }
        }
      }
    });
    
    // If denied, create a pattern in the knowledge base
    // Check if status indicates denial and has reason
  if (newStatus === 'DENIED' && denialReason) {
      await prisma.denialPattern.create({
        data: {
          payerId: claim.insurancePlanId,
          denialCode: 'UNKNOWN', // In a real implementation, this would be a code from the payer
          denialReason,
          frequency: 1,
          lastOccurred: new Date(),
          preventionRule: {
            suggestion: 'Review claim for completeness and accuracy'
          }
        }
      });
    }
  }
  
  return { 
    previousStatus: claim.status,
    newStatus,
    changed: newStatus !== claim.status
  };
}

/**
 * Process a task to file an appeal for a denied claim
 */
export async function processFileAppealTask(task: TaskWithMetadata): Promise<any> {
  const claimId = task.metadata?.claimId as string;
  const appealReason = task.metadata?.appealReason as string;
  
  if (!claimId) {
    throw new Error('Claim ID is required for FILE_APPEAL task');
  }
  
  if (!appealReason) {
    throw new Error('Appeal reason is required for FILE_APPEAL task');
  }
  
  // Get the claim
  const claim = await prisma.claim.findUnique({
    where: { id: claimId }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  if (claim.status !== ClaimStatus.DENIED && claim.status !== ClaimStatus.REJECTED) {
    throw new Error(`Claim is not in DENIED or REJECTED status: ${claimId}`);
  }
  
  // In a real implementation, this would file an appeal with the payer
  // For the MVP, we'll simulate an appeal
  
  // Update claim as appealed
  await prisma.claim.update({
    where: { id: claim.id },
    data: { 
      status: ClaimStatus.APPEALED,
      claimEvents: {
        create: {
          eventType: 'APPEALED',
          notes: `Appeal filed: ${appealReason}`,
          eventData: { 
            source: 'BILLING_AGENT', 
            taskId: task.id,
            appealReason: appealReason,
            appealDate: new Date().toISOString()
          } as any // Type assertion to any to avoid Prisma JSON type issues
        }
      }
    }
  });
  
  return { appealDate: new Date() };
}
