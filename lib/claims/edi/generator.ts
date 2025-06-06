import { ClaimLine, Claim, InsurancePlan, User } from '../../../src/lib/claims/types/claims.types';
import { EDIClaim, EDIClaimLine, EDIConfig, EDIFile } from './types';
import { formatEDIDate, formatEDITime, padLeft, padRight, parsePersonName, validateNPI, formatEDIAmount, formatEDIName, generateControlNumber } from './utils';
import { mapClaimToEDIClaim, extractProviderInfo, extractSubscriberInfo, extractDiagnosisCodes } from './mapper';

/**
 * Default configuration for EDI 837 generation
 */
const defaultEDIConfig: EDIConfig = {
  // Trading partner information
  senderId: '9876543210',
  receiverId: '1234567890',
  senderQualifier: 'ZZ',
  receiverQualifier: 'ZZ',
  
  // Control numbers
  interchangeControlNumber: '000000001',
  groupControlNumber: '1',
  transactionControlNumber: '0001',
  
  // Version information for EDI generation
  versionNumber: '005010X222A1',
  
  // Billing provider information
  providerInfo: {
    npi: '1234567890',
    taxId: '123456789',
    taxIdType: 'EIN',
    name: 'YOUR HEALTH MEDICAL GROUP',
    address1: '123 HEALTHCARE BLVD',
    city: 'ANYTOWN',
    state: 'CA',
    zip: '90210',
    phone: '5551234567',
    // Additional provider info for EDI segments
    organizationName: 'YOUR HEALTH MEDICAL GROUP',
    contactName: 'ADMIN CONTACT',
    contactPhone: '5551234567'
  },
  
  // Submitter information
  submitterName: 'YOUR HEALTH CLAIM DEPT',
  
  // Service facility information
  serviceFacility: {
    name: 'YOUR HEALTH CLINIC',
    npi: '9876543210',
    address1: '456 CLINIC WAY',
    city: 'ANYTOWN',
    state: 'CA',
    zip: '90210'
  },
  
  // Default settings
  defaultPlaceOfService: '11', // Office
  
  // Environment settings
  isProduction: false // Default to test mode
};

/**
 * EDI 837 Professional (837P) Generator for healthcare claims
 * Compliant with X12 5010 837P Implementation Guide
 */
export class EDI837Generator {
  private segments: string[] = [];
  private segmentCount = 0;
  private transactionDate: string;
  private transactionTime: string;
  private controlNumber: string;
  private config: EDIConfig;
  private submissionErrors: string[] = [];

  constructor(customConfig?: Partial<EDIConfig>) {
    this.config = { ...defaultEDIConfig, ...customConfig };
    this.controlNumber = generateControlNumber();
    const now = new Date();
    this.transactionDate = formatEDIDate(now);
    this.transactionTime = formatEDITime(now);
  }

  generateFromClaim(claim: Claim & {
    user: User;
    insurancePlan: InsurancePlan;
    claimLines: ClaimLine[];
  }): string {
    this.segments = [];
    this.segmentCount = 0;

    // Add all required segments in order
    this.addISA();
    this.addGS();
    this.addST();
    this.addBHT(claim.claimNumber);
    this.addSubmitterName();
    this.addReceiverName();
    this.addBillingProvider(claim);
    this.addSubscriber(claim);
    this.addPatient(claim);
    this.addClaimInformation(claim);
    this.addServiceLines(claim);
    this.addSE();
    this.addGE();
    this.addIEA();

    return this.segments.join("");
  }

  private addISA() {
    const dateStr = this.transactionDate.slice(2);
    const timeStr = this.transactionTime;

    this.addSegment([
      "ISA",
      "00",
      "          ",
      "00",
      "          ",
      this.config.senderQualifier || "ZZ",
      padRight(this.config.senderId, 15),
      this.config.receiverQualifier || "ZZ",
      padRight(this.config.receiverId, 15),
      dateStr,
      timeStr,
      "^",
      "00501",
      this.config.interchangeControlNumber || "000000001",
      "0",
      "P",
      ":"
    ]);
  }

  private addGS() {
    const dateStr = this.transactionDate;
    const timeStr = this.transactionTime;

    this.addSegment([
      "GS",
      "HC",
      this.config.senderId,
      this.config.receiverId,
      dateStr,
      timeStr,
      this.config.groupControlNumber || "1",
      "X",
      this.config.versionNumber || "005010X222A1"
    ]);
  }

  private addST() {
    this.addSegment(["ST", "837", "0001", "005010X222A1"]);
  }

  private addBHT(claimNumber: string) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = date.toTimeString().slice(0, 4).replace(":", "");

