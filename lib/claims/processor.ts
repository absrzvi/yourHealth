import { prisma } from "@/lib/db";
import { generateCPTCodes, getCPTDescription } from './coding';
import { generateBloodTestCPTCodes, mapBiomarkersToDiagnoses, checkForAbnormalValues } from './bloodTestCoding';
import { logger } from "@/lib/logger";
import { Report, Biomarker, Claim } from "@prisma/client";

// Define claim status types
export type ClaimStatus =
  | "DRAFT"
  | "READY"
  | "SUBMITTED"
  | "ACCEPTED"
  | "REJECTED"
  | "DENIED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "APPEALED";

// Define CPTCode interface for internal use
// Remove duplicate interface definition

export interface ClaimCreationData {
  reportId: string;
  insurancePlanId: string;
  userId: string;
}

export interface CPTCode {
  cpt: string;
  description: string;
  diagnoses: string[];
  units?: number;
  modifier?: string;
  serviceDate?: Date;
}

export class ClaimsProcessor {
  /**
   * Create a claim from a report with multiple service lines
   * @param data Claim creation data including reportId and insurancePlanId
   * @returns Created claim with claim lines
   */
  async createClaimFromReport(data: ClaimCreationData): Promise<Claim & { claimLines: Array<Record<string, unknown>> }> {
    try {
      // Fetch report and user
      const report = await prisma.report.findUnique({ 
        where: { id: data.reportId }, 
        include: { user: true } 
      });
      
      if (!report) throw new Error("Report not found");

      // Generate claim number
      const claimNumber = this.generateClaimNumber();

      // Extract CPT codes based on report type
      const cptCodes = await this.generateCPTCodes(report);

      // Calculate charges for each CPT code
      const charges = await this.calculateCharges(cptCodes);

      // Get service date from report or use current date
      const serviceDate = (report as any).testDate || new Date(); // Using any temporarily until Report type is updated

      // Create claim and claim lines
      const claim = await prisma.claim.create({
        data: {
          userId: data.userId,
          reportId: data.reportId,
          insurancePlanId: data.insurancePlanId,
          claimNumber,
          status: "DRAFT",
          totalCharge: charges.total,
          claimLines: {
            create: cptCodes.map((code, index) => ({
              lineNumber: index + 1,
              cptCode: code.cpt,
              description: code.description,
              icd10Codes: code.diagnoses,
              charge: charges.lines[index],
              units: code.units || 1,
              modifier: code.modifier,
              serviceDate: code.serviceDate || serviceDate
            }))
          },
          claimEvents: {
            create: {
              eventType: "created",
              eventData: { source: "automated" } as any // Using any temporarily until Prisma types are properly handled
            }
          }
        },
        include: {
          claimLines: true,
          insurancePlan: true
        }
      });

      // Log claim creation
      logger.info(`Created claim ${claimNumber} with ${cptCodes.length} service lines`);

      // Validate claim and update status
      const validation = await this.validateClaim(claim);
      if (!validation.isValid) {
        await this.updateClaimStatus(claim.id, "DRAFT", validation.errors);
        logger.warn(`Claim ${claimNumber} has validation errors: ${validation.errors.join(', ')}`);
      } else {
        await this.updateClaimStatus(claim.id, "READY");
        logger.info(`Claim ${claimNumber} is ready for submission`);
      }

      return claim;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error creating claim from report: ${errorMessage}`);
      throw error;
    }
  }

  private generateClaimNumber(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `CLM-${timestamp}-${random}`.toUpperCase();
  }

  async updateClaimStatus(claimId: string, status: ClaimStatus, eventData?: any) {
    await prisma.$transaction([
      prisma.claim.update({
        where: { id: claimId },
        data: { status }
      }),
      prisma.claimEvent.create({
        data: {
          claimId,
          eventType: status.toLowerCase(),
          eventData
        }
      })
    ]);
  }

  /**
   * Validates a claim and its claim lines
   * @param claim The claim to validate
   * @returns Validation result with errors if any
   */
  async validateClaim(claim: Claim & { claimLines?: any[] }): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const errors: string[] = [];
      
      // Basic claim validation
      if (!claim.claimNumber) errors.push('Claim number is required');
      if (claim.totalCharge <= 0) errors.push('Total charge must be positive');
      
      // Validate claim lines
      if (!claim.claimLines || claim.claimLines.length === 0) {
        errors.push('Claim must have at least one claim line');
      } else {
        // Check for required fields in claim lines
        claim.claimLines.forEach((line, index) => {
          if (!line.cptCode) errors.push(`Line ${index + 1}: CPT code is required`);
          if (line.charge <= 0) errors.push(`Line ${index + 1}: Charge must be positive`);
          if (!line.serviceDate) errors.push(`Line ${index + 1}: Service date is required`);
        });
        
        // Validate that total charge matches sum of line charges
        const calculatedTotal = claim.claimLines.reduce((sum, line) => {
          const units = line.units || 1;
          return sum + (line.charge * units);
        }, 0);
        
        // Allow for small rounding differences (within 1 cent)
        if (Math.abs(calculatedTotal - claim.totalCharge) > 0.01) {
          errors.push(`Total charge (${claim.totalCharge}) does not match sum of line charges (${calculatedTotal.toFixed(2)})`);
        }
      }
      
      // Validate insurance plan
      if (!claim.insurancePlanId) {
        errors.push('Insurance plan is required');
      }
      
      // Check claim status
      if (!['DRAFT', 'READY', 'SUBMITTED', 'PROCESSING', 'APPROVED', 'DENIED', 'PAID'].includes(claim.status)) {
        errors.push(`Invalid claim status: ${claim.status}`);
      }
      
      // HIPAA compliance checks
      if (claim.patientId && !claim.userId) {
        errors.push('User ID is required for HIPAA compliance when patient ID is provided');
      }
      
      logger.debug(`Validated claim ${claim.claimNumber}: ${errors.length > 0 ? 'Invalid' : 'Valid'}`);
      if (errors.length > 0) {
        logger.debug(`Validation errors: ${errors.join(', ')}`);
      }
      
      return { 
        isValid: errors.length === 0, 
        errors 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error validating claim: ${errorMessage}`);
      return {
        isValid: false,
        errors: [`Error during validation: ${errorMessage}`]
      };
    }
  }

  /**
   * Generate CPT codes from report data
   * @param report Report data with optional biomarkers
   * @returns Array of CPT codes with diagnoses
   */
  async generateCPTCodes(report: Partial<Report & { 
    parsedData?: string | Record<string, unknown> | null,
    biomarkers?: Biomarker[]
  }>): Promise<CPTCode[]> {
    try {
      // Extract report type
      const reportType = report.type || 'UNKNOWN';
      
      // Initialize biomarker arrays
      let biomarkers: string[] = [];
      let biomarkerObjects: Biomarker[] = [];
      
      // Use biomarkers if directly provided with the report
      if (report.biomarkers && Array.isArray(report.biomarkers)) {
        biomarkerObjects = report.biomarkers;
        biomarkers = report.biomarkers.map(b => b.name || '');
      }
      // Otherwise parse from parsedData
      else {
        // Parse biomarker data if available
        let parsedDataObj: Record<string, unknown> = {};
        if (report.parsedData) {
          if (typeof report.parsedData === 'string') {
            try {
              parsedDataObj = JSON.parse(report.parsedData);
            } catch (e) {
              logger.error(`Error parsing report data: ${e}`);
              parsedDataObj = {};
            }
          } else {
            parsedDataObj = report.parsedData as Record<string, unknown>;
          }
          
          // Extract biomarker names
          if (parsedDataObj && parsedDataObj.biomarkers && 
              Array.isArray(parsedDataObj.biomarkers)) {
            const biomarkersArray = parsedDataObj.biomarkers as Biomarker[];
            biomarkers = biomarkersArray.map(b => b.name || '');
            biomarkerObjects = biomarkersArray;
          }
        }
      }
      
      // Determine report category for specialized handling
      switch (reportType) {
        case 'BLOOD_TEST':
          return await this.generateBloodTestCPTCodes(biomarkerObjects, biomarkers);
        case 'DNA':
          return await this.generateDNACPTCodes(report);
        case 'MICROBIOME':
          return await this.generateMicrobiomeCPTCodes(report);
        default:
          // Generic handling for unknown report types
          return await this.generateGenericCPTCodes(reportType, biomarkers, report.parsedData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error generating CPT codes: ${errorMessage}`);
      return [{
        cpt: "80050",
        description: "General health panel",
        diagnoses: ["Z00.00"],
        units: 1
      }];
    }
  }
  
  /**
   * Generate CPT codes specifically for blood test reports
   * @param biomarkerObjects Array of biomarker objects
   * @param biomarkerNames Array of biomarker names
   * @returns Array of CPT codes with diagnoses
   */
  private async generateBloodTestCPTCodes(
    biomarkerObjects: Biomarker[], 
    biomarkerNames: string[]
  ): Promise<CPTCode[]> {
    try {
      // Generate specialized blood test CPT codes
      const cptCodes = generateBloodTestCPTCodes(biomarkerNames);
      
      // Generate appropriate diagnosis codes
      let diagnosisCodes: string[] = ['Z00.00']; // Default to general health examination
      
      if (biomarkerObjects.length > 0) {
        diagnosisCodes = mapBiomarkersToDiagnoses(biomarkerObjects);
        
        // Check for abnormal values to add additional diagnosis codes
        const abnormalCodes = checkForAbnormalValues(biomarkerObjects);
        if (abnormalCodes.length > 0) {
          diagnosisCodes = [...diagnosisCodes, ...abnormalCodes];
        }
      }
      
      // Convert to CPTCode objects
      return cptCodes.map(cpt => ({
        cpt: cpt.code,
        description: cpt.description,
        diagnoses: diagnosisCodes,
        units: 1
      }));
    } catch (error) {
      logger.error(`Error in blood test CPT generation: ${error}`);
      // Fall back to generic panel
      return [{
        cpt: "80053",
        description: "Comprehensive metabolic panel",
        diagnoses: ["Z00.00"],
        units: 1
      }];
    }
  }
  
  /**
   * Generate CPT codes specifically for DNA test reports
   * @param report DNA report data
   * @returns Array of CPT codes with diagnoses
   */
  private async generateDNACPTCodes(
    report: Partial<Report & { parsedData?: string | Record<string, unknown> | null }>
  ): Promise<CPTCode[]> {
    // Extract DNA test details from parsedData if available
    let testType = 'general';
    // const specificGenes: string[] = []; // Commented out as not currently used
    
    try {
      if (report.parsedData) {
        const parsedData = typeof report.parsedData === 'string' 
          ? JSON.parse(report.parsedData) 
          : report.parsedData;
          
        if (parsedData) {
          // Extract test type and specific genes if available
          testType = (parsedData as Record<string, unknown>).testType as string || testType;
          // specificGenes not used currently, but kept for future expansion
        }
      }
      
      // Map DNA test types to appropriate CPT codes
      let cptCode: string;
      let description: string;
      let diagnosisCodes: string[] = ['Z13.79']; // Genetic screening
      
      switch (testType.toLowerCase()) {
        case 'brca':
          cptCode = '81162';
          description = 'BRCA1 & BRCA2 gene analysis';
          diagnosisCodes = ['Z15.01']; // Genetic susceptibility to malignant neoplasm of breast
          break;
        case 'carrier':
          cptCode = '81443';
          description = 'Genetic carrier screening';
          diagnosisCodes = ['Z31.430']; // Genetic carrier status testing
          break;
        case 'pharmacogenomic':
          cptCode = '81355';
          description = 'Pharmacogenomic analysis panel';
          diagnosisCodes = ['Z79.899']; // Other long term (current) drug therapy
          break;
        case 'whole_exome':
          cptCode = '81415';
          description = 'Exome sequence analysis';
          break;
        case 'whole_genome':
          cptCode = '81425';
          description = 'Genome sequence analysis';
          break;
        default:
          cptCode = '81479';
          description = 'Unlisted molecular pathology procedure';
      }
      
      return [{
        cpt: cptCode,
        description,
        diagnoses: diagnosisCodes,
        units: 1
      }];
    } catch (error) {
      logger.error(`Error in DNA CPT generation: ${error}`);
      return [{
        cpt: "81479",
        description: "Unlisted molecular pathology procedure",
        diagnoses: ["Z13.79"],
        units: 1
      }];
    }
  }
  
  /**
   * Generate CPT codes specifically for microbiome test reports
   * @param report Microbiome report data
   * @returns Array of CPT codes with diagnoses
   */
  private async generateMicrobiomeCPTCodes(
    report: Partial<Report & { parsedData?: string | Record<string, unknown> | null }>
  ): Promise<CPTCode[]> {
    try {
      // Extract microbiome test details
      let testSite = 'gut';
      
      if (report.parsedData) {
        const parsedData = typeof report.parsedData === 'string' 
          ? JSON.parse(report.parsedData) 
          : report.parsedData;
          
        if (parsedData) {
          // Extract test site if available
          testSite = (parsedData as Record<string, unknown>).testSite as string || testSite;
        }
      }
      
      // Map microbiome test sites to appropriate CPT codes
      let cptCode: string;
      let description: string;
      let diagnosisCodes: string[] = ['Z00.00']; // General examination
      
      switch (testSite.toLowerCase()) {
        case 'gut':
        case 'intestinal':
        case 'gi':
          cptCode = '87505';
          description = 'Gastrointestinal pathogen panel';
          diagnosisCodes = ['R19.7']; // Diarrhea, unspecified
          break;
        case 'oral':
        case 'mouth':
          cptCode = '87640';
          description = 'Oral microbiome analysis';
          diagnosisCodes = ['K13.70']; // Unspecified lesions of oral mucosa
          break;
        case 'skin':
          cptCode = '87101';
          description = 'Skin microbiome culture';
          diagnosisCodes = ['L08.9']; // Local infection of the skin
          break;
        case 'vaginal':
          cptCode = '87512';
          description = 'Vaginal microbiome analysis';
          diagnosisCodes = ['N76.0']; // Vaginitis
          break;
        default:
          cptCode = '87798';
          description = 'Microbiological detection not otherwise specified';
      }
      
      return [{
        cpt: cptCode,
        description,
        diagnoses: diagnosisCodes,
        units: 1
      }];
    } catch (error) {
      logger.error(`Error in microbiome CPT generation: ${error}`);
      return [{
        cpt: "87798",
        description: "Microbiological detection not otherwise specified",
        diagnoses: ["Z00.00"],
        units: 1
      }];
    }
  }
  
  /**
   * Generate generic CPT codes for unknown report types
   * @param reportType Type of report
   * @param biomarkers Array of biomarker names
   * @param parsedData Parsed report data
   * @returns Array of CPT codes with diagnoses
   */
  private async generateGenericCPTCodes(
    reportType: string,
    biomarkers: string[],
    parsedData?: string | Record<string, unknown> | null
  ): Promise<CPTCode[]> {
    try {
      // Generate CPT codes using the standard coding utility
      const cptCodeStrings = generateCPTCodes({
        type: reportType,
        tests: biomarkers,
        parsedData
      });
      
      const cptCodes = cptCodeStrings.map(code => ({
        code,
        description: getCPTDescription(code)
      }));
      
      // Convert to CPTCode objects
      return cptCodes.map(cpt => ({
        cpt: cpt.code,
        description: cpt.description,
        diagnoses: ['Z00.00'], // Default to general health examination
        units: 1
      }));
    } catch (error) {
      logger.error(`Error in generic CPT generation: ${error}`);
      return [{
        cpt: "80050",
        description: "General health panel",
        diagnoses: ["Z00.00"],
        units: 1
      }];
    }
  }

  /**
   * Calculate charges for CPT codes using pricing rules
   * @param cptCodes Array of CPT codes with descriptions and diagnoses
   * @returns Object with line charges and total
   */
  async calculateCharges(cptCodes: CPTCode[]): Promise<{ lines: number[]; total: number }> {
    try {
      // Import pricing functions
      const { calculateCharges: getPrices } = await import('./pricing.js');
      
      // Get charges for each CPT code
      const charges = getPrices(cptCodes.map(code => code.cpt));
      
      // Map charges to lines array
      const lines = cptCodes.map(code => {
        const charge = charges.find(c => c.cptCode === code.cpt)?.charge || 100;
        return charge * (code.units || 1);
      });
      
      // Calculate total
      const total = lines.reduce((sum, charge) => sum + charge, 0);
      
      logger.debug(`Calculated charges for ${cptCodes.length} CPT codes: $${total.toFixed(2)}`);
      
      return { lines, total };
    } catch (error) {
      logger.error(`Error calculating charges: ${error}`);
      // Fallback to basic pricing if error occurs
      const lines = cptCodes.map(code => {
        // Basic pricing logic based on code type
        if (code.cpt.startsWith('8')) {
          return code.cpt.startsWith('80') ? 150 : 75; // Panels vs individual tests
        }
        return 100; // Default charge
      });
      const total = lines.reduce((sum, charge) => sum + charge, 0);
      return { lines, total };
    }
  }
} 