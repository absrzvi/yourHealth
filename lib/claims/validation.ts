export type ClaimStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'APPROVED'
  | 'DENIED'
  | 'PAID';

export interface ClaimLineInput {
  lineNumber?: number;
  cptCode: string;
  description?: string;
  icd10Codes?: string[];
  charge: number;
  units?: number;
  modifier?: string;
  serviceDate: string | Date;
}

export interface ClaimInput {
  claimNumber: string;
  totalCharge: number;
  status: ClaimStatus;
  claimLines?: Array<ClaimLineInput>;
  isUpdate?: boolean; // Flag to indicate if this is an update operation
  insurancePlanId?: string; // Required for new claims
  reportId?: string; // Optional report ID
  userId?: string; // User ID for claim ownership
  patientId?: string; // Optional patient ID
  providerNpi?: string; // Provider NPI number
  billingProviderNpi?: string; // Billing provider NPI
  diagnosisCodes?: string[]; // Primary diagnosis codes
  submissionDate?: string | Date; // Date of submission
}

/**
 * Validates a claim input for creation or update
 * @param input The claim input to validate
 * @returns Array of error messages, empty if valid
 */
export function validateClaimInput(input: ClaimInput): string[] {
  const errors: string[] = [];
  const isUpdate = input.isUpdate === true;

  // Required fields for all operations
  if (!input.claimNumber) errors.push('Claim number is required.');
  if (input.totalCharge == null || isNaN(input.totalCharge)) errors.push('Total charge is required.');
  if (!input.status) errors.push('Status is required.');
  
  // Required fields only for new claims, not for updates
  if (!isUpdate) {
    if (!input.insurancePlanId) errors.push('Insurance plan ID is required for new claims.');
    if (!input.claimLines || input.claimLines.length === 0) {
      errors.push('At least one claim line is required for new claims.');
    }
  }

  // Business rules
  if (input.totalCharge < 0) errors.push('Total charge cannot be negative.');
  
  // Validate claim lines if they exist
  if (input.claimLines && input.claimLines.length > 0) {
    // Check for duplicate line numbers
    const lineNumbers = input.claimLines
      .filter(line => line.lineNumber !== undefined)
      .map(line => line.lineNumber);
    const uniqueLineNumbers = new Set(lineNumbers);
    if (lineNumbers.length !== uniqueLineNumbers.size) {
      errors.push('Duplicate line numbers are not allowed.');
    }
    
    // Validate each claim line
    input.claimLines.forEach((line, index) => {
      // Check required fields
      if (!line.cptCode) {
        errors.push(`Line ${index + 1}: CPT code is required.`);
      }
      
      if (line.charge == null || isNaN(line.charge)) {
        errors.push(`Line ${index + 1}: Charge is required.`);
      } else if (line.charge <= 0) {
        errors.push(`Line ${index + 1}: Charge must be positive.`);
      }
      
      if (!line.serviceDate) {
        errors.push(`Line ${index + 1}: Service date is required.`);
      }
      
      // Validate units
      if (line.units !== undefined && (isNaN(line.units) || line.units <= 0)) {
        errors.push(`Line ${index + 1}: Units must be a positive number.`);
      }
      
      // Validate CPT code format (5 digits)
      if (line.cptCode && !/^\d{5}$/.test(line.cptCode)) {
        errors.push(`Line ${index + 1}: CPT code must be 5 digits.`);
      }
      
      // Validate ICD-10 codes if present
      if (line.icd10Codes && line.icd10Codes.length > 0) {
        // ICD-10 format: Letter followed by 2 digits, optional decimal, and up to 4 more digits
        const validIcd10Format = /^[A-Z]\d{2}(\.\d{1,4})?$/;
        const invalidCodes = line.icd10Codes.filter(code => !validIcd10Format.test(code));
        if (invalidCodes.length > 0) {
          errors.push(`Line ${index + 1}: Invalid ICD-10 format for codes: ${invalidCodes.join(', ')}.`);
        }
      }
    });
    
    // Validate total charge matches sum of line charges
    const calculatedTotal = input.claimLines.reduce((sum, line) => {
      const units = line.units || 1;
      return sum + (line.charge * units);
    }, 0);
    
    // Allow for small rounding differences (within 1 cent)
    if (Math.abs(calculatedTotal - input.totalCharge) > 0.01) {
      errors.push(`Total charge (${input.totalCharge}) does not match sum of line charges (${calculatedTotal.toFixed(2)}).`);
    }
  }

  // Validate status transitions for updates
  if (isUpdate && input.status) {
    // Status transition validation would be handled elsewhere
  }

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