import { ClaimLine, Claim, InsurancePlan, User } from '../../../src/lib/claims/types/claims.types';

/**
 * Extended ClaimLine interface with additional fields needed for EDI 837 generation
 */
export interface EDIClaimLine extends ClaimLine {
  // Service date information
  serviceStartDate?: Date; // Same as serviceDate but explicitly for ranges
  serviceEndDate?: Date;   // For date ranges when service spans multiple days
  
  // Place of service
  placeOfService?: string; // CMS Place of Service code (e.g., "11" for office)
  
  // Diagnosis code pointers
  diagnosisCodePointers?: number[]; // Points to which diagnosis codes apply to this line (e.g. [1,2])
  
  // Drug information for medication claims
  nationalDrugCode?: string;  // NDC format (e.g., "12345-6789-01")
  drugQuantity?: number;      // Quantity of drug
  drugUnit?: string;          // Unit of measurement (e.g., "ML", "GR", "UN")
  
  // Detailed rendering provider information
  renderingProviderFirstName?: string;
  renderingProviderLastName?: string;
  renderingProviderMiddleName?: string;
  renderingProviderTaxonomyCode?: string;
  
  // Additional service line information
  authorizationNumber?: string;  // Prior authorization number for this line
  referralNumber?: string;       // Referral number for this line
  revenueCode?: string;          // For institutional claims
  epsdtIndicator?: boolean;      // Early & Periodic Screening, Diagnosis and Treatment indicator
}

/**
 * Enhanced claim interface with additional EDI-specific fields
 */
export interface EDIClaim extends Omit<Claim, 'claimLines'> {
  // Include enhanced claim lines
  claimLines: EDIClaimLine[];
  
  // General claim information
  placeOfService?: string;    // Default place of service
  serviceDate?: Date;         // Default service date for all lines
  claimFrequencyCode?: string; // Original (1), replacement (7), etc.
  
  // Provider information
  referringProviderNpi?: string; // NPI of referring provider
  referringProviderFirstName?: string;
  referringProviderLastName?: string;
  
  renderingProviderNpi?: string; // NPI of rendering provider (if different from billing)
  renderingProviderFirstName?: string;
  renderingProviderLastName?: string;
  
  // Service facility
  serviceFacilityName?: string;
  serviceFacilityNpi?: string;
  serviceFacilityAddress1?: string;
  serviceFacilityAddress2?: string;
  serviceFacilityCity?: string;
  serviceFacilityState?: string;
  serviceFacilityZip?: string;
  
  // Additional claim details
  referralNumber?: string;         // Referral number
  priorAuthorizationNumber?: string; // Prior authorization number
  
  // Original reference number (for replacements/corrections)
  originalClaimNumber?: string;
  originalClaimDate?: Date;
  
  // Assignment and benefits information
  acceptAssignment?: boolean; // Whether the provider accepts assignment
  benefitsAssignmentCertificationIndicator?: boolean;
  releaseOfInformationCode?: string; // (Y, N, I)
  
  // Related causes (for accident-related claims)
  relatedCauseCode1?: string;  // AA (auto accident), EM (employment), OA (other accident)
  relatedCauseCode2?: string;
  relatedCauseCode3?: string;
  accidentDate?: Date;
  accidentState?: string;
  
  // Patient information overrides
  patientPaidAmount?: number; // Amount paid by patient
}

/**
 * Config object for EDI generation
 */
export interface EDIConfig {
  // Trading partner information
  senderId: string;           // ISA06
  receiverId: string;         // ISA08
  senderQualifier?: string;   // ISA05 (default: ZZ)
  receiverQualifier?: string; // ISA07 (default: ZZ)
  
  // Identifiers
  interchangeControlNumber?: string; // ISA13
  groupControlNumber?: string;       // GS06
  transactionControlNumber?: string; // ST02
  
  // Version information
  versionNumber?: string;      // Version number for GS08
  
  // Billing provider information
  providerInfo: {
    npi: string;              // Billing provider NPI
    taxonomyCode?: string;    // Billing provider taxonomy code
    taxId: string;            // Billing provider tax ID (EIN/SSN)
    taxIdType: 'EIN' | 'SSN'; // Tax ID type
    name: string;             // Billing provider name or organization
    firstName?: string;       // For individual providers
    lastName?: string;        // For individual providers
    address1: string;         // Street address
    address2?: string;        // Additional address info
    city: string;             // City
    state: string;            // State/Province code
    zip: string;              // Postal code
    phone?: string;           // Provider phone
    email?: string;           // Provider email
    // Additional fields needed for generator
    organizationName?: string; // Organization name for EDI segments
    contactName?: string;     // Contact name for PER segments
    contactPhone?: string;    // Contact phone for PER segments
  };
  
  // Pay-to provider (if different from billing)
  payToInfo?: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    npi?: string;
  };
  
  // Default values
  submitterName?: string;     // Default submitter name
  defaultPlaceOfService?: string; // Default place of service code
  
  // Test indicators
  isProduction?: boolean;     // False for test transactions
  
  // Service facility information
  serviceFacility?: {
    name: string;             // Service facility name
    npi: string;              // Service facility NPI
    address1: string;         // Street address
    address2?: string;        // Additional address info
    city: string;             // City
    state: string;            // State/Province code
    zip: string;              // Postal code
  };
}

/**
 * Type to represent an EDI file and its metadata
 */
export interface EDIFile {
  content: string;            // The EDI file content
  filename: string;           // Generated filename
  claimId: string;            // Original claim ID
  generatedAt: Date;          // Generation timestamp
  controlNumber: string;      // ISA control number for tracking
}
