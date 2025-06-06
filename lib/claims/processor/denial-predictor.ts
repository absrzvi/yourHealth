import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { Claim, ClaimLine, InsurancePlan, ClaimStatus } from "@prisma/client";

export interface RiskFactor {
  factor: string;
  impact: "high" | "medium" | "low";
  description: string;
  recommendation?: string;
}

export interface DenialPrediction {
  denialProbability: number;
  riskFactors: string[];
  recommendedActions: string[];
  overallRiskScore: number;
  confidenceLevel: number;
  // Added to match Stage4Result interface
  riskScore: number;
  confidence: number;
  recommendations: string[];
}

export class DenialPredictor {
  private denialPatterns: Map<string, number> = new Map();

  constructor() {
    this.initializeDenialPatterns();
  }

  /**
   * Initialize common denial patterns and their weights
   */
  private initializeDenialPatterns() {
    // Common denial reasons and their impact scores (0-1)
    this.denialPatterns.set("missing_prior_auth", 0.9);
    this.denialPatterns.set("invalid_diagnosis_code", 0.8);
    this.denialPatterns.set("frequency_exceeded", 0.7);
    this.denialPatterns.set("non_covered_service", 0.95);
    this.denialPatterns.set("missing_documentation", 0.6);
    this.denialPatterns.set("incorrect_modifier", 0.5);
    this.denialPatterns.set("duplicate_claim", 0.9);
    this.denialPatterns.set("timely_filing", 0.95);
    this.denialPatterns.set("coordination_of_benefits", 0.4);
    this.denialPatterns.set("medical_necessity", 0.7);
  }

  /**
   * Analyze a claim for denial risk
   */
  async analyzeClaim(
    claim: Claim & { claimLines: ClaimLine[]; insurancePlan: InsurancePlan }
  ): Promise<DenialPrediction> {
    const riskFactors: RiskFactor[] = [];
    
    // Check various risk factors
    riskFactors.push(...await this.checkPriorAuthRequirements(claim));
    riskFactors.push(...await this.checkDiagnosisCodes(claim));
    riskFactors.push(...await this.checkFrequencyLimits(claim));
    riskFactors.push(...await this.checkModifiers(claim));
    riskFactors.push(...await this.checkTimelyFiling(claim));
    riskFactors.push(...await this.checkDuplicates(claim));
    riskFactors.push(...await this.checkPayerSpecificRules(claim));
    riskFactors.push(...await this.checkMissingModifiers(claim));
    riskFactors.push(...await this.checkExcludedServices(claim));

    // Calculate overall risk score
    const overallRiskScore = this.calculateRiskScore(riskFactors);
    const denialProbability = this.calculateDenialProbability(riskFactors);
    const confidenceLevel = this.calculateConfidence(riskFactors);
    
    // Generate recommendations
    const recommendedActions = this.generateRecommendations(riskFactors);

    return {
      denialProbability,
      riskFactors: riskFactors.map(rf => rf.factor),
      recommendedActions,
      overallRiskScore,
      confidenceLevel,
      // Map properties to match Stage4Result interface
      riskScore: overallRiskScore,
      confidence: confidenceLevel,
      recommendations: recommendedActions
    };
  }

  /**
   * Check if prior authorization is required and obtained
   */
  private async checkPriorAuthRequirements(
    claim: Claim & { claimLines: ClaimLine[] }
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Check for prior authorization
    for (const line of claim.claimLines) {
      const requiresAuth = await this.cptRequiresPriorAuth(line.cptCode);
      if (requiresAuth) {
        // Check if prior auth was obtained (would be in claim events or other tracking)
        const hasPriorAuth = await this.checkPriorAuthStatus(claim);
        if (!hasPriorAuth) {
          factors.push({
            factor: "missing_prior_auth",
            impact: "high",
            description: `CPT ${line.cptCode} requires prior authorization`,
            recommendation: "Obtain prior authorization before resubmitting",
          });
        }
      }
    }

    return factors;
  }

