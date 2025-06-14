import { Claim, ClaimLine, InsurancePlan, Report, Biomarker } from '@prisma/client';

// Local type definitions since these aren't in Prisma client
interface ProviderInfo {
  npi: string;
  taxId: string;
  lastName: string;
  firstName?: string;
  middleName?: string;
  suffix?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  taxonomy?: string;
}

interface BillingInfo {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  taxId?: string;
}

interface FacilityInfo {
  name: string;
  npi?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
}
import { logger } from "@/lib/logger";
import { ClaimStatus } from "./processor";
import { generateBloodTestCPTCodes, mapBiomarkersToDiagnoses, checkForAbnormalValues } from './bloodTestCoding';

// Define interfaces for enhanced claim handling
export interface EnhancedClaim extends Omit<Claim, 'status' | 'placeOfService' | 'claimNumber' | 'serviceDate'> {
  // Override status to be string for flexibility
  status: string;
  
  // Service dates (required for EDI)
  serviceDate: Date;
  serviceStartDate: Date;
  serviceEndDate: Date;
  
  // Patient information (extended from base Claim)
  patientFirstName: string;
  patientLastName: string;
  patientDob: Date;
  patientGender: string;
  patientAddress: string;
  patientCity: string;
  patientState: string;
  patientZip: string;
  patientPhone?: string;
  
  // Provider information (extended from base Claim)
  provider: string;
  providerNpi: string;
  providerTaxId: string;
  providerAddress: string;
  providerCity: string;
  providerState: string;
  providerZip: string;
  providerPhone?: string;
  providerTaxonId?: string;
  
  // Insurance information (required for EDI)
  memberId: string;
  groupNumber: string;
  groupName: string;
  relationshipCode: string;
  
  // Claim information
  controlNumber?: string;
  placeOfService: string;
  claimNumber: string;
  totalCharge: number;
  
  // Relationships (extended from base Claim)
  claimLines: Array<ClaimLine & {
    charge: number;
    serviceDate: Date;
    diagnosisPointers?: string;
  }>;
  
  insurancePlan?: InsurancePlan & {
    groupName?: string;
    [key: string]: any;
  };
  
  report?: Report & { biomarkers?: Biomarker[] };
  
  // Extended properties for EDI generation
  providerInfo?: ProviderInfo;
  billingInfo?: BillingInfo;
  serviceFacilityInfo?: FacilityInfo;
  referringProvider?: ProviderInfo;
  renderingProvider?: ProviderInfo;
  serviceFacilityLocationInfo?: FacilityInfo;
}

interface SyntheticClaimLine {
  cptCode: string;
  description: string;
  charge: number;
  units: number;
  serviceDate: Date;
  diagnosisCodes: string[];
  diagnosisPointers?: string;
}

/**
 * EDI837 Generator class for generating EDI 837 Health Care Claim files
 * Enhanced for blood test claims processing
 */
export class EDI837Generator {
  /**
   * Generate EDI 837 content
   * @param claim Claim data with claim lines and insurance plan
   * @returns EDI 837 content string
   */
  generate(claim: EnhancedClaim): Promise<string> {
    return this.generateEDI(claim);
  }

  /**
   * Generate EDI content from a claim
   * 
   * @param claim The claim to generate EDI for, including claim lines and insurance plan
   * @param report Optional report data with biomarkers for enhanced CPT and diagnosis code generation
   * @returns EDI content as a string
   */
  /**
   * Validates required fields in the claim object
   * @param claim The claim to validate
   * @throws Error if required fields are missing or invalid
   */
  /**
   * Validates that all required fields are present in the claim
   * @param claim The claim to validate
   * @throws Error if required fields are missing
   */
  private validateClaim(claim: EnhancedClaim): void {
    const requiredFields = [
      'id',
      'patientFirstName',
      'patientLastName',
      'patientDob',
      'patientGender',
      'providerNpi',
      'providerTaxId',
      'serviceDate',
      'totalCharge',
      'claimLines',
      'memberId',
      'groupNumber',
      'relationshipCode'
    ] as const;

    const missingFields = requiredFields.filter(field => {
      const value = claim[field as keyof EnhancedClaim];
      return value === undefined || value === null || value === '';
    });
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate claim lines
    if (claim.claimLines && claim.claimLines.length > 0) {
      claim.claimLines.forEach((line, index) => {
        const serviceLine = line as ClaimLine & { charge: number; serviceDate: Date };
        
        if (!serviceLine.cptCode) {
          throw new Error(`Missing CPT code in claim line ${index + 1}`);
        }
        if (serviceLine.charge === undefined || serviceLine.charge === null) {
          throw new Error(`Missing charge in claim line ${index + 1}`);
        }
        if (!serviceLine.serviceDate) {
          throw new Error(`Missing service date in claim line ${index + 1}`);
        }
      });
    } else {
      throw new Error('At least one claim line is required');
    }
  }

