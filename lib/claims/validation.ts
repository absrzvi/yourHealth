export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'DENIED'
  | 'PAID';

export interface ClaimInput {
  claimNumber: string;
  totalCharge: number;
  status: ClaimStatus;
  claimLines: Array<{
    cptCode: string;
    charge: number;
    serviceDate: string;
  }>;
  // ...other fields
}

export function validateClaimInput(input: ClaimInput): string[] {
  const errors: string[] = [];

  // Required fields
  if (!input.claimNumber) errors.push('Claim number is required.');
  if (input.totalCharge == null || isNaN(input.totalCharge)) errors.push('Total charge is required.');
  if (!input.status) errors.push('Status is required.');
  if (!input.claimLines || input.claimLines.length === 0) errors.push('At least one claim line is required.');

  // Business rules
  if (input.totalCharge < 0) errors.push('Total charge cannot be negative.');
  if (input.claimLines.some(line => !line.cptCode)) errors.push('All claim lines must have a CPT code.');
  if (input.claimLines.some(line => line.charge <= 0)) errors.push('All claim lines must have a positive charge.');

  // Add more rules as needed...

  return errors;
}

const validTransitions: Record<ClaimStatus, ClaimStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['PROCESSING', 'DENIED'],
  PROCESSING: ['APPROVED', 'DENIED'],
  APPROVED: ['PAID'],
  DENIED: [],
  PAID: [],
};

export function canTransition(current: ClaimStatus, next: ClaimStatus): boolean {
  return validTransitions[current]?.includes(next);
} 