  /**
   * Check diagnosis code validity and appropriateness
   */
  private async checkDiagnosisCodes(
    claim: Claim & { claimLines: ClaimLine[] }
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    for (const line of claim.claimLines) {
      // Check if diagnosis codes are valid
      const icd10Codes = line.icd10Codes as string[] | null;
      if (!icd10Codes || icd10Codes.length === 0) {
        factors.push({
          factor: "invalid_diagnosis_code",
          impact: "high",
          description: `Line ${line.lineNumber} missing diagnosis codes`,
          recommendation: "Add appropriate ICD-10 codes",
        });
      }

      // Check diagnosis-CPT compatibility
      const compatible = await this.checkDiagnosisCPTCompatibility(
        line.cptCode,
        icd10Codes || []
      );
      if (!compatible) {
        factors.push({
          factor: "invalid_diagnosis_code",
          impact: "medium",
          description: `Diagnosis codes may not support CPT ${line.cptCode}`,
          recommendation: "Review diagnosis codes for medical necessity",
        });
      }
    }

    return factors;
  }

  /**
   * Check frequency limits for services
   */
  private async checkFrequencyLimits(
    claim: Claim & { claimLines: ClaimLine[]; insurancePlan: InsurancePlan }
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Get patient's claim history
    const history = await this.getClaimHistory(claim.userId, claim.insurancePlanId);

    for (const line of claim.claimLines) {
      // Get service date from claim line instead of claim
      const frequency = await this.checkServiceFrequency(
        line.cptCode,
        new Date(line.serviceDate),
        history
      );

      if (frequency.exceeded) {
        factors.push({
          factor: "frequency_exceeded",
          impact: "high",
          description: `CPT ${line.cptCode} exceeds frequency limit: ${frequency.limit}`,
          recommendation: `Wait until ${frequency.nextEligibleDate} to resubmit`,
        });
      }
    }

    return factors;
  }

  /**
   * Check modifier usage
   */
  private async checkModifiers(
    claim: Claim & { claimLines: ClaimLine[] }
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    for (const line of claim.claimLines) {
      if (line.modifier) {
        const validModifier = await this.validateModifier(line.cptCode, line.modifier);
        if (!validModifier) {
          factors.push({
            factor: "incorrect_modifier",
            impact: "medium",
            description: `Invalid modifier ${line.modifier} for CPT ${line.cptCode}`,
            recommendation: "Review modifier usage guidelines",
          });
        }
      }

      // Check if modifier is required but missing
      const modifierRequired = this.checkModifierRequired(line.cptCode);
      if (modifierRequired && !line.modifier) {
        factors.push({
          factor: "incorrect_modifier",
          impact: "medium",
          description: `CPT ${line.cptCode} requires a modifier`,
          recommendation: "Add appropriate modifier",
        });
      }
    }

    return factors;
  }

  /**
   * Check timely filing limits
   */
  private async checkTimelyFiling(
    claim: Claim & { insurancePlan: InsurancePlan }
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    const filingDeadline = await this.getFilingDeadline(
      claim.insurancePlan,
      claim.createdAt
    );

    const daysSinceSubmission = Math.floor(
      (new Date().getTime() - claim.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceSubmission > filingDeadline.getTime() - new Date().getTime()) {
      factors.push({
        factor: "timely_filing",
        impact: "high",
        description: `Claim exceeds filing deadline`,
        recommendation: "Submit appeal with valid reason for late filing",
      });
    } else if (daysSinceSubmission > filingDeadline.getTime() - new Date().getTime() * 0.8) {
      factors.push({
        factor: "timely_filing",
        impact: "low",
        description: `Approaching filing deadline (${filingDeadline.getTime() - new Date().getTime()} days remaining)`,
        recommendation: "Submit claim immediately",
      });
    }

    return factors;
  }

  /**
   * Check for duplicate claims
   */
  private async checkDuplicates(claim: Claim): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    const duplicateClaim = await prisma.claim.findFirst({
      where: {
        userId: claim.userId,
        insurancePlanId: claim.insurancePlanId,
        createdAt: {
          gte: new Date(claim.createdAt.getTime() - 30 * 24 * 60 * 60 * 1000), // Within 30 days
        },
        totalCharge: claim.totalCharge,
        id: { not: claim.id },
        status: { in: [ClaimStatus.SUBMITTED, ClaimStatus.ACCEPTED, ClaimStatus.PAID] },
      },
    });

    if (duplicateClaim) {
      factors.push({
        factor: "duplicate_claim",
        impact: "high",
        description: "Potential duplicate claim detected",
        recommendation: "Verify this is not a duplicate submission",
      });
    }

    return factors;
  }

