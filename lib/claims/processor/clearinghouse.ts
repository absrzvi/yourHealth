import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { Stage6Result } from "./enhanced-processor";
import { EDI837Generator } from "../edi";

export interface SubmissionData {
  claimId: string;
  ediContent: string;
  fileName: string;
  testMode?: boolean;
}

export interface SubmissionResult {
  submissionId: string;
  clearinghouseId: string;
  status: "accepted" | "rejected" | "pending";
  rejectionReasons?: string[];
  timestamp: Date;
  trackingNumber?: string;
}

export interface StatusUpdate {
  status: string;
  timestamp: Date;
  details?: any;
  denialReasons?: string[];
  paymentInfo?: {
    amount: number;
    checkNumber?: string;
    paymentDate?: Date;
  };
}

export class ClearinghouseSubmitter {
  private clearinghouseUrl: string;
  private apiKey: string;
  private submitterId: string;

  constructor() {
    // In production, these would come from environment variables
    this.clearinghouseUrl = process.env.CLEARINGHOUSE_URL || "https://api.clearinghouse.example.com";
    this.apiKey = process.env.CLEARINGHOUSE_API_KEY || "";
    this.submitterId = process.env.CLEARINGHOUSE_SUBMITTER_ID || "";
  }

  /**
   * Submit EDI file to clearinghouse
   */
  async submit(data: SubmissionData): Promise<SubmissionResult> {
    try {
      // In production, this would make an actual API call to the clearinghouse
      // For now, we'll simulate the submission
      const submissionId = this.generateSubmissionId();
      const clearinghouseId = this.generateClearinghouseId();

      // Validate EDI content before submission
      const validationResult = await this.validateEDI(data.ediContent);
      
      if (!validationResult.isValid) {
        return {
          submissionId,
          clearinghouseId,
          status: "rejected",
          rejectionReasons: validationResult.errors,
          timestamp: new Date(),
        };
      }

      // Simulate API call
      if (data.testMode) {
        // Test mode - always accept
        return {
          submissionId,
          clearinghouseId,
          status: "accepted",
          timestamp: new Date(),
          trackingNumber: `TRK-${Date.now()}`,
        };
      }

      // Production mode - simulate various responses
      const randomOutcome = Math.random();
      
      if (randomOutcome < 0.8) {
        // 80% success rate
        return {
          submissionId,
          clearinghouseId,
          status: "accepted",
          timestamp: new Date(),
          trackingNumber: `TRK-${Date.now()}`,
        };
      } else if (randomOutcome < 0.95) {
        // 15% pending
        return {
          submissionId,
          clearinghouseId,
          status: "pending",
          timestamp: new Date(),
        };
      } else {
        // 5% rejection
        return {
          submissionId,
          clearinghouseId,
          status: "rejected",
          rejectionReasons: ["Invalid payer ID", "Missing required segment"],
          timestamp: new Date(),
        };
      }
    } catch (error) {
      throw new Error(`Clearinghouse submission failed: ${error}`);
    }
  }