  /**
   * Generates provider information segments
   */
  private generateProviderSegments(
    providerInfo: {
      npi: string;
      taxId: string;
      lastName: string;
      firstName?: string;
      middleName?: string;
      suffix?: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zip: string;
      phone?: string;
      taxonId?: string;
    },
    segments: string[]
  ): void {
    // Billing Provider Name
    segments.push(
      `NM1*85*2*${providerInfo.lastName}*${providerInfo.firstName || ''}*${providerInfo.middleName || ''}*${providerInfo.suffix || ''}**34*${providerInfo.npi}~`
    );

    // Billing Provider Address
    const addressLine2 = providerInfo.address2 ? `*${providerInfo.address2}` : '';
    segments.push(
      `N3*${providerInfo.address1}${addressLine2}~`
    );

    // Billing Provider City/State/Zip
    segments.push(
      `N4*${providerInfo.city}*${providerInfo.state}*${providerInfo.zip}*US~`
    );

    // Billing Provider Tax ID
    if (providerInfo.taxId) {
      segments.push(
        `REF*EI*${providerInfo.taxId}~`
      );
    }

    // Billing Provider Taxonomy Code
    if (providerInfo.taxonId) {
      segments.push(
        `REF*0B*${providerInfo.taxonId}~`
      );
    }

    // Billing Provider Contact Information
    if (providerInfo.phone) {
      segments.push(
        `PER*IC*${providerInfo.lastName}*TE*${providerInfo.phone}~`
      );
    }
  }

  /**
   * Generates subscriber information segments
   */
  private generateSubscriberSegments(
    subscriberInfo: {
      id: string;
      lastName: string;
      firstName: string;
      middleName?: string;
      suffix?: string;
      dob: string;
      gender: string;
      address1: string;
      address2?: string;
      city: string;
      state: string;
      zip: string;
      phone?: string;
      groupNumber?: string;
      groupName?: string;
      relationshipCode?: string;
    },
    segments: string[]
  ): void {
    // Subscriber Name
    segments.push(
      `NM1*IL*1*${subscriberInfo.lastName}*${subscriberInfo.firstName}*${subscriberInfo.middleName || ''}*${subscriberInfo.suffix || ''}**MI*${subscriberInfo.id}~`
    );

    // Subscriber Address
    const addressLine2 = subscriberInfo.address2 ? `*${subscriberInfo.address2}` : '';
    segments.push(
      `N3*${subscriberInfo.address1}${addressLine2}~`
    );

    // Subscriber City/State/Zip
    segments.push(
      `N4*${subscriberInfo.city}*${subscriberInfo.state}*${subscriberInfo.zip}*US~`
    );

    // Subscriber Demographic Information
    segments.push(
      `DMG*D8*${this.formatDate(new Date(subscriberInfo.dob))}*${subscriberInfo.gender}~`
    );

    // Subscriber Secondary Identification (if group number exists)
    if (subscriberInfo.groupNumber) {
      segments.push(
        `REF*6P*${subscriberInfo.groupNumber}~`
      );
    }

    // Subscriber Contact Information
    if (subscriberInfo.phone) {
      segments.push(
        `PER*IP*${subscriberInfo.lastName}*TE*${subscriberInfo.phone}~`
      );
    }
  }

