import { Claim, ClaimLine, InsurancePlan, Report, Biomarker } from '@prisma/client';
import { logger } from "@/lib/logger";
import { ClaimStatus } from "./processor";
import { generateBloodTestCPTCodes, mapBiomarkersToDiagnoses, checkForAbnormalValues } from './bloodTestCoding';

// Define interfaces for enhanced claim handling
interface EnhancedClaim extends Claim {
  claimLines?: ClaimLine[];
  insurancePlan?: InsurancePlan;
  report?: Report & { biomarkers?: Biomarker[] };
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
  async generateEDI(claim: EnhancedClaim, report?: Report & { biomarkers?: Biomarker[] }): Promise<string> {
    // In production, this would be a full EDI 837 generator
    // For now, we'll generate a simplified EDI format with key claim data
    
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10).replace(/-/g, "");
    const formattedTime = now.toISOString().slice(11, 19).replace(/:/g, "");
    const controlNumber = Math.floor(Math.random() * 1000000000).toString().padStart(9, "0");
    
    // Generate header segments
    const segments = [
      // ISA - Interchange Control Header
      `ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *${formattedDate}*${formattedTime}*^*00501*${controlNumber}*0*P*:~`,
      // GS - Functional Group Header
      `GS*HC*SENDER*RECEIVER*${formattedDate}*${formattedTime}*${controlNumber}*X*005010X222A1~`,
      // ST - Transaction Set Header
      `ST*837*0001*005010X222A1~`,
      // BHT - Beginning of Hierarchical Transaction
      `BHT*0019*00*${controlNumber}*${formattedDate}*${formattedTime}*CH~`,
    ];
    
    // Add submitter/receiver information
    segments.push(
      // Submitter loop
      `NM1*41*2*SUBMITTER NAME*****46*TIN~`,
      `PER*IC*CONTACT NAME*TE*5551234567~`,
      // Receiver loop
      `NM1*40*2*RECEIVER NAME*****46*RECEIVER ID~`
    );
    
    // Add billing provider information
    segments.push(
      // Billing provider hierarchical level
      `HL*1**20*1~`,
      `NM1*85*2*${claim.provider || "UNKNOWN PROVIDER"}*****XX*${claim.providerId || "0000000000"}~`,
      `N3*${claim.providerAddress || "123 Main St"}~`,
      `N4*${claim.providerCity || "ANYTOWN"}*${claim.providerState || "ST"}*${claim.providerZip || "00000"}~`
    );
    
    // Add subscriber information
    segments.push(
      // Subscriber hierarchical level
      `HL*2*1*22*0~`,
      `SBR*P*${claim.relationshipCode || "18"}**${claim.insurancePlan?.name || "UNKNOWN PLAN"}~`,
      `NM1*IL*1*${claim.patientLastName || "DOE"}*${claim.patientFirstName || "JOHN"}****MI*${claim.memberId || "ID00000000"}~`,
      `N3*${claim.patientAddress || "456 Patient St"}~`,
      `N4*${claim.patientCity || "ANYTOWN"}*${claim.patientState || "ST"}*${claim.patientZip || "00000"}~`,
      `DMG*D8*${claim.patientDob?.toISOString().slice(0, 10).replace(/-/g, "") || "19800101"}*${claim.patientGender || "M"}~`
    );
    
    // Add payer information
    segments.push(
      `NM1*PR*2*${claim.insurancePlan?.name || "UNKNOWN PAYER"}*****PI*${claim.insurancePlan?.payerId || "00000"}~`
    );
    
    // Add claim information
    segments.push(
      // Claim information
      `CLM*${claim.claimNumber || claim.id}*${claim.totalCharge?.toFixed(2) || "0.00"}***${claim.placeOfService || "11"}*Y*A*Y*Y~`,
      // HIPAA claim filing indicator
      `REF*F8*${claim.controlNumber || controlNumber}~`
    );
    
    // Add diagnosis codes
    let diagnosisCodes: string[] = [];
    
    // Extract diagnosis codes from claim lines
    if (claim.claimLines && Array.isArray(claim.claimLines)) {
      claim.claimLines.forEach((line: any) => {
        if (line.diagnosisCodes && Array.isArray(line.diagnosisCodes)) {
          diagnosisCodes = [...diagnosisCodes, ...line.diagnosisCodes];
        }
      });
    }
    