  /**
   * Check payer-specific rules
   */
  private async checkPayerSpecificRules(
    claim: Claim & { insurancePlan: InsurancePlan }
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Check if service is covered by the plan
    // Get excluded services from plan type instead of direct property
    const planType = claim.insurancePlan.planType.toUpperCase();
    const excludedServices = await this.getExcludedServices(planType);
    
    if (excludedServices.length > 0) {
      // Get claim lines through a separate query since they're not directly on the claim
      const claimLines = await prisma.claimLine.findMany({
        where: { claimId: claim.id }
      });
      
      const hasExcluded = claimLines.some(line =>
        excludedServices.includes(line.cptCode)
      );

      if (hasExcluded) {
        factors.push({
          factor: "non_covered_service",
          impact: "high",
          description: "Service not covered by insurance plan",
          recommendation: "Verify coverage or bill patient directly",
        });
      }
    }

    return factors;
  }

  /**
   * Check for missing modifiers
   */
  private async checkMissingModifiers(
    claim: Claim & { claimLines: ClaimLine[] }
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    for (const line of claim.claimLines) {
      if (this.requiresModifier(line.cptCode) && !line.modifier) {
        factors.push({
          factor: "missing_modifier",
          impact: "medium",
          description: `CPT ${line.cptCode} requires modifier`,
          recommendation: "Add appropriate modifier (-25, -59, etc.)",
        });
      }
    }

    return factors;
  }

  /**
   * Check if services are excluded
   */
  private async checkExcludedServices(
    claim: Claim & { claimLines: ClaimLine[]; insurancePlan: InsurancePlan }
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];

    // Check each service line for exclusions
    for (const line of claim.claimLines) {
      // Check common exclusions by CPT code
      const isExcluded = await this.isServiceExcluded(
        line.cptCode,
        claim.insurancePlan.planType
      );

      if (isExcluded) {
        factors.push({
          factor: "non_covered_service",
          impact: "high",
          description: `CPT ${line.cptCode} is excluded by insurance plan`,
          recommendation: "Verify coverage or bill patient directly",
        });
      }
    }

    return factors;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;

    const weights = { high: 1.0, medium: 0.6, low: 0.3 };
    const totalWeight = factors.reduce((sum, f) => sum + weights[f.impact], 0);
    const maxWeight = factors.length * weights.high;

