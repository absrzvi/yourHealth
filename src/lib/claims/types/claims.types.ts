// Define base interfaces to match Prisma schema
export interface Claim {
  id: string;
  userId: string;
  reportId: string | null;
  insurancePlanId: string;
  claimNumber: string;
  status: string;
  totalCharge: number;
  allowedAmount: number | null;
  paidAmount: number | null;
  patientResponsibility: number | null;
  denialReason: string | null;
  submissionDate: Date | null;
  processedDate: Date | null;
  ediFileLocation: string | null;
  clearinghouseId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimLine {
  id: string;
  claimId: string;
  lineNumber: number;
  cptCode: string;
  description: string;
  icd10Codes: string[];
  charge: number;
  units: number;
  modifier: string | null;
  serviceDate: Date;
  serviceFacilityName: string | null;
  serviceFacilityNpi: string | null;
  renderingProviderNpi: string | null;
  referringProviderNpi: string | null;
}

export interface ClaimEvent {
  id: string;
  claimId: string;
  eventType: string;
  eventData: Record<string, any>;
  notes: string | null;
  createdAt: Date;
}

export interface InsurancePlan {
  id: string;
  userId: string;
  payerName: string;
  payerId: string;
  memberId: string;
  groupNumber: string | null;
  planType: string;
  isPrimary: boolean;
  isActive: boolean;
  effectiveDate: Date;
  terminationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Updated to match Prisma schema enum
export type ClaimStatus = 
  | 'DRAFT'
  | 'READY'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'DENIED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'APPEALED';

export interface CreateClaimInput {
  userId: string;
  reportId?: string | null;
  insurancePlanId: string;
  claimNumber?: string;
  totalCharge?: number;
  claimLines: CreateClaimLineInput[];
  submissionDate?: Date | null;
}

export interface CreateClaimLineInput {
  lineNumber: number;
  cptCode: string;
  description: string;
  icd10Codes: string[];
  charge: number;
  units?: number;
  modifier?: string;
  serviceDate: Date;
  serviceFacilityName?: string;
  serviceFacilityNpi?: string;
  renderingProviderNpi?: string;
  referringProviderNpi?: string;
}

export interface UpdateClaimInput {
  status?: ClaimStatus;
  allowedAmount?: number;
  paidAmount?: number;
  patientResponsibility?: number;
  denialReason?: string;
  submissionDate?: Date | null;
  processedDate?: Date;
  ediFileLocation?: string;
  clearinghouseId?: string;
}

export interface ClaimWithRelations extends Omit<Claim, 'status'> {
  status: ClaimStatus;
  insurancePlan: InsurancePlan;
  claimLines: ClaimLine[];
  claimEvents: ClaimEvent[];
  user: User;
  // Add missing properties that might be included in queries
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimsFilter {
  userId?: string;
  status?: ClaimStatus | ClaimStatus[];
  insurancePlanId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export interface ClaimsPaginationOptions {
  page?: number;
  pageSize?: number;
  orderBy?: keyof Claim;
  orderDirection?: 'asc' | 'desc';
}

export interface ClaimsResult {
  data: ClaimWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ClaimEventData {
  eventType: string;
  notes?: string;
  eventData?: Record<string, unknown>;
  metadata?: Record<string, unknown>; // For backward compatibility
}

// Error types
export class ClaimsError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ClaimsError';
  }
}

export class ValidationError extends ClaimsError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ClaimsError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ClaimsError {
  constructor() {
    super('Unauthorized access to claim', 'UNAUTHORIZED', 403);
    this.name = 'UnauthorizedError';
  }
}
