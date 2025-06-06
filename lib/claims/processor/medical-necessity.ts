import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { Stage3Result } from "./enhanced-processor";

export interface MedicalNecessityData {
  cptCode: string;
  icd10Codes: string[];
  patientHistory: any;
  specimenType: string;
  patientAge?: number;
  gender?: string;
}

export interface NecessityRule {
  cptCode: string;
  requiredDiagnoses?: string[];
  ageRange?: { min?: number; max?: number };
  gender?: string;
  frequency?: { count: number; period: number }; // e.g., 2 times per 365 days
  requiresPriorAuth?: boolean;
}

export class MedicalNecessityValidator {
  private rules: Map<string, NecessityRule[]> = new Map();

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize medical necessity rules based on payer guidelines
   */
  private initializeRules() {
    // Blood test rules
    this.addRule({
      cptCode: "80053", // Comprehensive Metabolic Panel
      requiredDiagnoses: ["E11", "E10", "N18", "K70", "I10"], // Diabetes, CKD, Liver disease, HTN
      frequency: { count: 4, period: 365 },
    });

    this.addRule({
      cptCode: "85025", // CBC with differential
      requiredDiagnoses: ["D64", "D50", "C90", "R50"], // Anemia, Cancer, Fever
      frequency: { count: 12, period: 365 },
    });

    this.addRule({
      cptCode: "80061", // Lipid Panel
      requiredDiagnoses: ["E78", "I10", "E11", "Z82.49"], // Hyperlipidemia, HTN, Diabetes, Family history
      ageRange: { min: 20 },
      frequency: { count: 1, period: 365 },
    });

    // Genetic test rules
    this.addRule({
      cptCode: "81479", // Genetic testing
      requiredDiagnoses: ["Z80", "Z15", "C50"], // Family history, Genetic susceptibility, Breast cancer
      requiresPriorAuth: true,
    });

    // Microbiome test rules
    this.addRule({
      cptCode: "87507", // GI pathogen panel
      requiredDiagnoses: ["K59.0", "K58", "K50", "K51"], // IBS, Crohn's, UC
      frequency: { count: 2, period: 365 },
    });
  }

  /**
   * Add a medical necessity rule
   */
  private addRule(rule: NecessityRule) {
    const existing = this.rules.get(rule.cptCode) || [];
    existing.push(rule);
    this.rules.set(rule.cptCode, existing);
  }