    return Math.min(1, totalWeight / maxWeight);
  }

  /**
   * Calculate denial probability
   */
  private calculateDenialProbability(factors: RiskFactor[]): number {
    let probability = 0;

    for (const factor of factors) {
      const patternWeight = this.denialPatterns.get(factor.factor) || 0.5;
      const impactMultiplier = factor.impact === "high" ? 1 : factor.impact === "medium" ? 0.6 : 0.3;
      probability += patternWeight * impactMultiplier;
    }

    // Normalize to 0-1 range
    return Math.min(1, probability / Math.max(1, factors.length));
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(factors: RiskFactor[]): number {
    // Higher confidence with more data points
    const dataPoints = factors.length;
    return Math.min(0.95, 0.7 + (dataPoints * 0.05));
  }

  /**
   * Generate recommendations based on risk factors
   */
  private generateRecommendations(factors: RiskFactor[]): string[] {
    const recommendations = new Set<string>();

    // Add specific recommendations from factors
    factors.forEach(f => {
      if (f.recommendation) {
        recommendations.add(f.recommendation);
      }
    });

    // Add general recommendations based on risk level
    const riskScore = this.calculateRiskScore(factors);
    if (riskScore > 0.7) {
      recommendations.add("Consider reviewing claim with billing specialist before submission");
    }
    if (riskScore > 0.5) {
      recommendations.add("Ensure all supporting documentation is attached");
    }

    return Array.from(recommendations);
  }

  // Helper methods
  private async cptRequiresPriorAuth(cptCode: string): Promise<boolean> {
    // Mock implementation - would check payer-specific rules
    const authRequired = ["81479", "81507", "0016U", "0017U"];
    return authRequired.includes(cptCode);
  }

  private async checkDiagnosisCPTCompatibility(
    cptCode: string,
    icd10Codes: string[]
  ): Promise<boolean> {
    // Mock implementation - would use medical necessity rules
    return icd10Codes.length > 0;
  }

  private async getClaimHistory(userId: string, insurancePlanId: string) {
    return await prisma.claim.findMany({
      where: {
        userId,
        insurancePlanId,
        status: { in: [ClaimStatus.ACCEPTED, ClaimStatus.PAID] },
      },
      include: { claimLines: true },
      orderBy: { createdAt: "desc" },
    });
  }

  private async checkServiceFrequency(
    cptCode: string,
    serviceDate: Date,
    history: any[]
  ): Promise<{ exceeded: boolean; limit?: string; nextEligibleDate?: string }> {
    // Mock implementation - would check payer-specific frequency limits
    const frequencyLimits: Record<string, { count: number; days: number }> = {
      "80053": { count: 4, days: 365 },
      "80061": { count: 1, days: 365 },
      "85025": { count: 12, days: 365 },
    };

    const limit = frequencyLimits[cptCode];
    if (!limit) return { exceeded: false };

    const cutoffDate = new Date(serviceDate);
    cutoffDate.setDate(cutoffDate.getDate() - limit.days);

    const recentServices = history.filter(claim =>
      claim.claimLines.some((line: ClaimLine) =>
        line.cptCode === cptCode && new Date(line.serviceDate) > cutoffDate
      )
    );

    if (recentServices.length >= limit.count) {
      const oldestService = recentServices[recentServices.length - 1];
      const nextEligible = new Date(oldestService.serviceDate);
      nextEligible.setDate(nextEligible.getDate() + limit.days);

      return {
        exceeded: true,
        limit: `${limit.count} per ${limit.days} days`,
        nextEligibleDate: nextEligible.toISOString().split("T")[0],
      };
    }

    return { exceeded: false };
  }

  private async validateModifier(cptCode: string, modifier: string): Promise<boolean> {
    // Mock implementation - would validate against modifier rules
    const validModifiers = ["25", "59", "76", "77", "91", "QW"];
    return validModifiers.includes(modifier);
  }

  private checkModifierRequired(cptCode: string): boolean {
    // Mock implementation - would check if modifier is required
    const requiresModifier = ["99213", "99214", "99215"];
    return requiresModifier.includes(cptCode);
  }

  /**
   * Check if prior authorization was obtained for a claim
   */
  private async checkPriorAuthStatus(claim: Claim): Promise<boolean> {
    const priorAuthEvent = await prisma.claimEvent.findFirst({
      where: {
        claimId: claim.id,
        eventType: "PRIOR_AUTH_APPROVED"
      }
    });

    if (priorAuthEvent && priorAuthEvent.eventData) {
      // Check if eventData is an object and has approvalNumber
      if (typeof priorAuthEvent.eventData === 'object' && 
          priorAuthEvent.eventData !== null && 
          !Array.isArray(priorAuthEvent.eventData) &&
          'approvalNumber' in priorAuthEvent.eventData) {
        const approvalNumber = priorAuthEvent.eventData.approvalNumber;
        // Ensure approvalNumber is a string and has content
        if (typeof approvalNumber === 'string' && approvalNumber.length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get filing deadline based on payer rules
   */
  private async getFilingDeadline(
    insurancePlan: InsurancePlan,
    serviceDate: Date
  ): Promise<Date> {
    // Default filing limits by payer type
    const filingLimits: Record<string, number> = {
      MEDICARE: 365,
      MEDICAID: 365,
      COMMERCIAL: 90,
    };

    const planType = insurancePlan.planType.toUpperCase();
    const daysLimit = filingLimits[planType] || 180; // Default to 180 days

    const deadline = new Date(serviceDate);
    deadline.setDate(deadline.getDate() + daysLimit);
    return deadline;
  }

  /**
   * Check if services are excluded
   */
  private async isServiceExcluded(
    cptCode: string,
    planType: string
  ): Promise<boolean> {
    const excludedServices = await this.getExcludedServices(planType);
    return excludedServices.includes(cptCode);
  }
  
  /**
   * Get excluded services for a plan type
   */
  private async getExcludedServices(planType: string): Promise<string[]> {
    // Common exclusions by plan type
    const exclusions: Record<string, string[]> = {
      MEDICARE: ["99401", "99402", "99403", "99404"], // Preventive counseling
      MEDICAID: ["99241", "99242", "99243", "99244", "99245"], // Consultations
      COMMERCIAL: ["S9150"], // Experimental procedures
    };

    return exclusions[planType.toUpperCase()] || [];
  }

  private requiresModifier(cptCode: string): boolean {
    // Mock implementation - would check if modifier is required
    const requiresModifier = ["99213", "99214", "99215"];
    return requiresModifier.includes(cptCode);
  }

  private isValidICD10(code: string): boolean {
    // Mock implementation - would validate ICD-10 code
    return true;
  }
}