  /**
   * Format a date in YYYYMMDD format
   */
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  /**
   * Format a time in HHMM format
   */
  private formatTime(date: Date): string {
    // Return time in HHMM format (4 digits)
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}${minutes}`;
  }

  /**
   * Generate a random control number
   */
  private generateControlNumber(): string {
    return Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  }

  /**
   * Generates service line segments (LX, SV1, DTP, REF, etc.)
   * @param claim The claim data
   * @param segments Array to add segments to
   */
  private generateServiceLineSegments(claim: EnhancedClaim, segments: string[]): void {
    if (!claim.claimLines || claim.claimLines.length === 0) {
      return;
    }

    claim.claimLines.forEach((line, index) => {
      const lineNumber = index + 1;
      const serviceLine = line as ClaimLine & { charge: number; serviceDate: Date };
      
      // LX Segment (Service Line Number)
      segments.push(`LX*${lineNumber}~`);
      
      // SV1 Segment (Professional Service)
      const sv1Segments = [
        'SV1',
        'HC:' + (serviceLine.cptCode || '99213'),  // Default to 99213 if no CPT code
        serviceLine.charge ? serviceLine.charge.toFixed(2) : '0.00',
        'UN',  // Unit (Units)
        '1',   // Quantity
        '',    // Not used
        '1',   // Modifier (if any)
        '',    // Not used
        'N',   // Emergency indicator (No)
        ''     // Not used
      ];
      segments.push(sv1Segments.join('*') + '~');
      
      // DTP Segment (Service Date)
      const serviceDate = serviceLine.serviceDate || claim.serviceDate;
      if (serviceDate) {
        segments.push(`DTP*472*D8*${this.formatDate(serviceDate)}~`);
      }
      
      // REF Segment (Line Item Control Number) if available
      if (serviceLine.id) {
        segments.push(`REF*6R*${serviceLine.id}~`);
      }
      
      // Add diagnosis code pointers if available
      if (serviceLine.icd10Codes && Array.isArray(serviceLine.icd10Codes)) {
        const diagnosisPointers = serviceLine.icd10Codes
          .map((code, idx) => (code ? (idx + 1).toString() : ''))
          .filter(Boolean)
          .join('');
          
        if (diagnosisPointers) {
          segments.push(
            `REF*EW*${diagnosisPointers}~`
          );
        }
      }
    });
  }



  /**
   * Generates trailer segments (SE, GE, IEA)
   */
  private generateTrailerSegments(segments: string[], controlNumber: string): void {
    // SE Segment (Transaction Set Trailer)
    segments.push(
      `SE*${segments.length + 3}*${controlNumber}`  // +3 to account for SE, GE, and IEA segments
    );

    // GE Segment (Functional Group Trailer)
    segments.push(
      `GE*1*${controlNumber}`
    );

    // IEA Segment (Interchange Control Trailer)
    segments.push(
      `IEA*1*${controlNumber.padStart(9, '0')}`
    );
  }

  /**
   * Generates header segments (ISA, GS, ST, BHT)
   * @param claim The claim data
   * @param segments Array to add segments to
   * @param controlNumber The control number to use
   * @param transactionDate The transaction date to use
   */
  private generateHeaderSegments(
    claim: EnhancedClaim,
    segments: string[],
    controlNumber: string,
    transactionDate: Date
  ): void {
    // ISA Segment (Interchange Control Header)
    segments.push(
      `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *${this.formatDate(transactionDate)}*${this.formatTime(transactionDate)}*^*00501*${controlNumber.padStart(9, '0')}*0*P*:`
    );

    // GS Segment (Functional Group Header)
    segments.push(
      `GS*HC*SENDER*RECEIVER*${this.formatDate(transactionDate)}*${this.formatTime(transactionDate)}*${controlNumber}*X*005010X222A1`
    );

    // ST Segment (Transaction Set Header)
    segments.push(
      `ST*837*0001*005010X222A1`
    );

    // BHT Segment (Beginning of Hierarchical Transaction)
    segments.push(
      `BHT*0019*00*${controlNumber}*${this.formatDate(transactionDate)}*${this.formatTime(transactionDate)}*CH`
    );
  }

  /**
   * Generates claim information segments (HL, CLM, DTP, REF, etc.)
   * @param claim The claim data
   * @param segments Array to add segments to
   */
  private generateClaimSegments(claim: EnhancedClaim, segments: string[]): void {
    // HL Segment (Hierarchical Level - Claim)
    segments.push('HL*1**20*1');
    
    // CLM Segment (Claim Information)
    const claimNumber = claim.claimNumber || `test-claim-${claim.id?.substring(0, 8) || '123'}`;
    const clmSegments = [
      'CLM',
      claimNumber,                    // Claim ID
      claim.totalCharge.toFixed(2),   // Total charge
      'HC:93000',                     // Health care service location
      '11',                           // Facility type code (Office)
      '1',                            // Claim frequency code (Original)
      'Y',                            // Provider accepts assignment
      'Y',                            // Benefits assigned
      'Y',                            // Release of information
      'Y'                             // Assignment of benefits
    ];
    
    segments.push(clmSegments.join('*'));

    // DTP Segment (Date - Service Date)
    segments.push(
      `DTP*472*D8*${this.formatDate(claim.serviceDate)}`
    );

    // REF Segment (Payer Claim Control Number) if available
    if (claim.claimNumber) {
      segments.push(
        `REF*F8*${claim.claimNumber}`
      );
    }
  }

  /**
   * Validate the generated EDI content
   * @param ediContent The generated EDI content
   * @throws Error if the EDI content is invalid
   */
  private validateEdiContent(ediContent: string): void {
    if (!ediContent || typeof ediContent !== 'string') {
      throw new Error('Generated EDI content is empty or invalid');
    }

    // Normalize the content by removing all whitespace and line breaks
    const normalizedContent = ediContent
      .replace(/\s+/g, '')  // Remove all whitespace including newlines
      .replace(/~+/g, '~')  // Replace multiple ~ with single ~
      .replace(/[^~]$/, '$&~');  // Ensure ends with ~


    // Check for required segments
    const requiredSegments = ['ISA', 'GS', 'ST', 'BHT', 'HL', 'NM1', 'CLM', 'SE', 'GE', 'IEA'];
    const missingSegments = requiredSegments.filter(
      segment => !new RegExp(`^${segment}\\*|~${segment}\\*`, 'i').test(normalizedContent)
    );

    if (missingSegments.length > 0) {
      throw new Error(`EDI content is missing required segments: ${missingSegments.join(', ')}`);
    }

    // Validate segment terminators (should end with ~)
    if (!normalizedContent.endsWith('~')) {
      throw new Error('EDI content must end with a segment terminator (~)');
    }
    
    // Check for segments that are empty or malformed
    const segments = normalizedContent.split('~').filter(s => s.trim() !== '');
    const malformedSegments: string[] = [];
    
    for (const segment of segments) {
      // Check for segments that don't have at least one * or are just whitespace
      if (!segment.includes('*')) {
        malformedSegments.push(segment.substring(0, Math.min(20, segment.length)) || '[EMPTY]');
      }
    }
    
    if (malformedSegments.length > 0) {
      console.error('Malformed segments found:', malformedSegments);
      console.error('Full EDI content:', normalizedContent);
      throw new Error(`Found ${malformedSegments.length} malformed segments in EDI content. First few: ${malformedSegments.slice(0, 3).join(', ')}`);
    }
  }

  /**
   * Generate patient segments for institutional claims (HL7 segments)
   * @param claim The claim data
   * @param segments Array to add segments to
   */
  private generatePatientSegments(claim: EnhancedClaim, segments: string[]): void {
    // HL*1*2*22*1~ (Hierarchical Level - Subscriber)
    segments.push('HL*1*2*22*1~');
    
    // PAT*19~ (Patient Information)
    segments.push('PAT*19~');
    
    // NM1*QC*1*DOE*JOHN*B***MI*123456789~ (Patient Name)
    segments.push(
      `NM1*QC*1*${claim.patientLastName || 'DOE'}*${claim.patientFirstName || 'JOHN'}***MI*${claim.memberId || '123456789'}~`
    );
  }


  /**
   * Generate EDI content from a claim
   * 
   * @param claim The claim to generate EDI for, including claim lines and insurance plan
   * @param report Optional report data with biomarkers for enhanced CPT and diagnosis code generation
   * @returns EDI content as a string
   * @throws Error if the claim is invalid or required data is missing
   */
  async generateEDI(claim: EnhancedClaim, report?: Report & { biomarkers?: Biomarker[] }): Promise<string> {
    // Validate the claim first
    this.validateClaim(claim);

    // Initialize segments array
    const segments: string[] = [];
    const controlNumber = claim.controlNumber || this.generateControlNumber();
    const transactionDate = new Date();
    const isInstitutional = claim.placeOfService === '11' || claim.placeOfService === '21'; // Hospital or Inpatient Hospital
    
    try {
      // Generate ISA and GS segments
      this.generateHeaderSegments(claim, segments, controlNumber, transactionDate);
      
      // Generate provider segments with fallback values
      this.generateProviderSegments({
        npi: claim.providerNpi || '1234567893', // Default NPI if not provided
        taxId: claim.providerTaxId || '123456789', // Default TIN if not provided
        lastName: claim.provider?.split(' ').pop() || 'Provider',
        firstName: claim.provider?.split(' ').shift() || 'Unknown',
        address1: claim.providerAddress || '123 Medical Center Dr',
        city: claim.providerCity || 'Anytown',
        state: claim.providerState || 'CA',
        zip: claim.providerZip || '90210',
        phone: claim.providerPhone || '8005551212',
        taxonId: claim.providerTaxonId || '207Q00000X' // Default to Family Practice
      }, segments);

      // Generate subscriber segments with fallback values
      this.generateSubscriberSegments({
        id: claim.memberId,
        lastName: claim.patientLastName,
        firstName: claim.patientFirstName,
        dob: claim.patientDob.toISOString(),
        gender: claim.patientGender,
        address1: claim.patientAddress,
        city: claim.patientCity,
        state: claim.patientState,
        zip: claim.patientZip,
        phone: claim.patientPhone || '',
        groupNumber: claim.groupNumber,
        groupName: claim.groupName,
        relationshipCode: claim.relationshipCode
      }, segments);

      // Generate patient segments if this is an institutional claim
      if (isInstitutional) {
        this.generatePatientSegments(claim, segments);
      }

      // Generate claim information
      this.generateClaimSegments(claim, segments);

      // Generate service line items if they exist
      if (claim.claimLines && claim.claimLines.length > 0) {
        this.generateServiceLineSegments(claim, segments);
      } else {
        logger.warn('No claim lines found for claim', { claimId: claim.id });
      }

      // Generate SE and GE segments
      this.generateTrailerSegments(segments, controlNumber);

      // Join segments with ~ and ensure proper termination
      let ediContent = segments.join('~');
      
      // Ensure the content ends with exactly one ~
      if (!ediContent.endsWith('~')) {
        ediContent += '~';
      }
      
      // Validate the generated EDI content
      this.validateEdiContent(ediContent);
      
      // Return the EDI content with line breaks after each segment for readability
      return ediContent.replace(/~/g, '~\n').trim();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generating EDI 837', { 
        error: errorMessage, 
        claimId: claim.id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to generate EDI 837: ${errorMessage}`);
    }
  }

  /**
   * Generate EDI content from a claim object
   * 
   * @param claim The claim object to generate EDI for
   * @param report Optional report data with biomarkers
   * @returns Promise resolving to EDI content string
   */
  async generateFromClaim(claim: EnhancedClaim, report?: Report & { biomarkers?: Biomarker[] }): Promise<string> {
    return this.generateEDI(claim, report);
  }
  
  /**
   * Generate EDI content from a claim and associated report with biomarkers
   * Specialized for blood test claims with enhanced CPT and diagnosis code generation
   * 
   * @param claim The claim object
   * @param report The report with biomarkers
   * @param insurancePlan Optional insurance plan details
   * @returns Promise resolving to EDI content string
   */
  async generateBloodTestClaim(
    claim: Partial<Claim> & { claimLines?: any[] }, 
    report: Report & { biomarkers?: Biomarker[] },
    insurancePlan?: InsurancePlan
  ): Promise<string> {
    try {
      // Validate required parameters
      if (!claim) {
        throw new Error('Claim data is required');
      }
      
      if (!report) {
        throw new Error('Report data with biomarkers is required');
      }
      
      // If claim doesn't have claim lines or they're empty, generate them from biomarkers
      if (!claim.claimLines || (Array.isArray(claim.claimLines) && claim.claimLines.length === 0)) {
        if (!report.biomarkers || report.biomarkers.length === 0) {
          throw new Error('No biomarkers found in the report');
        }
        
        try {
          // Generate CPT codes from biomarkers
          const cptCodes = generateBloodTestCPTCodes(report.biomarkers.map(b => b.name));
          
          if (!cptCodes || cptCodes.length === 0) {
            throw new Error('Failed to generate CPT codes from biomarkers');
          }
          
          // Generate diagnosis codes from biomarkers
          const diagnosisCodes = mapBiomarkersToDiagnoses(report.biomarkers) || [];
          
          // Check for abnormal values to add additional diagnosis codes
          const abnormalCodes = checkForAbnormalValues(report.biomarkers) || [];
          if (abnormalCodes.length > 0) {
            // Add abnormal codes to diagnosis codes
            diagnosisCodes.push(...abnormalCodes);
          }
          
          // Ensure we have at least one diagnosis code
          if (diagnosisCodes.length === 0) {
            diagnosisCodes.push('R69'); // Default to 'Illness, unspecified' if no diagnosis codes found
          }
          
          // Type assert claim as EnhancedClaim to access EnhancedClaim properties
          const enhancedClaim = claim as unknown as EnhancedClaim;
          
          // Create synthetic claim lines from generated CPT codes
          const syntheticClaimLines = cptCodes.map((cptInfo, index) => ({
            id: `synthetic-${Date.now()}-${index}`,
            claimId: enhancedClaim.id || `claim-${Date.now()}`,
            lineNumber: index + 1,
            cptCode: cptInfo.code,
            description: cptInfo.description,
            charge: cptInfo.charge, // charge is now guaranteed by CPTCode type
            units: 1,
            serviceDate: enhancedClaim.serviceDate || new Date(),
            diagnosisCodes: diagnosisCodes,
            diagnosisPointers: diagnosisCodes.map((_, i) => i + 1).join(":").slice(0, 4),
            icd10Codes: diagnosisCodes, // Add icd10Codes for backward compatibility
            modifier: null, // Required by ClaimLine type
            createdAt: new Date(),
            updatedAt: new Date()
          }));
          
          // Attach synthetic claim lines
          enhancedClaim.claimLines = syntheticClaimLines;
          
          // Update total charge if not already set
          if (typeof enhancedClaim.totalCharge !== 'number') {
            enhancedClaim.totalCharge = syntheticClaimLines.reduce((sum, line) => sum + (line.charge || 0), 0);
          }
          
          // Set default claim status if not provided
          if (!enhancedClaim.status) {
            enhancedClaim.status = 'SUBMITTED';
          }
          
          // Set default service dates if not provided
          const now = new Date();
          if (!enhancedClaim.serviceDate) {
            enhancedClaim.serviceDate = now;
          }
          if (!enhancedClaim.serviceStartDate) {
            enhancedClaim.serviceStartDate = now;
          }
          if (!enhancedClaim.serviceEndDate) {
            enhancedClaim.serviceEndDate = now;
          }
          
          // Add insurance plan if provided
          if (insurancePlan) {
            // Create a new insurance plan object with the required properties
            const enhancedPlan: NonNullable<EnhancedClaim['insurancePlan']> = {
              ...insurancePlan,
              // Ensure required fields have non-null values
              payerName: insurancePlan.payerName || 'Unknown Payer',
              planName: insurancePlan.planName || 'Standard Plan',
              memberId: insurancePlan.memberId || '',
              groupNumber: insurancePlan.groupNumber || '',
              // Add groupName which is not in the base InsurancePlan
              groupName: insurancePlan.groupNumber || ''
            };
            
            // Assign the enhanced plan to the claim
            enhancedClaim.insurancePlan = enhancedPlan;
            
            // Set member ID and group number from insurance plan if not provided
            if (!enhancedClaim.memberId && enhancedPlan.memberId) {
              enhancedClaim.memberId = enhancedPlan.memberId;
            }
            if (!enhancedClaim.groupNumber && enhancedPlan.groupNumber) {
              enhancedClaim.groupNumber = enhancedPlan.groupNumber;
            }
            if (!enhancedClaim.groupName && enhancedPlan.groupName) {
              enhancedClaim.groupName = enhancedPlan.groupName;
            }
          }
        } catch (error) {
          logger.error('Error generating claim lines from biomarkers', { error });
          throw new Error(`Failed to generate claim lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Generate EDI with enhanced claim data
      return this.generateEDI(claim as EnhancedClaim, report);
    } catch (error) {
      logger.error(`Error generating blood test claim EDI: ${error}`);
      throw error;
    }
  }
}
