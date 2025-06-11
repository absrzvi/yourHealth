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
  
  // New fields for EDI 837P requirements
  placeOfService: string | null;
  priorAuthNumber: string | null;
  referralNumber: string | null;
  admissionDate: Date | null;
  dischargeDate: Date | null;
  patientAccountNum: string | null;
  acceptAssignment: boolean;
  totalCoinsurance: number | null;
  totalDeductible: number | null;
  
  // Provider information
  renderingProviderNPI: string | null;
  referringProviderNPI: string | null;
  facilityNPI: string | null;
  
  // Additional identifiers
  medicalRecordNumber: string | null;
  
  // Audit fields
  ediValidatedAt: Date | null;
  ediValidationErrors: Record<string, unknown> | null;
  
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
  eventData: Record<string, unknown>;
  notes: string | null;
  createdAt: Date;
}

export interface ClaimDraft {
  id: string;
  userId: string;
  reportId: string | null;
  insurancePlanId: string | null;
  draftName: string | null;
  draftData: Record<string, unknown>;
  pdfParseConfidence: number | null;
  pdfParseResults: Record<string, unknown> | null;
  lastEditedSection: string | null;
  completedSections: Record<string, boolean> | null;
  validationErrors: Record<string, unknown> | null;
  biomarkers: Record<string, unknown> | null;
  
  // Patient information
  patientFirstName: string | null;
  patientLastName: string | null;
  patientDOB: Date | null;
  patientGender: string | null;
  patientAddress: string | null;
  patientCity: string | null;
  patientState: string | null;
  patientZip: string | null;
  patientPhone: string | null;
  
  // Provider information
  providerName: string | null;
  providerNPI: string | null;
  providerTaxId: string | null;
  providerAddress: string | null;
  providerCity: string | null;
  providerState: string | null;
  providerZip: string | null;
  
  // Specimen information
  specimenId: string | null;
  collectionDate: Date | null;
  receivedDate: Date | null;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  lastAutoSave: Date;
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

export interface Report {
  id: string;
  userId: string;
  type: string;
  fileName: string;
  filePath: string;
  parsedData: string | null;
  createdAt: Date;
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
  
  // New fields for EDI 837P requirements
  placeOfService?: string;
  priorAuthNumber?: string;
  referralNumber?: string;
  admissionDate?: Date;
  dischargeDate?: Date;
  patientAccountNum?: string;
  acceptAssignment?: boolean;
  
  // Provider information
  renderingProviderNPI?: string;
  referringProviderNPI?: string;
  facilityNPI?: string;
  
  // Additional identifiers
  medicalRecordNumber?: string;
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
  
  // New fields for EDI 837P requirements
  placeOfService?: string;
  priorAuthNumber?: string;
  referralNumber?: string;
  admissionDate?: Date;
  dischargeDate?: Date;
  patientAccountNum?: string;
  acceptAssignment?: boolean;
  totalCoinsurance?: number;
  totalDeductible?: number;
  
  // Provider information
  renderingProviderNPI?: string;
  referringProviderNPI?: string;
  facilityNPI?: string;
  
  // Additional identifiers
  medicalRecordNumber?: string;
  
  // Audit fields
  ediValidatedAt?: Date;
  ediValidationErrors?: Record<string, unknown>;
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

// Claim Draft interfaces
export interface CreateClaimDraftInput {
  userId: string;
  reportId?: string | null;
  insurancePlanId?: string | null;
  draftName?: string;
  draftData?: Record<string, unknown>;
  
  // Patient information
  patientFirstName?: string;
  patientLastName?: string;
  patientDOB?: Date;
  patientGender?: string;
  patientAddress?: string;
  patientCity?: string;
  patientState?: string;
  patientZip?: string;
  patientPhone?: string;
  
  // Provider information
  providerName?: string;
  providerNPI?: string;
  providerTaxId?: string;
  providerAddress?: string;
  providerCity?: string;
  providerState?: string;
  providerZip?: string;
  
  // Specimen information
  specimenId?: string;
  collectionDate?: Date;
  receivedDate?: Date;
}

export interface UpdateClaimDraftInput {
  draftName?: string;
  draftData?: Record<string, unknown>;
  lastEditedSection?: string;
  completedSections?: Record<string, boolean>;
  validationErrors?: Record<string, unknown>;
  biomarkers?: Record<string, unknown>;
  
  // Patient information
  patientFirstName?: string;
  patientLastName?: string;
  patientDOB?: Date;
  patientGender?: string;
  patientAddress?: string;
  patientCity?: string;
  patientState?: string;
  patientZip?: string;
  patientPhone?: string;
  
  // Provider information
  providerName?: string;
  providerNPI?: string;
  providerTaxId?: string;
  providerAddress?: string;
  providerCity?: string;
  providerState?: string;
  providerZip?: string;
  
  // Specimen information
  specimenId?: string;
  collectionDate?: Date;
  receivedDate?: Date;
}

export interface ClaimDraftWithRelations extends ClaimDraft {
  user: User;
  report?: Report;
  insurancePlan?: InsurancePlan;
}

export interface PDFParseResult {
  confidence: number;
  patient: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  };
  provider: {
    name?: string;
    npi?: string;
    taxId?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  specimen: {
    id?: string;
    collectionDate?: string;
    receivedDate?: string;
  };
  biomarkers: Array<{
    name: string;
    value: number | string;
    unit?: string;
    referenceRange?: string;
    status?: string;
    category?: string;
  }>;
  rawText?: string;
  extractedSections?: Record<string, string>;
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