    this.addSegment([
      "BHT",
      "0019",
      "00",
      claimNumber,
      dateStr,
      timeStr,
      "CH"
    ]);
  }

  private addSubmitterName() {
    const orgName = this.config.providerInfo.organizationName || this.config.providerInfo.name;
    
    this.addSegment([
      "NM1",
      "41",
      "2",
      formatEDIName(orgName),
      "",
      "",
      "",
      "",
      "46",
      this.config.senderId
    ]);
  }

  private addReceiverName() {
    this.addSegment([
      "NM1",
      "40",
      "2",
      "CLEARINGHOUSE", // Using a generic name as the receiver is typically a clearinghouse
      "",
      "",
      "",
      "",
      "46",
      this.config.receiverId
    ]);
  }

  private addBillingProvider(claim: any) {
    // Loop 2000A - Billing Provider
    this.addSegment(["HL", "1", "", "20", "1"]);

    // Loop 2010AA - Billing Provider Name
    const orgName = this.config.providerInfo.organizationName || this.config.providerInfo.name;
    this.addSegment([
      "NM1",
      "85", // Billing Provider
      "2",  // Non-Person Entity
      formatEDIName(orgName),
      "", // Not used for non-person
      "", // Not used for non-person
      "", // Not used for non-person
      "", // Not used for non-person
      "XX", // NPI Qualifier
      this.config.providerInfo.npi
    ]);

    // Loop 2010AA - Billing Provider Address
    this.addSegment([
      "N3", 
      this.config.providerInfo.address1
    ]);

    // Loop 2010AA - Billing Provider City, State, ZIP Code
    this.addSegment([
      "N4",
      this.config.providerInfo.city,
      this.config.providerInfo.state,
      this.config.providerInfo.zip
    ]);

    // Loop 2010AA - Billing Provider Tax Identification
    this.addSegment([
      "REF",
      this.config.providerInfo.taxIdType === "EIN" ? "EI" : "SY",
      this.config.providerInfo.taxId
    ]);

    // Loop 2010AA - Billing Provider Contact Information
    const contactName = this.config.providerInfo.contactName || "CONTACT";
    const contactPhone = this.config.providerInfo.contactPhone || this.config.providerInfo.phone || "";
    
    this.addSegment([
      "PER",
      "IC",
      contactName,
      "TE",
      contactPhone
    ]);
  }

  private addSubscriber(claim: any) {
    // Loop 2000B - Subscriber
    this.addSegment(["HL", "2", "1", "22", "0"]);
    
    // SBR - Subscriber Information
    this.addSegment([
      "SBR", // Subscriber Information
      "P",   // Primary (or S for Secondary)
      "",    // Individual relationship code
      claim.insurancePlan.groupNumber || "", // Policy/Group Number
      "",    // Group Name
      "",    // Insurance Type Code
      "",    // Claim Filing Indicator Code
      "",    // Employment Status Code
      ""     // Student Status Code
    ]);

    // Loop 2010BA - Subscriber Name
    const user = claim.user;
    const nameInfo = parsePersonName(user.name);
    
    this.addSegment([
      "NM1", // Name segment
      "IL",  // Insured or Subscriber
      "1",   // Person
      formatEDIName(nameInfo.lastName) || "DOE", // Last name
      formatEDIName(nameInfo.firstName) || "JOHN", // First name
      formatEDIName(nameInfo.middleName) || "", // Middle name
      "",    // Name prefix
      "",    // Name suffix
      "MI",  // Member ID qualifier
      claim.insurancePlan.memberId // Member ID
    ]);

    // Subscriber Address - would use real address in production
    this.addSegment([
      "N3",
      "123 MAIN STREET"
    ]);

    this.addSegment([
      "N4",
      "ANYTOWN",
      "NY",
      "10001"
    ]);

    // Subscriber Demographics
    // Placeholder for birth date and gender
    // In production, would use actual user data
    const birthDate = "19800101"; // YYYYMMDD format
    const gender = "M"; // M or F
    
    this.addSegment([
      "DMG",
      "D8",   // Date format qualifier
      birthDate,
      gender
    ]);

    // Subscriber relationship to patient
    // This would be different if patient is not the subscriber
    this.addSegment([
      "REF",
      "SY",  // Social Security Number
      "123456789" // Would be actual SSN in production
    ]);
  }

  private addPatient(claim: any) {
    // For self, patient is usually same as subscriber in this application
    // But let's support patients different from the subscriber for completeness
    const patient = claim.patient || claim.user; // Default to user if no separate patient
    const patientIsSubscriber = !claim.patient || claim.patient.id === claim.user.id;
    
    // Only add patient segments if patient is different from subscriber
    if (!patientIsSubscriber) {
      // Loop 2000C - Patient Hierarchy Level
      this.addSegment([
        "HL",
        "3",    // Hierarchical ID Number
        "2",    // Parent (Subscriber)
        "23",   // Patient
        "0"     // No child segments
      ]);
      
      // Patient Relationship to Insured
      this.addSegment([
        "PAT",
        "01",   // Patient Relationship Code (01=Spouse, 19=Child, etc.)
        "",     // Not used
        "",     // Not used
        "",     // Not used
        "",     // Not used
        "",     // Not used
        "",     // Not used
        "",     // Not used
        "Y"     // Release of Information Code
      ]);
      
      // Loop 2010CA - Patient Name
      const nameInfo = parsePersonName(patient.name);
      
      this.addSegment([
        "NM1",
        "QC",   // Patient
        "1",    // Person
        formatEDIName(nameInfo.lastName) || "DOE", // Last name
        formatEDIName(nameInfo.firstName) || "JANE", // First name
        formatEDIName(nameInfo.middleName) || "", // Middle name
        "",     // Name prefix
        "",     // Name suffix
        "",     // ID qualifier (blank for patient)
        ""      // ID (blank for patient)
      ]);
      
      // Patient Address
      this.addSegment([
        "N3",
        "123 MAIN STREET" // Would use actual patient address in production
      ]);
      
      this.addSegment([
        "N4",
        "ANYTOWN",
        "NY",
        "10001"
      ]);
      
      // Patient Demographics
      // Placeholder for birth date and gender
      const birthDate = "19900101"; // YYYYMMDD format (would use real patient DOB in production)
      const gender = "F"; // M or F (would use real patient gender in production)
      
      this.addSegment([
        "DMG",
        "D8",   // Date format qualifier
        birthDate,
        gender
      ]);
    }
  }

  private addClaimInformation(claim: any) {
    // Loop 2300 - Claim Information
    // Format: CLM01: Claim Number, CLM02: Total Charge, CLM05: Place of Service and Facility Code
    const placeOfService = claim.placeOfService || "11"; // Default to office
    const facilityCodeQual = "B"; // B = Encounter institutional UB claim
    const frequencyCode = "1"; // 1 = Original claim
    
    this.addSegment([
      "CLM",
      claim.claimNumber,
      formatEDIAmount(claim.totalCharge),
      "", // Not used
      "", // Not used
      `${placeOfService}:${facilityCodeQual}:${frequencyCode}`,
      "Y", // Provider signature on file
      "A", // Assignment of benefits
      "Y", // Release of information
      "Y"  // Benefit assignment
    ]);

    // Reference Identification (optional additional claim identifiers)
    if (claim.referralNumber) {
      this.addSegment([
        "REF",
        "9F", // Referral Number
        claim.referralNumber
      ]);
    }
    
    if (claim.priorAuthNumber) {
      this.addSegment([
        "REF",
        "G1", // Prior Authorization Number
        claim.priorAuthNumber
      ]);
    }

    // Date of service for the claim
    const serviceDate = claim.serviceDate ? formatEDIDate(claim.serviceDate) : formatEDIDate(new Date());
    this.addSegment([
      "DTP",
      "472", // Service Date
      "D8",  // Date format
      serviceDate
    ]);
    
    // If there's onset date for chronic conditions
    if (claim.onsetDate) {
      this.addSegment([
        "DTP",
        "431", // Onset Date
        "D8",  // Date format
        formatEDIDate(claim.onsetDate)
      ]);
    }

    // Add diagnosis codes
    const diagnoses = this.extractDiagnosisCodes(claim);
    if (diagnoses.length > 0) {
      const hiSegment = ["HI"];
      diagnoses.forEach((code, index) => {
        // ABK for primary diagnosis, ABF for additional diagnoses
        // ICD-10 qualifier is BK for primary, BF for others
        hiSegment.push(`${index === 0 ? "ABK" : "ABF"}:${code}`);
      });
      this.addSegment(hiSegment);
    } else {
      // Reporting at least one diagnosis code is required
      this.submissionErrors.push("No diagnosis codes found for claim");
    }
    
    // Referring Provider (if available)
    if (claim.referringProviderNpi) {
      // Loop 2310A - Referring Provider
      this.addSegment([
        "NM1",
        "DN", // Referring Provider
        "1",  // Person
        "DOE", // Last Name (example) - would use actual referring provider name
        "JOHN", // First Name - would use actual referring provider name
        "",    // Middle Name
        "",    // Prefix
        "",    // Suffix
        "XX",  // NPI Qualifier
        claim.referringProviderNpi // NPI
      ]);
    }
    
    // Rendering Provider (if different from billing provider)
    if (claim.renderingProviderNpi && claim.renderingProviderNpi !== this.config.providerInfo.npi) {
      // Loop 2310B - Rendering Provider
      this.addSegment([
        "NM1",
        "82", // Rendering Provider
        "1",  // Person
        claim.renderingProviderLastName || "DOE", // Last Name
        claim.renderingProviderFirstName || "JANE", // First Name
        "",   // Middle Name
        "",   // Prefix
        "",   // Suffix
        "XX", // NPI Qualifier
        claim.renderingProviderNpi // NPI
      ]);
    }
    
    // Service Facility Location (if applicable)
    if (this.config.serviceFacility && this.config.serviceFacility.npi) {
      // Loop 2310C - Service Facility Location
      this.addSegment([
        "NM1",
        "77", // Service Facility
        "2",  // Non-Person
        formatEDIName(this.config.serviceFacility.name), // Facility Name
        "",   // Not used for non-person
        "",   // Not used for non-person
        "",   // Not used for non-person
        "",   // Not used for non-person
        "XX", // NPI Qualifier
        this.config.serviceFacility.npi // Facility NPI
      ]);
      
      // Facility Address
      this.addSegment([
        "N3",
        formatEDIName(this.config.serviceFacility.address1),
        this.config.serviceFacility.address2 || ""
      ]);
      
      this.addSegment([
        "N4",
        formatEDIName(this.config.serviceFacility.city),
        this.config.serviceFacility.state,
        this.config.serviceFacility.zip
      ]);
    }
  }

  private addServiceLines(claim: any) {
    if (claim.claimLines && Array.isArray(claim.claimLines)) {
      claim.claimLines.forEach((line: any, index: number) => {
        const lineNum = (index + 1).toString();
        
        // Service Line Number
        this.addSegment([
          "LX",
          lineNum
        ]);
        
        // Professional Service
        let procedureCodeComposite = [line.procedureCode];
        if (line.procedureModifiers && Array.isArray(line.procedureModifiers)) {
          procedureCodeComposite = [line.procedureCode, ...line.procedureModifiers.slice(0, 4)];
        }
        
        this.addSegment([
          "SV1",
          procedureCodeComposite.join(":"),
          formatEDIAmount(line.charge || 0),
          "UN", // Units qualifier
          (line.units || 1).toString(), // Units of service
          claim.placeOfService || this.config.defaultPlaceOfService || "11", // Default to office
          "", // Not used
          "", // Not used
          "1" // Default to first diagnosis code pointer since diagnosisCodePointers is not in ClaimLine
        ]);
  
        // Date of service
        const serviceDate = line.serviceDate || new Date();
        const serviceDateStr = formatEDIDate(serviceDate);
        
        // Date Range (single date)
        this.addSegment([
          "DTP",
          "472", // Service Date
          "D8",  // Date format qualifier
          serviceDateStr
        ]);
        
        // Line Item Control Number
        this.addSegment([
          "REF",
          "6R", // Line Item Control Number
          `${claim.claimNumber || "CLM"}${index + 1}`.substring(0, 50)
        ]);
  
        // Rendering Provider at service line level (if different from claim level)
        if (line.renderingProviderNpi) {
          this.addSegment([
            "NM1",
            "82", // Rendering Provider
            "1",  // Person
            "DOE", // Default Last Name - would come from provider directory in real system 
            "JANE", // Default First Name - would come from provider directory in real system
            "",   // Middle Name
            "",   // Prefix
            "",   // Suffix
            "XX", // NPI Qualifier
            line.renderingProviderNpi // NPI - this is in our ClaimLine interface
          ]);
        }
      });
    }
  }

  private addSE() {
    this.addSegment(["SE", (this.segmentCount + 1).toString(), "0001"]);
  }

  private addGE() {
    this.addSegment(["GE", "1", "1"]);
  }

  private addIEA() {
    this.addSegment(["IEA", "1", "000000001"]);
  }

  private addSegment(elements: string[]) {
    this.segments.push(elements.join("*") + "~\n");
    this.segmentCount++;
  }

  // Helper methods already imported from utils.ts
  private extractDiagnosisCodes(claim: any): string[] {
    const codes = new Set<string>();
    if (claim.claimLines && Array.isArray(claim.claimLines)) {
      claim.claimLines.forEach((line: any) => {
        if (line.icd10Codes && Array.isArray(line.icd10Codes)) {
          line.icd10Codes.forEach((code: string) => codes.add(code));
        }
      });
    }
    return Array.from(codes).slice(0, 12); // Max 12 diagnosis codes
  }
} 