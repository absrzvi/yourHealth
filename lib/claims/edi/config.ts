/**
 * EDI 837 Configuration Options
 * Based on X12 5010 837P (Professional) implementation guidelines
 */
 
export interface EDIConfig {
  // Trading partner information
  senderId: string;          // ISA06 - Sender ID
  senderQualifier: string;   // ISA05 - Typically "ZZ" for mutually defined
  receiverId: string;        // ISA08 - Receiver ID
  receiverQualifier: string; // ISA07 - Typically "ZZ" for mutually defined
  
  // Transaction information
  interchangeControlNumber: string; // ISA13 - Control number
  groupControlNumber: string;       // GS06 - Group control number
  versionNumber: string;            // GS08 - Typically "005010X222A1" for 837P
  
  // Provider information
  providerInfo: {
    organizationName: string;
    npi: string;              // National Provider Identifier
    taxId: string;            // Federal Tax ID Number
    taxonomyCode: string;     // Provider taxonomy code
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
    };
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  
  // Pay-to address if different from provider
  payToAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  
  // Service facility information
  serviceFacility?: {
    name: string;
    npi: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
    };
  };

  // Default reference identification codes
  referenceIdentification?: {
    originatorId?: string;     // REF*EO
    claimOfficeNumber?: string; // REF*LU
  };
}

/**
 * Default configuration for the EDI generator
 */
export const defaultEDIConfig: EDIConfig = {
  senderId: "FORYOURHEALTH",
  senderQualifier: "ZZ",
  receiverId: "CLEARINGHOUSE",
  receiverQualifier: "ZZ",
  interchangeControlNumber: "000000001",
  groupControlNumber: "1",
  versionNumber: "005010X222A1",
  
  providerInfo: {
    organizationName: "FOR YOUR HEALTH LAB",
    npi: "1234567890",
    taxId: "123456789",
    taxonomyCode: "291U00000X", // Laboratory, Clinical Medical
    address: {
      line1: "123 HEALTH STREET",
      city: "LOS ANGELES",
      state: "CA",
      zip: "90001"
    },
    contactName: "HEALTH ADMIN",
    contactPhone: "5555551234"
  }
};

/**
 * Place of service codes
 */
export const placeOfServiceCodes = {
  "11": "Office",
  "12": "Home",
  "21": "Inpatient Hospital",
  "22": "Outpatient Hospital",
  "23": "Emergency Room - Hospital",
  "24": "Ambulatory Surgical Center",
  "31": "Skilled Nursing Facility",
  "32": "Nursing Facility",
  "81": "Independent Laboratory"
};

/**
 * Claim filing indicator codes
 */
export const claimFilingCodes = {
  "09": "Medicare",
  "11": "Other Non-Federal Programs",
  "12": "Preferred Provider Organization (PPO)",
  "13": "Point of Service (POS)",
  "14": "Exclusive Provider Organization (EPO)",
  "15": "Indemnity Insurance",
  "16": "Health Maintenance Organization (HMO) Medicare Risk",
  "BL": "Blue Cross/Blue Shield",
  "CH": "CHAMPUS",
  "CI": "Commercial Insurance Co.",
  "DS": "Disability",
  "HM": "Health Maintenance Organization",
  "MB": "Medicare Part B",
  "MC": "Medicaid",
  "OF": "Other Federal Program",
  "TV": "Title V",
  "VA": "Veterans Affairs Plan",
  "WC": "Workers' Compensation Health Claim",
  "ZZ": "Mutually Defined"
};

/**
 * Entity identifier codes
 */
export const entityIdentifierCodes = {
  "1P": "Provider",
  "2B": "Third-Party Administrator",
  "36": "Employer",
  "3D": "Patient",
  "40": "Receiver",
  "41": "Submitter",
  "45": "Drop-off Location",
  "71": "Attending Provider",
  "72": "Operating Provider",
  "73": "Other Provider",
  "77": "Service Location",
  "80": "Hospital",
  "82": "Rendering Provider",
  "85": "Billing Provider",
  "87": "Pay-to Provider",
  "DN": "Referring Provider",
  "FA": "Facility",
  "IL": "Insured or Subscriber",
  "PR": "Payer",
  "QC": "Patient"
};

/**
 * Entity type qualifiers
 */
export const entityTypeQualifiers = {
  "1": "Person",
  "2": "Non-Person Entity"
};

/**
 * Identification code qualifiers
 */
export const idCodeQualifiers = {
  "24": "Employer's Identification Number",
  "34": "Social Security Number",
  "46": "Electronic Transmitter Identification Number (ETIN)",
  "XX": "National Provider Identifier (NPI)",
  "MI": "Member Identification Number",
  "ZZ": "Mutually Defined"
};
