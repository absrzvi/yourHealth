import { PrismaClient } from '@prisma/client';
import { TaskWithMetadata, TaskProcessor } from './types';

const prisma = new PrismaClient();

// Mock implementation of generateEdi for development
// This should be replaced with the actual implementation
async function generateEdi(claim: any): Promise<string> {
  // Generate EDI content based on claim data
  return JSON.stringify({
    ediContent: `EDI content for claim ${claim.claimNumber}`
  });
}

// Mock implementation of checkEligibility for development
// This should be replaced with the actual implementation
async function checkEligibility(patientId: string, insurancePlanId: string): Promise<any> {
  // Check eligibility with insurance provider
  return {
    eligible: true,
    coverageDetails: {
      deductible: 1000,
      coinsurance: 20,
      outOfPocketMax: 5000
    }
  };
}

/**
 * Process a CREATE_CLAIM task
 */
export const processCreateClaimTask: TaskProcessor = async (task: TaskWithMetadata): Promise<void> => {
  console.log(`Processing CREATE_CLAIM task: ${task.id}`);
  
  // Extract task data
  const { patientId, providerId, serviceDate, diagnosisCodes, procedureCodes } = task.data || {};
  
  if (!patientId || !providerId) {
    throw new Error('Missing required fields: patientId and providerId are required');
  }
  
  // Get patient and provider data
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { insurancePlan: true }
  });
  
  if (!patient) {
    throw new Error(`Patient not found: ${patientId}`);
  }
  
  const provider = await prisma.provider.findUnique({
    where: { id: providerId }
  });
  
  if (!provider) {
    throw new Error(`Provider not found: ${providerId}`);
  }
  
  // Create claim
  const claim = await prisma.claim.create({
    data: {
      patientId,
      providerId,
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      diagnosisCodes: diagnosisCodes || [],
      procedureCodes: procedureCodes || [],
      status: 'CREATED',
      claimNumber: `CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      insurancePlanId: patient.insurancePlanId || ''
    }
  });
  
  console.log(`Created claim: ${claim.id}`);
};

/**
 * Process a CHECK_ELIGIBILITY task
 */
export const processCheckEligibilityTask: TaskProcessor = async (task: TaskWithMetadata): Promise<void> => {
  console.log(`Processing CHECK_ELIGIBILITY task: ${task.id}`);
  
  // Extract task data
  const { patientId } = task.data || {};
  
  if (!patientId) {
    throw new Error('Missing required field: patientId');
  }
  
  // Get patient data with insurance plan
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { insurancePlan: true }
  });
  
  if (!patient) {
    throw new Error(`Patient not found: ${patientId}`);
  }
  
  if (!patient.insurancePlanId) {
    throw new Error(`Patient ${patientId} has no insurance plan`);
  }
  
  // Check eligibility with insurance provider
  const eligibilityResult = await checkEligibility(
    patientId,
    patient.insurancePlanId
  );
  
  // Update patient eligibility status
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      eligibilityStatus: eligibilityResult.eligible ? 'ELIGIBLE' : 'INELIGIBLE',
      eligibilityCheckedAt: new Date(),
      eligibilityDetails: eligibilityResult
    }
  });
  
  console.log(`Updated eligibility for patient: ${patientId}`);
};

/**
 * Process a GENERATE_EDI task
 */
export const processGenerateEdiTask: TaskProcessor = async (task: TaskWithMetadata): Promise<void> => {
  console.log(`Processing GENERATE_EDI task: ${task.id}`);
  
  // Extract task data
  const { claimId } = task.data || {};
  
  if (!claimId) {
    throw new Error('Missing required field: claimId');
  }
  
  // Get claim data
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      patient: {
        include: { insurancePlan: true }
      },
      provider: true
    }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  // Generate EDI file
  const ediResult = await generateEdi(claim);
  // Extract the content string from the result
  const ediContent = typeof ediResult === 'string' ? ediResult : ediResult;
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
      ediFileId: ediFile.id,
      status: 'READY_TO_SUBMIT'
    }
  });
  
  console.log(`Generated EDI file for claim: ${claimId}`);
};

/**
 * Process a SUBMIT_CLAIM task
 */
export const processSubmitClaimTask: TaskProcessor = async (task: TaskWithMetadata): Promise<void> => {
  console.log(`Processing SUBMIT_CLAIM task: ${task.id}`);
  
  // Extract task data
  const { claimId } = task.data || {};
  
  if (!claimId) {
    throw new Error('Missing required field: claimId');
  }
  
  // Get claim data with EDI file
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      ediFile: true,
      patient: {
        include: { insurancePlan: true }
      }
    }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  if (!claim.ediFileId) {
    throw new Error(`Claim ${claimId} has no EDI file`);
  }
  
  // Submit claim to clearinghouse or payer
  // This is a placeholder for the actual submission logic
  const submissionId = `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const submissionDate = new Date();
  
  // Update claim with submission details
  await prisma.claim.update({
    where: { id: claimId },
    data: {
      status: 'SUBMITTED',
      submissionId,
      submittedAt: submissionDate
    }
  });
  
  console.log(`Submitted claim: ${claimId}, submission ID: ${submissionId}`);
};

/**
 * Process a CHECK_STATUS task
 */
export const processCheckStatusTask: TaskProcessor = async (task: TaskWithMetadata): Promise<void> => {
  console.log(`Processing CHECK_STATUS task: ${task.id}`);
  
  // Extract task data
  const { claimId } = task.data || {};
  
  if (!claimId) {
    throw new Error('Missing required field: claimId');
  }
  
  // Get claim data
  const claim = await prisma.claim.findUnique({
    where: { id: claimId }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  if (!claim.submissionId) {
    throw new Error(`Claim ${claimId} has not been submitted`);
  }
  
  // Check claim status with clearinghouse or payer
  // This is a placeholder for the actual status check logic
  const statusResult = {
    status: Math.random() > 0.3 ? 'ACCEPTED' : 'PENDING',
    message: 'Claim is being processed',
    updatedAt: new Date()
  };
  
  // Update claim with status details
  await prisma.claim.update({
    where: { id: claimId },
    data: {
      status: statusResult.status,
      statusDetails: statusResult
    }
  });
  
  console.log(`Updated status for claim: ${claimId}`);
};

/**
 * Process a FILE_APPEAL task
 */
export const processFileAppealTask: TaskProcessor = async (task: TaskWithMetadata): Promise<void> => {
  console.log(`Processing FILE_APPEAL task: ${task.id}`);
  
  // Extract task data
  const { claimId, reason, supportingDocuments } = task.data || {};
  
  if (!claimId || !reason) {
    throw new Error('Missing required fields: claimId and reason');
  }
  
  // Get claim data
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      patient: {
        include: { insurancePlan: true }
      }
    }
  });
  
  if (!claim) {
    throw new Error(`Claim not found: ${claimId}`);
  }
  
  // Create appeal
  const appeal = await prisma.appeal.create({
    data: {
      claimId,
      reason,
      status: 'FILED',
      supportingDocuments: supportingDocuments || [],
      filedAt: new Date()
    }
  });
  
  // Update claim status
  await prisma.claim.update({
    where: { id: claimId },
    data: {
      status: 'APPEALED',
      appealId: appeal.id
    }
  });
  
  console.log(`Filed appeal for claim: ${claimId}, appeal ID: ${appeal.id}`);
};
