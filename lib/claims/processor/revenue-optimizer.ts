import { PrismaClient, Claim, ClaimEvent, ClaimStatus, Prisma } from "@prisma/client";
import { Stage8Result } from "./enhanced-processor";

const prisma = new PrismaClient();

export interface RevenueAnalysis {
  expectedReimbursement: number;
  avgDaysToPayment: number;
  denialRate: number;
  collectionRate: number;
  commonDenialReasons: string[];
  topPerformingCPTCodes: Array<{
    code: string;
    revenue: number;
    approvalRate: number;
  }>;
  underperformingCPTCodes: Array<{
    code: string;
    denialRate: number;
    commonIssues: string[];
  }>;
}

export interface OptimizationSuggestion {
  category: "coding" | "timing" | "documentation" | "payer" | "process";
  priority: "high" | "medium" | "low";
  suggestion: string;
  potentialImpact: number; // Estimated revenue increase in percentage
  implementation: string;
}

type ClaimWithEvents = Claim & {
  claimEvents?: ClaimEvent[];
  claimLines?: Array<{
    cptCode: string;
    charge: number;
    id: string;
  }>;
  insurancePlan?: {
    id: string;
    payerId: string;
    payerName: string;
    memberId: string;
    groupNumber?: string | null;
  };
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

interface CPTCodeStats {
  code: string;
  totalClaims: number;
  approvedClaims: number;
  deniedClaims: number;
  totalRevenue: number;
  denialReasons: string[];
}

interface RevenueForecast {
  month: string;
  expectedRevenue: number;
  confidence: number;
}

interface OptimalBillingTiming {
  dayOfWeek: string;
  weekOfMonth: number;
  reasoning: string;
}

export class RevenueOptimizer {
  /**
   * Analyze revenue for claims
   */
  async analyzeRevenue(claims: ClaimWithEvents[]): Promise<Stage8Result> {
    // If no claims provided, return empty analysis
    if (!claims || claims.length === 0) {
      return {
        analysis: {
          revenueData: [],
          denialRate: 0,
          avgProcessingTime: 0
        },
        optimization: {
          strategies: ["No claims data available for analysis"]
        },
        forecast: {
          projectedRevenue: 0,
          timeline: []
        }
      };
    }

    // Use the most recent claim as primary for detailed analysis
    const claim = claims.sort((a: ClaimWithEvents, b: ClaimWithEvents) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    // Get payment history and status
    const payments = claim.claimEvents?.filter((event: ClaimEvent) => 
      event.eventType === "payment_received" || event.eventType === "payment_posted"
    ) || [];
    
    const isPaid = claim.status === ClaimStatus.PAID || claim.status === ClaimStatus.PARTIALLY_PAID;
    const isDenied = claim.status === ClaimStatus.DENIED;
    
    // Calculate payment efficiency
    const efficiency = isPaid 
      ? (claim.paidAmount || 0) / (claim.totalCharge || 1) * 100 
      : 0;
    
    // Calculate timing metrics
    const submissionDate = claim.submissionDate || claim.createdAt;
    const paymentDate = payments.length > 0 ? payments[0].createdAt : null;
    const daysToPayment = paymentDate 
      ? Math.floor((new Date(paymentDate).getTime() - new Date(submissionDate).getTime()) / (1000 * 60 * 60 * 24)) 
      : 0;
    
    // Generate optimization strategies
    const optimizationStrategies: string[] = [];
    
    // Add strategies based on analysis
    if (isDenied) {
      const denialEvents = claims.flatMap((c: ClaimWithEvents) => 
        (c.claimEvents || []).filter((e: ClaimEvent) => 
          e.eventType === "denial_received" || e.eventType === "denial_processed"
        )
      );
      
      // Extract denial reasons from events if available
      const denialEvent = denialEvents.length > 0 ? denialEvents[0] : null;
      if (denialEvent && denialEvent.eventData && typeof denialEvent.eventData === 'object' && denialEvent.eventData !== null) {
        const eventData = denialEvent.eventData as Prisma.JsonObject;
        const reason = eventData.reason;
        if (reason && typeof reason === 'string') {
          optimizationStrategies.push(`Address denial reason: ${reason}`);
        } else {
          optimizationStrategies.push("Review denial reasons and resubmit with corrections");
        }
      } else {
        optimizationStrategies.push("Review denial reasons and resubmit with corrections");
      }
      
      optimizationStrategies.push(
        "Check for coding errors",
        "Verify patient eligibility before submission",
        "Ensure all required documentation is attached"
      );
    }
    
    if (efficiency < 80 && isPaid) {
      optimizationStrategies.push(
        "Review contracts for better reimbursement rates",
        "Appeal underpaid claims",
        "Check for improper adjustments"
      );
    }
    
    if (daysToPayment > 45) {
      optimizationStrategies.push("Follow up more aggressively on submitted claims");
    }
    
    // Fill optimizationStrategies with default strategies if empty
    if (optimizationStrategies.length === 0) {
      optimizationStrategies.push(
        "Continue current billing practices",
        "Monitor claim status regularly", 
        "Consider electronic remittance advice for faster processing"
      );
    }
    
    // Calculate aggregate metrics
    const totalBilled = claims.reduce((sum: number, c: ClaimWithEvents) => sum + (c.totalCharge || 0), 0);
    const totalPaid = claims.reduce((sum: number, c: ClaimWithEvents) => sum + (c.paidAmount || 0), 0);
    const overallEfficiency = totalBilled > 0 ? (totalPaid / totalBilled * 100) : 0;
    const deniedClaims = claims.filter((c: ClaimWithEvents) => c.status === ClaimStatus.DENIED);
    const denialRate = claims.length > 0 ? (deniedClaims.length / claims.length * 100) : 0;
    
    // Return the properly formatted Stage8Result
    return {
      analysis: {
        revenueData: [
          { metric: "Total Billed", value: totalBilled },
          { metric: "Total Paid", value: totalPaid },
          { metric: "Efficiency", value: overallEfficiency.toFixed(2) + "%" },
          { metric: "Denial Rate", value: denialRate.toFixed(2) + "%" }
        ],
        denialRate: denialRate,
        avgProcessingTime: daysToPayment
      },
      optimization: {
        strategies: optimizationStrategies
      },
      forecast: {
        projectedRevenue: totalBilled > 0 ? totalPaid * 1.1 : 0,
        timeline: [
          { period: "Current Month", amount: totalPaid },
          { period: "Next Month", amount: totalPaid * 1.05 },
          { period: "Next Quarter", amount: totalPaid * 1.15 }
        ]
      }
    };
  }

  /**
   * Analyze user's claims performance
   */
  async analyzeUserClaims(userId: string): Promise<RevenueAnalysis> {
    // Get all user claims
    const claims = await prisma.claim.findMany({
      where: { userId },
      include: {
        claimLines: true,
        claimEvents: true,
        insurancePlan: true,
      },
    });

    if (claims.length === 0) {
      return {
        expectedReimbursement: 0,
        avgDaysToPayment: 0,
        denialRate: 0,
        collectionRate: 0,
        commonDenialReasons: [],
        topPerformingCPTCodes: [],
        underperformingCPTCodes: [],
      };
    }

    // Calculate metrics
    const totalClaims = claims.length;
    const deniedClaims = claims.filter((c: ClaimWithEvents) => c.status === ClaimStatus.DENIED);
    const paidClaims = claims.filter((c: ClaimWithEvents) => 
      c.status === ClaimStatus.PAID || c.status === ClaimStatus.PARTIALLY_PAID
    );
    const acceptedClaims = claims.filter((c: ClaimWithEvents) => 
      c.status === ClaimStatus.ACCEPTED || c.status === ClaimStatus.PAID || c.status === ClaimStatus.PARTIALLY_PAID
    );

    // Calculate denial rate
    const denialRate = totalClaims > 0 ? deniedClaims.length / totalClaims : 0;

    // Calculate collection rate
    const totalBilled = claims.reduce((sum: number, c: ClaimWithEvents) => sum + (c.totalCharge || 0), 0);
    const totalCollected = paidClaims.reduce((sum: number, c: ClaimWithEvents) => {
      const paidAmount = c.paidAmount || (c.totalCharge * 0.8); // Assume 80% if not specified
      return sum + paidAmount;
    }, 0);
    const collectionRate = totalBilled > 0 ? totalCollected / totalBilled : 0;

    // Calculate average days to payment using claim events
    const paymentDays = paidClaims.map((c: ClaimWithEvents) => {
      const submissionDate = c.submissionDate || c.createdAt;
      const paymentEvent = c.claimEvents?.find((e: ClaimEvent) => 
        e.eventType === 'payment_received' || e.eventType === 'payment_posted'
      );
      if (paymentEvent) {
        return Math.floor(
          (paymentEvent.createdAt.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      return 30; // Default to 30 days if no payment event
    });
    const avgDaysToPayment = paymentDays.reduce((sum: number, days: number) => sum + days, 0) / paidClaims.length || 0;

    // Calculate expected reimbursement for pending claims
    const pendingClaims = claims.filter((c: ClaimWithEvents) => 
      c.status === ClaimStatus.SUBMITTED || 
      c.status === ClaimStatus.ACCEPTED || 
      c.status === ClaimStatus.READY
    );
    const expectedReimbursement = pendingClaims.reduce((sum: number, c: ClaimWithEvents) => 
      sum + (c.totalCharge * 0.8), 0 // Assume 80% reimbursement rate
    );

    // Analyze denial reasons
    const denialReasons = this.extractDenialReasons(claims);

    // Analyze CPT code performance
    const cptAnalysis = this.analyzeCPTPerformance(claims);

    return {
      expectedReimbursement,
      avgDaysToPayment,
      denialRate,
      collectionRate,
      commonDenialReasons: denialReasons,
      topPerformingCPTCodes: cptAnalysis.topPerforming,
      underperformingCPTCodes: cptAnalysis.underperforming,
    };
  }

  /**
   * Generate optimization suggestions
   */
  async generateSuggestions(analysis: {
    denialRate: number;
    averageDaysToPayment: number;
    commonDenialReasons: string[];
  }): Promise<string[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // High denial rate suggestions
    if (analysis.denialRate > 0.15) {
      suggestions.push({
        category: "process",
        priority: "high",
        suggestion: "Implement pre-submission claim scrubbing",
        potentialImpact: 20,
        implementation: "Review all claims for common errors before submission",
      });
    }

    // Slow payment suggestions
    if (analysis.averageDaysToPayment > 45) {
      suggestions.push({
        category: "timing",
        priority: "medium",
        suggestion: "Submit claims within 24 hours of service",
        potentialImpact: 10,
        implementation: "Automate claim generation from completed reports",
      });
    }

    // Denial reason specific suggestions
    if (analysis.commonDenialReasons.includes("medical_necessity")) {
      suggestions.push({
        category: "documentation",
        priority: "high",
        suggestion: "Enhance medical necessity documentation",
        potentialImpact: 15,
        implementation: "Include detailed clinical notes and test rationale",
      });
    }

    if (analysis.commonDenialReasons.includes("coding_error")) {
      suggestions.push({
        category: "coding",
        priority: "high",
        suggestion: "Implement automated CPT/ICD-10 validation",
        potentialImpact: 25,
        implementation: "Use AI-powered coding assistance for accuracy",
      });
    }

    if (analysis.commonDenialReasons.includes("eligibility")) {
      suggestions.push({
        category: "process",
        priority: "medium",
        suggestion: "Verify eligibility before service delivery",
        potentialImpact: 12,
        implementation: "Real-time eligibility checks at patient registration",
      });
    }

    // Sort by priority and impact
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.potentialImpact - a.potentialImpact;
    });

    return suggestions.map(s => s.suggestion);
  }

  /**
   * Extract common denial reasons from claims
   */
  private extractDenialReasons(claims: ClaimWithEvents[]): string[] {
    const reasonCounts = new Map<string, number>();

    claims.forEach((claim: ClaimWithEvents) => {
      if (claim.status === ClaimStatus.DENIED && claim.claimEvents) {
        claim.claimEvents
          .filter((e: ClaimEvent) => e.eventType === "denied" || e.eventType === "clearinghouse_update")
          .forEach((event: ClaimEvent) => {
            if (event.eventData && typeof event.eventData === 'object') {
              const eventData = event.eventData as Record<string, any>;
              const reasons = eventData.denialReasons || [];
              if (Array.isArray(reasons)) {
                reasons.forEach((reason: string) => {
                  reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
                });
              }
            }
          });
      }
    });

    // Sort by frequency and return top 5
    return Array.from(reasonCounts.entries())
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason]: [string, number]) => reason);
  }

  /**
   * Analyze CPT code performance
   */
  private analyzeCPTPerformance(claims: ClaimWithEvents[]): {
    topPerforming: Array<{ code: string; revenue: number; approvalRate: number }>;
    underperforming: Array<{ code: string; denialRate: number; commonIssues: string[] }>;
  } {
    const cptStats = new Map<string, {
      totalClaims: number;
      approvedClaims: number;
      deniedClaims: number;
      totalRevenue: number;
      denialReasons: string[];
    }>();

    // Aggregate stats by CPT code
    claims.forEach((claim: ClaimWithEvents) => {
      if (!claim.claimLines) return;
      
      claim.claimLines.forEach((line: { cptCode: string; charge: number }) => {
        const stats = cptStats.get(line.cptCode) || {
          totalClaims: 0,
          approvedClaims: 0,
          deniedClaims: 0,
          totalRevenue: 0,
          denialReasons: [],
        };

        stats.totalClaims++;
        if (claim.status === ClaimStatus.ACCEPTED || claim.status === ClaimStatus.PAID || claim.status === ClaimStatus.PARTIALLY_PAID) {
          stats.approvedClaims++;
          stats.totalRevenue += line.charge;
        } else if (claim.status === ClaimStatus.DENIED && claim.claimEvents) {
          stats.deniedClaims++;
          // Add denial reasons
          const denialEvent = claim.claimEvents.find((e: ClaimEvent) => 
            e.eventType === "denied" || (e.eventData && typeof e.eventData === 'object' && 
            (e.eventData as Record<string, any>).denialReasons)
          );
          
          if (denialEvent && denialEvent.eventData && typeof denialEvent.eventData === 'object' && denialEvent.eventData !== null) {
            const eventData = denialEvent.eventData as Prisma.JsonObject;
            const denialReasons = eventData.denialReasons;
            if (Array.isArray(denialReasons)) {
              stats.denialReasons.push(...denialReasons.map(reason => String(reason)));
            }
          }
        }

        cptStats.set(line.cptCode, stats);
      });
    });

    // Calculate performance metrics
    const cptPerformance = Array.from(cptStats.entries()).map(([code, stats]: [string, {
      totalClaims: number;
      approvedClaims: number;
      deniedClaims: number;
      totalRevenue: number;
      denialReasons: string[];
    }]) => ({
      code,
      approvalRate: stats.totalClaims > 0 ? stats.approvedClaims / stats.totalClaims : 0,
      denialRate: stats.totalClaims > 0 ? stats.deniedClaims / stats.totalClaims : 0,
      revenue: stats.totalRevenue,
      commonIssues: Array.from(new Set(stats.denialReasons)),
    }));

    // Sort and categorize
    const topPerforming = cptPerformance
      .filter((p: { approvalRate: number }) => p.approvalRate > 0.8)
      .sort((a: { revenue: number }, b: { revenue: number }) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p: { code: string; revenue: number; approvalRate: number }) => ({
        code: p.code,
        revenue: p.revenue,
        approvalRate: p.approvalRate,
      }));

    const underperforming = cptPerformance
      .filter((p: { denialRate: number }) => p.denialRate > 0.3)
      .sort((a: { denialRate: number }, b: { denialRate: number }) => b.denialRate - a.denialRate)
      .slice(0, 5)
      .map((p: { code: string; denialRate: number; commonIssues: string[] }) => ({
        code: p.code,
        denialRate: p.denialRate,
        commonIssues: p.commonIssues.slice(0, 3),
      }));

    return { topPerforming, underperforming };
  }

  /**
   * Calculate optimal billing timing
   */
  private calculateOptimalBillingTiming(claims: ClaimWithEvents[]): {
    optimalDayOfWeek: string;
    optimalTimeOfMonth: string;
    reasoning: string;
  } {
    // Filter to only paid claims
    const paidClaims = claims.filter((c: ClaimWithEvents) => 
      c.status === ClaimStatus.PAID || c.status === ClaimStatus.PARTIALLY_PAID
    );

    if (paidClaims.length === 0) {
      return {
        optimalDayOfWeek: "Monday",
        optimalTimeOfMonth: "First week",
        reasoning: "Insufficient data to determine optimal billing timing. Using default recommendations.",
      };
    }

    // Analyze day of week
    const dayStats = new Map<string, { count: number; avgDaysToPayment: number }>();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    
    // Analyze time of month
    const weekStats = new Map<string, { count: number; avgDaysToPayment: number }>();
    const weeks = ["First week", "Second week", "Third week", "Fourth week"];

    paidClaims.forEach((claim: ClaimWithEvents) => {
      const submissionDate = new Date(claim.submissionDate || claim.createdAt);
      const paymentEvent = claim.claimEvents?.find(e => 
        e.eventType === 'payment_received' || e.eventType === 'payment_posted'
      );
      
      if (paymentEvent) {
        const paymentDate = new Date(paymentEvent.createdAt);
        const daysToPayment = Math.ceil((paymentDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Day of week analysis
        const dayOfWeek = days[submissionDate.getDay()];
        const dayData = dayStats.get(dayOfWeek) || { count: 0, avgDaysToPayment: 0 };
        dayData.count++;
        dayData.avgDaysToPayment = 
          (dayData.avgDaysToPayment * (dayData.count - 1) + daysToPayment) / dayData.count;
        dayStats.set(dayOfWeek, dayData);

        // Time of month analysis
        const dayOfMonth = submissionDate.getDate();
        let weekOfMonth: string;
        if (dayOfMonth <= 7) weekOfMonth = "First week";
        else if (dayOfMonth <= 14) weekOfMonth = "Second week";
        else if (dayOfMonth <= 21) weekOfMonth = "Third week";
        else weekOfMonth = "Fourth week";

        const weekData = weekStats.get(weekOfMonth) || { count: 0, avgDaysToPayment: 0 };
        weekData.count++;
        weekData.avgDaysToPayment = 
          (weekData.avgDaysToPayment * (weekData.count - 1) + daysToPayment) / weekData.count;
        weekStats.set(weekOfMonth, weekData);
      }
    });

    // Find optimal day and week
    let optimalDay = "Monday";
    let minDayAvg = Infinity;
    dayStats.forEach((data: { count: number; avgDaysToPayment: number }, day: string) => {
      if (data.count >= 3 && data.avgDaysToPayment < minDayAvg) {
        minDayAvg = data.avgDaysToPayment;
        optimalDay = day;
      }
    });

    let optimalWeek = "First week";
    let minWeekAvg = Infinity;
    weekStats.forEach((data: { count: number; avgDaysToPayment: number }, week: string) => {
      if (data.count >= 3 && data.avgDaysToPayment < minWeekAvg) {
        minWeekAvg = data.avgDaysToPayment;
        optimalWeek = week;
      }
    });

    return {
      optimalDayOfWeek: optimalDay,
      optimalTimeOfMonth: optimalWeek,
      reasoning: `Based on historical payment data, claims submitted on ${optimalDay} during the ${optimalWeek.toLowerCase()} of the month tend to be processed faster (${minDayAvg !== Infinity ? Math.round(minDayAvg) : '?'} days on average).`,
    };
  }

  /**
   * Generate revenue forecast
   */
  async generateRevenueForecast(userId: string, months: number = 3): Promise<{
    forecast: Array<{
      month: string;
      expectedRevenue: number;
      confidence: number;
    }>;
    assumptions: string[];
  }> {
    // Get historical data
    const historicalClaims = await prisma.claim.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // Last 6 months
        },
      },
      include: { claimLines: true },
    });

    // Calculate monthly averages
    const monthlyRevenue = new Map<string, number>();
    historicalClaims.forEach((claim) => {
      const month = claim.createdAt.toISOString().substring(0, 7);
      const totalCharge = claim.totalCharge || 0;
      const paidAmount = claim.paidAmount || 0;
      
      const revenue = (claim.status === ClaimStatus.PAID || claim.status === ClaimStatus.PARTIALLY_PAID)
        ? (paidAmount || totalCharge * 0.8)
        : claim.status === ClaimStatus.DENIED 
        ? 0 
        : totalCharge * 0.8;
      
      monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + revenue);
    });

    // Calculate average and trend
    const revenueValues = Array.from(monthlyRevenue.values());
    const avgRevenue = revenueValues.reduce((sum, val) => sum + val, 0) / revenueValues.length;
    
    // Simple linear trend
    const trend = revenueValues.length > 1 
      ? (revenueValues[revenueValues.length - 1] - revenueValues[0]) / revenueValues.length
      : 0;

    // Generate forecast
    const forecast = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      const monthStr = forecastDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      
      const expectedRevenue = avgRevenue + (trend * i);
      const confidence = Math.max(0.5, 0.9 - (i * 0.1)); // Confidence decreases with time
      
      forecast.push({
        month: monthStr,
        expectedRevenue,
        confidence
      });
    }

    return {
      forecast,
      assumptions: [
        "Based on historical claim patterns",
        "Assumes consistent service volume", 
        "80% average reimbursement rate",
        `Linear trend of ${trend > 0 ? "+" : ""}${(trend / avgRevenue * 100).toFixed(1)}% per month`
      ]
    };
  }
}