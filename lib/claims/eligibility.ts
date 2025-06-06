/**
 * Eligibility verification for insurance claims
 */

import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

// Define the EligibilityResult interface compatible with Prisma's Json type
export interface EligibilityResult {
  status: "active" | "inactive" | "pending";
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
  copay?: number;
  coinsurance?: number;
  coverageDetails?: {
    labServices?: boolean;
    geneticTesting?: boolean;
    preventiveCare?: boolean;
  };
  // Add fields to ensure compatibility with Prisma.JsonObject
  [key: string]: unknown;
}

export class EligibilityChecker {
  /**
   * Check eligibility for a specific insurance plan
   */
  async checkEligibility(insurancePlanId: string): Promise<EligibilityResult> {
    // Get insurance plan details
    const insurancePlan = await prisma.insurancePlan.findUnique({
      where: { id: insurancePlanId },
    });

    if (!insurancePlan) {
      throw new Error("Insurance plan not found");
    }

    // Check for existing eligibility check
    const existingCheck = await prisma.eligibilityCheck.findFirst({
      where: {
        insurancePlanId,
        checkedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
        },
      },
      orderBy: {
        checkedAt: "desc",
      },
    });

    if (existingCheck) {
      return {
        status: existingCheck.status as "active" | "inactive" | "pending",
        deductible: existingCheck.deductible || undefined,
        deductibleMet: existingCheck.deductibleMet || undefined,
        outOfPocketMax: existingCheck.outOfPocketMax || undefined,
        outOfPocketMet: existingCheck.outOfPocketMet || undefined,
        copay: existingCheck.copay || undefined,
        coinsurance: existingCheck.coinsurance || undefined,
      };
    }

    // Simulate eligibility check with payer
    const eligibilityResult = await this.simulatePayerEligibilityCheck(insurancePlan);

    // Store eligibility check result
    await prisma.eligibilityCheck.create({
      data: {
        insurancePlanId,
        status: eligibilityResult.status,
        deductible: eligibilityResult.deductible,
        deductibleMet: eligibilityResult.deductibleMet,
        outOfPocketMax: eligibilityResult.outOfPocketMax,
        outOfPocketMet: eligibilityResult.outOfPocketMet,
        copay: eligibilityResult.copay,
        coinsurance: eligibilityResult.coinsurance,
        responseData: eligibilityResult as unknown as Prisma.InputJsonValue,
      },
    });

    return eligibilityResult;
  }

  /**
   * Simulate payer eligibility check
   * In production, this would call the actual payer API
   */
  private async simulatePayerEligibilityCheck(insurancePlan: {
    id: string;
    planType: string;
    isActive: boolean;
    termDate?: Date | null;
    payerId?: string;
    payerName?: string;
    memberId?: string;
  }): Promise<EligibilityResult> {
    // Simulate different scenarios based on plan type
    const planTypeDefaults: Record<string, Partial<EligibilityResult>> = {
      PPO: {
        deductible: 1500,
        deductibleMet: Math.random() * 1500,
        outOfPocketMax: 6000,
        outOfPocketMet: Math.random() * 2000,
        copay: 30,
        coinsurance: 0.20,
      },
      HMO: {
        deductible: 500,
        deductibleMet: Math.random() * 500,
        outOfPocketMax: 4000,
        outOfPocketMet: Math.random() * 1000,
        copay: 20,
        coinsurance: 0.10,
      },
      EPO: {
        deductible: 1000,
        deductibleMet: Math.random() * 1000,
        outOfPocketMax: 5000,
        outOfPocketMet: Math.random() * 1500,
        copay: 25,
        coinsurance: 0.15,
      },
      MEDICARE: {
        deductible: 200,
        deductibleMet: Math.random() * 200,
        outOfPocketMax: 0, // No out-of-pocket max for Medicare
        outOfPocketMet: 0,
        copay: 0,
        coinsurance: 0.20,
      },
      MEDICAID: {
        deductible: 0,
        deductibleMet: 0,
        outOfPocketMax: 0,
        outOfPocketMet: 0,
        copay: 0,
        coinsurance: 0,
      },
    };

    const defaults = planTypeDefaults[insurancePlan.planType] || planTypeDefaults.PPO;

    // Check if plan is active
    const isActive = insurancePlan.isActive && 
      (!insurancePlan.termDate || insurancePlan.termDate > new Date());

    return {
      status: isActive ? "active" : "inactive",
      ...defaults,
      coverageDetails: {
        labServices: true,
        geneticTesting: insurancePlan.planType !== "HMO", // HMO might require referral
        preventiveCare: true,
      },
    };
  }

  /**
   * Verify coverage for specific services
   */
  async verifyCoverage(
    insurancePlanId: string,
    serviceType: "lab" | "genetic" | "preventive"
  ): Promise<boolean> {
    const eligibility = await this.checkEligibility(insurancePlanId);

    if (eligibility.status !== "active") {
      return false;
    }

    switch (serviceType) {
      case "lab":
        return eligibility.coverageDetails?.labServices || false;
      case "genetic":
        return eligibility.coverageDetails?.geneticTesting || false;
      case "preventive":
        return eligibility.coverageDetails?.preventiveCare || false;
      default:
        return false;
    }
  }

  /**
   * Calculate patient responsibility
   */
  calculatePatientResponsibility(
    eligibility: EligibilityResult,
    totalCharge: number
  ): {
    deductibleAmount: number;
    coinsuranceAmount: number;
    copayAmount: number;
    totalResponsibility: number;
  } {
    if (eligibility.status !== "active") {
      return {
        deductibleAmount: totalCharge,
        coinsuranceAmount: 0,
        copayAmount: 0,
        totalResponsibility: totalCharge,
      };
    }

    // Calculate deductible portion
    const remainingDeductible = (eligibility.deductible || 0) - (eligibility.deductibleMet || 0);
    const deductibleAmount = Math.min(remainingDeductible, totalCharge);

    // Calculate coinsurance on amount after deductible
    const afterDeductible = totalCharge - deductibleAmount;
    const coinsuranceAmount = afterDeductible * (eligibility.coinsurance || 0);

    // Add copay if applicable
    const copayAmount = eligibility.copay || 0;

    // Check against out-of-pocket max
    const currentOOP = eligibility.outOfPocketMet || 0;
    const maxOOP = eligibility.outOfPocketMax || Infinity;
    const totalBeforeMax = deductibleAmount + coinsuranceAmount + copayAmount;
    const totalResponsibility = Math.min(totalBeforeMax, maxOOP - currentOOP);

    return {
      deductibleAmount,
      coinsuranceAmount,
      copayAmount,
      totalResponsibility,
    };
  }
}