  /**
   * Validate medical necessity for a CPT code
   */
  async validate(data: MedicalNecessityData): Promise<boolean> {
    const rules = this.rules.get(data.cptCode);
    
    // If no rules defined, consider it necessary (permissive approach)
    if (!rules || rules.length === 0) {
      return true;
    }

    // Check each rule - if any rule passes, the test is necessary
    for (const rule of rules) {
      if (await this.checkRule(rule, data)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a specific rule is satisfied
   */
  private async checkRule(rule: NecessityRule, data: MedicalNecessityData): Promise<boolean> {
    // Check diagnosis requirements
    if (rule.requiredDiagnoses && rule.requiredDiagnoses.length > 0) {
      const hasRequiredDiagnosis = rule.requiredDiagnoses.some(reqDx =>
        data.icd10Codes.some(dx => dx.startsWith(reqDx))
      );
      if (!hasRequiredDiagnosis) {
        return false;
      }
    }

    // Check age requirements
    if (rule.ageRange && data.patientAge !== undefined) {
      if (rule.ageRange.min && data.patientAge < rule.ageRange.min) {
        return false;
      }
      if (rule.ageRange.max && data.patientAge > rule.ageRange.max) {
        return false;
      }
    }

    // Check gender requirements
    if (rule.gender && data.gender && rule.gender !== data.gender) {
      return false;
    }

    // Check frequency limits
    if (rule.frequency) {
      const isWithinFrequency = await this.checkFrequencyLimit(
        data.cptCode,
        data.patientHistory,
        rule.frequency
      );
      if (!isWithinFrequency) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if the test frequency is within allowed limits
   */
  private async checkFrequencyLimit(
    cptCode: string,
    patientHistory: any,
    frequency: { count: number; period: number }
  ): Promise<boolean> {
    // In a real implementation, this would query the patient's claim history
    // For now, we'll do a simple check based on provided history
    if (!patientHistory || !patientHistory.previousTests) {
      return true; // No history, allow the test
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - frequency.period);

    const recentTests = patientHistory.previousTests.filter((test: any) => {
      return test.cptCode === cptCode && new Date(test.date) > cutoffDate;
    });

    return recentTests.length < frequency.count;
  }

  /**
   * Get medical necessity documentation requirements
   */
  async getDocumentationRequirements(cptCode: string): Promise<string[]> {
    const requirements: string[] = [];
    const rules = this.rules.get(cptCode);

    if (!rules || rules.length === 0) {
      return ["Standard clinical documentation"];
    }

    for (const rule of rules) {
      if (rule.requiredDiagnoses && rule.requiredDiagnoses.length > 0) {
        requirements.push(`Documentation supporting diagnosis codes: ${rule.requiredDiagnoses.join(", ")}`);
      }
      if (rule.requiresPriorAuth) {
        requirements.push("Prior authorization required");
        requirements.push("Letter of medical necessity from ordering physician");
      }
      if (rule.frequency) {
        requirements.push(`Previous test dates if within ${rule.frequency.period} days`);
      }
    }

    return Array.from(new Set(requirements)); // Remove duplicates
  }

  /**
   * Suggest ICD-10 codes based on CPT code
   */
  async suggestDiagnoses(cptCode: string): Promise<string[]> {
    const rules = this.rules.get(cptCode);
    if (!rules) return [];

    const diagnoses = new Set<string>();
    for (const rule of rules) {
      if (rule.requiredDiagnoses) {
        rule.requiredDiagnoses.forEach(dx => diagnoses.add(dx));
      }
    }

    return Array.from(diagnoses);
  }

  /**
   * Check if prior authorization is required
   */
  async requiresPriorAuth(cptCode: string): Promise<boolean> {
    const rules = this.rules.get(cptCode);
    if (!rules) return false;

    return rules.some(rule => rule.requiresPriorAuth === true);
  }

  /**
   * Generate medical necessity letter template
   */
  /**
   * Validate claim for medical necessity
   */
  async validateClaim(claim: any): Promise<Stage3Result> {
    // Extract CPT codes from claim lines
    const cptCodes = claim.claimLines.map((line: any) => line.serviceCode);
    const icd10Codes = claim.diagnosisCodes || [];
    
    const results = [];
    
    // Validate each service against medical necessity rules
    for (const cptCode of cptCodes) {
      // Build mock patient history - in real implementation, would pull from database
      const patientHistory = {
        previousTests: [] // Would be populated from claim history
      };
      
      // Validate this CPT code
      const isValid = await this.validate({
        cptCode,
        icd10Codes,
        patientHistory,
        specimenType: "blood", // Default for now
        patientAge: claim.patientAge || 45, // Default age if not available
        gender: claim.patientGender || "U" // Default gender if not available
      });
      
      // Get documentation requirements
      const documentation = await this.getDocumentationRequirements(cptCode);
      
      // Check if prior auth required
      const requiresPriorAuth = await this.requiresPriorAuth(cptCode);
      
      results.push({
        cptCode,
        isValid,
        requirements: documentation,
        requiresPriorAuth
      });
    }
    
    // Return the Stage3Result
    const isNecessary = results.some(r => r.isValid);
    const score = results.filter(r => r.isValid).length / results.length * 100;
    
    return {
      isNecessary,
      score,
      issues: results.filter(r => !r.isValid).flatMap(r => r.requirements),
      recommendations: [
        ...(results.some(r => r.requiresPriorAuth) ? ["Obtain prior authorization before service"] : []),
        ...(score < 100 ? ["Add appropriate diagnosis codes to support medical necessity"] : []),
        ...(results.some(r => !r.isValid) ? ["Document clinical indication in patient record"] : [])
      ]
    };
  }

  async generateNecessityLetter(data: {
    cptCode: string;
    patientName: string;
    diagnoses: string[];
    clinicalRationale: string;
  }): Promise<string> {
    const template = `
LETTER OF MEDICAL NECESSITY

Date: ${new Date().toLocaleDateString()}

Patient: ${data.patientName}

CPT Code: ${data.cptCode}
Diagnosis Codes: ${data.diagnoses.join(", ")}

Clinical Rationale:
${data.clinicalRationale}

This test is medically necessary for the diagnosis and treatment of the patient's condition.
The results will directly impact the patient's treatment plan and clinical management.

Sincerely,
[Physician Name]
[NPI Number]
`;

    return template;
  }
}
