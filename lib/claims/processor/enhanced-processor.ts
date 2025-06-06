import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { Claim, ClaimLine, ClaimStatus, Report } from "@prisma/client";
import { EligibilityChecker, EligibilityResult } from "../eligibility";
import { validateClaimInput } from "../validation";
import * as codingModule from "../coding";
import * as pricingModule from "../pricing";
import { EDI837Generator } from "../edi";
import { SpecimenTracker } from "./specimen-tracker";
import { MedicalNecessityValidator } from "./medical-necessity";
import { DenialPredictor } from "./denial-predictor";
import { ClearinghouseSubmitter } from "./clearinghouse";
import { RevenueOptimizer } from "./revenue-optimizer";

// Create class wrappers for the coding and pricing modules
export class CodingOptimizer {
  static generateCPTCodes(reportData: any): string[] {
    return codingModule.generateCPTCodes(reportData);
  }
  
  static validateCPTCode(code: string): boolean {
    return codingModule.validateCPTCode(code);
  }
  
  static getCPTDescription(code: string): string {
    return codingModule.getCPTDescription(code);
  }
}

export class PricingEngine {
  static calculateCharges(cptCodes: string[]): { cptCode: string; charge: number }[] {
    return pricingModule.calculateCharges(cptCodes);
  }
  
  static calculateTotalCharge(claimLines: { charge: number; units?: number }[]): number {
    return pricingModule.calculateTotalCharge(claimLines);
  }
  
  static applyInsuranceAdjustment(
    charge: number,
    insuranceType: string,
    contractRate?: number
  ): {
    allowedAmount: number;
    patientResponsibility: number;
    insurancePayment: number;
  } {
    return pricingModule.applyInsuranceAdjustment(charge, insuranceType, contractRate);
  }
}

type ClaimWithRelations = Claim & {
  claimLines: ClaimLine[];
  insurancePlan: any;
  report?: Report | null;
};

export interface Stage1Result {
  eligibility: {
    coverageActive: boolean;
    deductibleMet: number;
    outOfPocketMet: number;
    copay?: number;
    coinsurance?: number;
  };
  priorAuthRequired: boolean;
  priorAuthStatus?: string;
}

export interface Stage2Result {
  specimenId: string;
  status: string;
  collectionDate: Date;
  receivedDate: Date;
  processedDate: Date;
}