  /**
   * Check status of a submitted claim
   */
  async checkStatus(clearinghouseId: string): Promise<StatusUpdate> {
    try {
      // In production, this would query the clearinghouse API
      // For now, we'll simulate status updates
      
      // Get the claim to check its current status
      const claim = await prisma.claim.findFirst({
        where: { clearinghouseId },
      });

      if (!claim) {
        throw new Error("Claim not found");
      }

      // Simulate status progression
      const daysSinceSubmission = Math.floor(
        (Date.now() - new Date(claim.submissionDate || claim.createdAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      if (daysSinceSubmission < 1) {
        return {
          status: "submitted",
          timestamp: new Date(),
          details: { message: "Claim received and queued for processing" },
        };
      } else if (daysSinceSubmission < 3) {
        return {
          status: "processing",
          timestamp: new Date(),
          details: { message: "Claim is being processed by payer" },
        };
      } else if (daysSinceSubmission < 14) {
        // Simulate approval/denial
        const randomOutcome = Math.random();
        
        if (randomOutcome < 0.7) {
          // 70% approval rate
          return {
            status: "paid",
            timestamp: new Date(),
            details: { message: "Claim approved and paid" },
            paymentInfo: {
              amount: 1250.00,
              checkNumber: `CHK-${Date.now()}`,
              paymentDate: new Date(),
            },
          };
        } else if (randomOutcome < 0.9) {
          // 20% partial payment
          return {
            status: "partially_paid",
            timestamp: new Date(),
            details: { message: "Claim partially approved" },
            paymentInfo: {
              amount: 875.00,
              checkNumber: `CHK-${Date.now()}`,
              paymentDate: new Date(),
            },
          };
        } else {
          // 10% denial
          return {
            status: "denied",
            timestamp: new Date(),
            details: { message: "Claim denied" },
            denialReasons: this.generateDenialReasons(),
          };
        }
      }

      return {
        status: claim.status.toLowerCase(),
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Status check failed: ${error}`);
    }
  }

  /**
   * Get submission history for a claim
   */
  async getSubmissionHistory(claimId: string): Promise<StatusUpdate[]> {
    const events = await prisma.claimEvent.findMany({
      where: {
        claimId,
        eventType: {
          in: ["submitted_to_clearinghouse", "clearinghouse_update"],
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return events.map(event => {
      let status = event.eventType;
      
      // Extract status from eventData if it's an object
      if (event.eventData && 
          typeof event.eventData === 'object' && 
          !Array.isArray(event.eventData) &&
          event.eventData !== null &&
          'status' in event.eventData) {
        const eventStatus = event.eventData.status;
        if (typeof eventStatus === 'string') {
          status = eventStatus;
        }
      }
      
      return {
        status,
        timestamp: event.createdAt,
        details: event.eventData,
      };
    });
  }

  /**
   * Validate EDI content before submission
   */
  private async validateEDI(ediContent: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Basic EDI structure validation
    if (!ediContent.includes("ISA*")) {
      errors.push("Missing ISA header segment");
    }
    if (!ediContent.includes("GS*")) {
      errors.push("Missing GS functional group header");
    }
    if (!ediContent.includes("ST*837*")) {
      errors.push("Missing or invalid ST transaction set header");
    }
    if (!ediContent.includes("SE*")) {
      errors.push("Missing SE transaction set trailer");
    }
    if (!ediContent.includes("GE*")) {
      errors.push("Missing GE functional group trailer");
    }
    if (!ediContent.includes("IEA*")) {
      errors.push("Missing IEA interchange trailer");
    }

    // Check segment counts
    const stCount = (ediContent.match(/ST\*/g) || []).length;
    const seCount = (ediContent.match(/SE\*/g) || []).length;
    if (stCount !== seCount) {
      errors.push("Mismatched ST/SE segment counts");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate submission ID
   */
  private generateSubmissionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `SUB-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate clearinghouse ID
   */
  private generateClearinghouseId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `CLH-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate realistic denial reasons
   */
  private generateDenialReasons(): string[] {
    const reasons = [
      ["medical_necessity", "Service not medically necessary"],
      ["eligibility", "Patient not eligible on service date"],
      ["coding_error", "Invalid procedure code combination"],
      ["authorization", "Prior authorization not obtained"],
      ["timely_filing", "Claim filed past deadline"],
    ];

    // Return 1-2 random reasons
    const selectedReasons = reasons
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.random() > 0.5 ? 2 : 1)
      .map(r => r[0]);

    return selectedReasons;
  }

  /**
   * Submit a claim to the clearinghouse
   * This generates the EDI content and submits it
   */
  async submitClaim(claimId: string): Promise<Stage6Result> {
    // Get the claim with related data
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        claimLines: true,
        insurancePlan: true
      }
    });

    if (!claim) {
      throw new Error("Claim not found");
    }

    // Generate EDI content
    const ediGenerator = new EDI837Generator();
    const ediContent = await ediGenerator.generateEDI(claim);

    // Create a filename
    const fileName = `CLAIM_${claim.claimNumber || claim.id}_${new Date().toISOString().slice(0, 10)}.edi`;

    // Submit to clearinghouse
    const submissionResult = await this.submit({
      claimId: claim.id,
      ediContent,
      fileName
    });

    // Update claim with clearinghouse information
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        clearinghouseId: submissionResult.clearinghouseId,
        submissionDate: new Date(),
        status: submissionResult.status === "accepted" ? "SUBMITTED" : "REJECTED"
      }
    });

    // Log the submission event
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "submitted_to_clearinghouse",
        eventData: {
          submissionId: submissionResult.submissionId,
          clearinghouseId: submissionResult.clearinghouseId,
          status: submissionResult.status,
          timestamp: submissionResult.timestamp,
          trackingNumber: submissionResult.trackingNumber || "",
          rejectionReasons: submissionResult.rejectionReasons || []
        }
      }
    });

    // Return the Stage6Result
    return {
      submissionId: submissionResult.submissionId,
      status: submissionResult.status,
      ediFileLocation: fileName
    };
  }

  /**
   * Resubmit a rejected claim
   */
  async resubmit(
    claimId: string,
    correctedEDI: string,
    correctionNotes: string
  ): Promise<SubmissionResult> {
    // Log the resubmission
    await prisma.claimEvent.create({
      data: {
        claimId,
        eventType: "resubmitted",
        eventData: {
          correctionNotes,
          timestamp: new Date(),
        },
      },
    });

    // Submit the corrected claim
    return this.submit({
      claimId,
      ediContent: correctedEDI,
      fileName: `CORRECTED_${Date.now()}.edi`,
    });
  }

  /**
   * Get clearinghouse configuration
   */
  async getConfiguration(): Promise<{
    supportedTransactions: string[];
    ediVersion: string;
    testModeAvailable: boolean;
    batchSubmissionSupported: boolean;
  }> {
    return {
      supportedTransactions: ["837P", "837I", "835", "277", "276"],
      ediVersion: "5010",
      testModeAvailable: true,
      batchSubmissionSupported: true,
    };
  }
}
