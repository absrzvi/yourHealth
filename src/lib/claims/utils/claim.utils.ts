import { ClaimStatus, Claim, ClaimLine } from '@prisma/client';

/**
 * Calculate the total charge for claim lines
 */
export function calculateTotalCharge(lines: Pick<ClaimLine, 'charge' | 'units'>[]): number {
  return lines.reduce((sum, line) => {
    return sum + (line.charge * (line.units || 1));
  }, 0);
}

/**
 * Check if a claim can be submitted
 */
export function canSubmitClaim(claim: Claim): boolean {
  return [ClaimStatus.DRAFT, ClaimStatus.REJECTED, ClaimStatus.DENIED].includes(claim.status);
}

/**
 * Check if a claim can be updated
 */
export function canUpdateClaim(claim: Claim): boolean {
  return ![
    ClaimStatus.PAID,
    ClaimStatus.CANCELLED,
  ].includes(claim.status);
}

/**
 * Format a claim for display
 */
export function formatClaimForDisplay(claim: Claim & { claimLines: ClaimLine[] }) {
  return {
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status,
    totalCharge: claim.totalCharge,
    allowedAmount: claim.allowedAmount,
    paidAmount: claim.paidAmount,
    patientResponsibility: claim.patientResponsibility,
    submissionDate: claim.submissionDate,
    processedDate: claim.processedDate,
    lineItems: claim.claimLines.map(line => ({
      id: line.id,
      cptCode: line.cptCode,
      description: line.description,
      charge: line.charge,
      units: line.units,
      serviceDate: line.serviceDate,
    })),
  };
}

/**
 * Validate claim line items
 */
export function validateClaimLines(lines: any[]): { isValid: boolean; error?: string } {
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return { isValid: false, error: 'At least one claim line is required' };
  }

  for (const [index, line] of lines.entries()) {
    if (!line.cptCode) {
      return { isValid: false, error: `Line ${index + 1}: CPT code is required` };
    }

    if (!line.description) {
      return { isValid: false, error: `Line ${index + 1}: Description is required` };
    }

    if (line.charge === undefined || line.charge < 0) {
      return { isValid: false, error: `Line ${index + 1}: Valid charge amount is required` };
    }

    if (line.units !== undefined && (line.units < 1 || !Number.isInteger(line.units))) {
      return { isValid: false, error: `Line ${index + 1}: Units must be a positive integer` };
    }

    if (!line.serviceDate) {
      return { isValid: false, error: `Line ${index + 1}: Service date is required` };
    }
  }

  return { isValid: true };
}

/**
 * Calculate claim metrics
 */
export function calculateClaimMetrics(claims: Claim[]) {
  const totalClaims = claims.length;
  const totalCharged = claims.reduce((sum, claim) => sum + (claim.totalCharge || 0), 0);
  const totalPaid = claims.reduce((sum, claim) => sum + (claim.paidAmount || 0), 0);
  
  const statusCounts = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalClaims,
    totalCharged,
    totalPaid,
    statusCounts,
    averageReimbursement: totalClaims > 0 ? totalPaid / totalClaims : 0,
  };
}