export interface Stage3Result {
  isNecessary: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface Stage4Result {
  riskScore: number;
  denialProbability: number;
  confidence: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface Stage5Result {
  cptCodes: string[];
  charges: any[];
  totalCharge: number;
}

export interface Stage6Result {
  submissionId: string;
  status: string;
  ediFileLocation: string;
}

export interface Stage7Result {
  status: string;
  denialReasons?: string[];
  requiresAction: boolean;
  nextSteps: string[];
}

export interface Stage8Result {
  analysis: {
    revenueData: Array<{ metric: string; value: number | string }>;
    denialRate: number;
    avgProcessingTime: number;
  };
  optimization: {
    strategies: string[];
  };
  forecast: {
    projectedRevenue: number;
    timeline: Array<{ period: string; amount: number }>;
  };
}

export class EnhancedClaimsProcessor {
  private eligibilityChecker: EligibilityChecker;
  private specimenTracker: SpecimenTracker;
  private necessityValidator: MedicalNecessityValidator;
  private denialPredictor: DenialPredictor;
  private ediGenerator: EDI837Generator;
  private clearinghouseSubmitter: ClearinghouseSubmitter;
  private revenueOptimizer: RevenueOptimizer;

  constructor() {
    this.eligibilityChecker = new EligibilityChecker();
    this.specimenTracker = new SpecimenTracker();
    this.necessityValidator = new MedicalNecessityValidator();
    this.denialPredictor = new DenialPredictor();
    this.clearinghouseSubmitter = new ClearinghouseSubmitter();
    this.revenueOptimizer = new RevenueOptimizer();
    this.ediGenerator = new EDI837Generator();
  }

  /**
   * Stage 1: Eligibility Verification
   */
  async processStage1(claimId: string): Promise<Stage1Result> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        insurancePlan: true,
        claimLines: true,
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Check eligibility
    const eligibility = await this.eligibilityChecker.checkEligibility(
      claim.insurancePlanId
    );

    // Check prior authorization requirements
    const priorAuthRequired = await this.checkPriorAuthRequirements(claim);

    // Update claim with stage 1 results
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "STAGE_1_COMPLETE",
        eventData: {
          eligibility: {
            coverageActive: eligibility.status === "active",
            deductibleMet: eligibility.deductibleMet || 0,
            outOfPocketMet: eligibility.outOfPocketMet || 0,
            copay: eligibility.copay,
            coinsurance: eligibility.coinsurance,
          },
          priorAuthRequired,
          timestamp: new Date(),
        },
      },
    });

    return {
      eligibility: {
        coverageActive: eligibility.status === "active",
        deductibleMet: eligibility.deductibleMet || 0,
        outOfPocketMet: eligibility.outOfPocketMet || 0,
        copay: eligibility.copay,
        coinsurance: eligibility.coinsurance,
      },
      priorAuthRequired,
    };
  }

  /**
   * Stage 2: Specimen Tracking
   */
  async processStage2(claimId: string): Promise<Stage2Result> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        report: true,
        claimLines: true,
      },
    });

    if (!claim || !claim.reportId) {
      throw new Error("Claim or report not found");
    }

    // Track specimen
    const specimenStatus = await this.specimenTracker.trackSpecimen(claim.reportId);

    // Update claim event
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "STAGE_2_COMPLETE",
        eventData: {
          specimenId: specimenStatus.specimenId,
          status: specimenStatus.status,
          collectionDate: specimenStatus.collectionDate,
          receivedDate: specimenStatus.receivedDate,
          processedDate: specimenStatus.processedDate,
          timestamp: new Date(),
        },
      },
    });

    return {
      specimenId: specimenStatus.specimenId,
      status: specimenStatus.status,
      collectionDate: specimenStatus.collectionDate,
      receivedDate: specimenStatus.receivedDate,
      processedDate: specimenStatus.processedDate,
    };
  }

  /**
   * Stage 3: Medical Necessity Check
   */
  async processStage3(claimId: string): Promise<Stage3Result> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimLines: true,
        insurancePlan: true,
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Validate medical necessity
    const necessityResults = await this.necessityValidator.validateClaim(claim);

    // Update claim event
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "STAGE_3_COMPLETE",
        eventData: {
          isNecessary: necessityResults.isNecessary,
          score: necessityResults.score,
          issues: necessityResults.issues,
          recommendations: necessityResults.recommendations,
          timestamp: new Date(),
        },
      },
    });

    return necessityResults;
  }

  /**
   * Stage 4: Denial Risk Analysis
   */
  async processStage4(claimId: string): Promise<Stage4Result> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimLines: true,
        insurancePlan: true,
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Analyze denial risk
    const riskAnalysis = await this.denialPredictor.analyzeClaim(claim);

    // Update claim event
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "STAGE_4_COMPLETE",
        eventData: {
          riskScore: riskAnalysis.riskScore,
          denialProbability: riskAnalysis.denialProbability,
          confidence: riskAnalysis.confidence,
          riskFactors: riskAnalysis.riskFactors,
          recommendations: riskAnalysis.recommendations,
          timestamp: new Date(),
        },
      },
    });

    return riskAnalysis;
  }

  /**
   * Stage 5: Coding and Pricing
   */
  async processStage5(claimId: string): Promise<Stage5Result> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimLines: true,
        report: true,
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Generate CPT codes if report exists
    let generatedCodes: string[] = [];
    if (claim.report && claim.report.parsedData) {
      const reportData = JSON.parse(claim.report.parsedData as string);
      generatedCodes = CodingOptimizer.generateCPTCodes(reportData);
    }

    // Calculate charges
    const cptCodes = claim.claimLines.map(line => line.cptCode);
    const allCodes = Array.from(new Set([...cptCodes, ...generatedCodes]));
    const charges = PricingEngine.calculateCharges(allCodes);

    // Update claim lines with calculated charges
    for (const line of claim.claimLines) {
      const chargeInfo = charges.find((c: any) => c.cptCode === line.cptCode);
      if (chargeInfo && chargeInfo.charge !== line.charge) {
        await prisma.claimLine.update({
          where: { id: line.id },
          data: { charge: chargeInfo.charge },
        });
      }
    }

    // Update total charge
    const totalCharge = charges.reduce((sum: number, c: any) => sum + c.charge, 0);
    await prisma.claim.update({
      where: { id: claimId },
      data: { totalCharge },
    });

    // Update claim event
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "STAGE_5_COMPLETE",
        eventData: {
          generatedCodes,
          charges,
          totalCharge,
          timestamp: new Date(),
        },
      },
    });

    return {
      cptCodes: allCodes,
      charges,
      totalCharge,
    };
  }

  /**
   * Stage 6: EDI Generation and Submission
   */
  async processStage6(claimId: string): Promise<Stage6Result> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimLines: true,
        insurancePlan: true,
        user: true,
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Generate EDI 837
    const ediContent = await this.ediGenerator.generateFromClaim(claim as any);

    // Submit to clearinghouse
    const submission = await this.clearinghouseSubmitter.submitClaim(claimId);

    // Update claim with submission info
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: "SUBMITTED",
        submissionDate: new Date(),
        clearinghouseId: submission.submissionId,
        ediFileLocation: submission.ediFileLocation,
      },
    });

    // Store submission details in claim event
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "SUBMITTED",
        notes: "Claim submitted to clearinghouse",
        eventData: {
          submissionId: submission.submissionId,
          ediContent: ediContent.substring(0, 500), // Store first 500 chars for reference
        },
      },
    });

    return submission;
  }

  /**
   * Stage 7: Monitoring and Follow-up
   */
  async processStage7(claimId: string): Promise<Stage7Result> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimLines: true,
      },
    });

    if (!claim || !claim.clearinghouseId) {
      throw new Error("Claim not found or not submitted");
    }

    // Check submission status
    const status = await this.clearinghouseSubmitter.checkStatus(claim.clearinghouseId);

    // Update claim based on status
    let newStatus: ClaimStatus | undefined;
    if (status.status === "accepted") {
      newStatus = ClaimStatus.ACCEPTED;
    } else if (status.status === "rejected") {
      newStatus = ClaimStatus.REJECTED;
    } else if (status.status === "denied") {
      newStatus = ClaimStatus.DENIED;
    }

    if (newStatus) {
      await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: newStatus,
          processedDate: new Date(),
          // Store denial reasons in the claim record if available
          denialReason: status.denialReasons ? JSON.stringify(status.denialReasons) : null,
        },
      });
    }

    // Update claim event
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "STAGE_7_UPDATE",
        eventData: {
          status: status.status,
          denialReasons: status.denialReasons,
          timestamp: new Date(),
        },
      },
    });

    return {
      status: status.status,
      denialReasons: status.denialReasons,
      requiresAction: status.status === "rejected" || status.status === "denied",
      nextSteps: this.determineNextSteps(status.status),
    };
  }

  /**
   * Stage 8: Revenue Optimization
   */
  async processStage8(claimId: string): Promise<Stage8Result> {
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimLines: true,
        insurancePlan: true,
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Get all claims for revenue analysis
    const allClaims = await prisma.claim.findMany({
      where: {
        userId: claim.userId,
        status: {
          in: [ClaimStatus.PAID, ClaimStatus.PARTIALLY_PAID, ClaimStatus.DENIED],
        },
      },
      include: {
        claimLines: true,
      },
    });

    // Analyze revenue
    const revenueAnalysis = await this.revenueOptimizer.analyzeRevenue(allClaims);

    // Update claim event
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "STAGE_8_COMPLETE",
        eventData: {
          analysis: revenueAnalysis.analysis,
          optimization: revenueAnalysis.optimization,
          forecast: revenueAnalysis.forecast,
          timestamp: new Date(),
        },
      },
    });

    return revenueAnalysis;
  }

  /**
   * Process a claim through all 8 stages
   */
  async processClaim(claimId: string): Promise<void> {
    // Validate claim exists
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimLines: true,
        insurancePlan: true,
        report: true,
      },
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Stage 1: Eligibility Verification
    const eligibility = await this.stage1EligibilityVerification(claim.insurancePlanId);

    // ... rest of the code remains the same ...
  }

  private async stage1EligibilityVerification(insurancePlanId: string): Promise<EligibilityResult> {
    // Check eligibility
    const eligibility = await this.eligibilityChecker.checkEligibility(
      insurancePlanId
    );

    return eligibility;
  }

  /**
   * Helper method to check prior authorization requirements
   */
  private async checkPriorAuthRequirements(claim: ClaimWithRelations): Promise<boolean> {
    // Check if any CPT codes require prior auth
    const priorAuthCodes = ["81479", "0016U", "0017U", "81214", "81216"];
    return claim.claimLines.some(line => priorAuthCodes.includes(line.cptCode));
  }

  /**
   * Helper method to determine next steps based on status
   */
  private determineNextSteps(status: string): string[] {
    switch (status) {
      case "rejected":
        return ["Review rejection reason", "Correct errors", "Resubmit claim"];
      case "denied":
        return ["Review denial reason", "Gather supporting documentation", "Consider appeal"];
      case "pending":
        return ["Continue monitoring", "Follow up in 5 business days"];
      default:
        return ["Monitor for payment", "Verify EOB when received"];
    }
  }
}