    // If we have report biomarkers, use them to enhance diagnosis codes
    if (report?.biomarkers && report.biomarkers.length > 0) {
      try {
        const biomarkerDiagnoses = mapBiomarkersToDiagnoses(report.biomarkers);
        diagnosisCodes = [...new Set([...diagnosisCodes, ...biomarkerDiagnoses])];
      } catch (error) {
        logger.error(`Error mapping biomarkers to diagnoses: ${error}`);
      }
    }
    
    // If no diagnosis codes found, add a default one
    if (diagnosisCodes.length === 0) {
      diagnosisCodes = ['Z00.00']; // General health examination
    }
    
    // Add unique diagnosis codes (up to 12, which is the EDI 837 limit)
    const uniqueDiagnoses = [...new Set(diagnosisCodes)].slice(0, 12);
    
    // Add diagnosis pointers
    uniqueDiagnoses.forEach((code, index) => {
      segments.push(`HI*BK:${code}*${index > 0 ? `BF:${uniqueDiagnoses[index]}` : ''}~`);
    });
    
    // Add claim service lines (if available)
    if (claim.claimLines && Array.isArray(claim.claimLines)) {
      claim.claimLines.forEach((line, index: number) => {
        const lineNumber = index + 1;
        const serviceDate = line.serviceDate?.toISOString().slice(0, 10).replace(/-/g, "") || formattedDate;
        
        // Generate diagnosis pointers
        let diagnosisPointers = line.diagnosisPointers || "1";
        
        // If we have multiple diagnosis codes, create pointers (e.g., "1:2:3:4")
        if (uniqueDiagnoses.length > 1) {
          // For blood tests, typically all diagnoses apply to all lines
          diagnosisPointers = uniqueDiagnoses.map((_, i) => i + 1).join(":");
        }
        
        segments.push(
          // Service line
          `LX*${lineNumber}~`,
          // Professional service
          `SV1*HC:${line.cptCode || "00000"}*${line.charge?.toFixed(2) || "0.00"}*UN*${line.units || 1}***${diagnosisPointers}~`,
          // Service date
          `DTP*472*D8*${serviceDate}~`
        );
      });
    }
    
    // Add transaction set trailer
    segments.push(
      `SE*${segments.length + 1}*0001~`
    );
    
    // Add functional group trailer and interchange control trailer
    segments.push(
      `GE*1*${controlNumber}~`,
      `IEA*1*${controlNumber}~`
    );
    
    return segments.join("\n");
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
      // If claim doesn't have claim lines or they're empty, generate them from biomarkers
      if (!claim.claimLines || (Array.isArray(claim.claimLines) && claim.claimLines.length === 0)) {
        if (report.biomarkers && report.biomarkers.length > 0) {
          // Generate CPT codes from biomarkers
          const cptCodes = generateBloodTestCPTCodes(report.biomarkers.map(b => b.name));
          
          // Generate diagnosis codes from biomarkers
          const diagnosisCodes = mapBiomarkersToDiagnoses(report.biomarkers);
          
          // Check for abnormal values to add additional diagnosis codes
          const abnormalCodes = checkForAbnormalValues(report.biomarkers);
          if (abnormalCodes.length > 0) {
            // Add abnormal codes to diagnosis codes
            diagnosisCodes.push(...abnormalCodes);
          }
          
          // Create synthetic claim lines from generated CPT codes
          const syntheticClaimLines = cptCodes.map((cptInfo, index) => ({
            id: `synthetic-${index}`,
            claimId: claim.id,
            lineNumber: index + 1,
            cptCode: cptInfo.code,
            description: cptInfo.description,
            charge: 85.00, // Default charge
            units: 1,
            serviceDate: new Date(),
            diagnosisCodes: diagnosisCodes,
            diagnosisPointers: diagnosisCodes.map((_, i) => i + 1).join(":").slice(0, 4),
            createdAt: new Date(),
            updatedAt: new Date()
          }));
          
          // Attach synthetic claim lines
          claim.claimLines = syntheticClaimLines;
          
          // Update total charge
          claim.totalCharge = syntheticClaimLines.reduce((sum, line) => sum + (line.charge || 0), 0);
        }
      }
      
      // Attach insurance plan if provided
      if (insurancePlan) {
        claim.insurancePlan = insurancePlan;
      }
      
      // Generate EDI with enhanced claim data
      return this.generateEDI(claim as EnhancedClaim, report);
    } catch (error) {
      logger.error(`Error generating blood test claim EDI: ${error}`);
      throw error;
    }
  }
}
