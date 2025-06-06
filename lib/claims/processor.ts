import { prisma } from "@/lib/db";

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
}

export class ClaimsProcessor {
  async createClaimFromReport(data: ClaimCreationData) {
    // Fetch report and user
    const report = await prisma.report.findUnique({
      where: { id: data.reportId },
      include: { user: true }
    });
    if (!report) throw new Error("Report not found");

    // Generate claim number
    const claimNumber = this.generateClaimNumber();

    // Extract CPT codes
    const cptCodes = await this.generateCPTCodes(report);

    // Calculate charges
    const charges = await this.calculateCharges(cptCodes);

    // Use a fallback for serviceDate if report.testDate is not available
    const serviceDate = (report as any).testDate || new Date();

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
            serviceDate
          }))
        },
        claimEvents: {
          create: {
            eventType: "created",
            eventData: { source: "automated" }
          }
        }
      },
      include: {
        claimLines: true,
        insurancePlan: true
      }
    });

    // Validate claim
    const validation = await this.validateClaim(claim);
    if (!validation.isValid) {
      await this.updateClaimStatus(claim.id, "DRAFT", validation.errors);
    } else {
      await this.updateClaimStatus(claim.id, "READY");
    }

    return claim;
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

  // Placeholder for advanced claim validation
  async validateClaim(claim: any) {
    // TODO: Implement validation logic
    return { isValid: true, errors: [] };
  }

  // Stub for CPT code extraction
  async generateCPTCodes(report: any): Promise<CPTCode[]> {
    // TODO: Implement CPT code extraction logic
    // For now, return a mock CPT code
    return [
      {
        cpt: "12345",
        description: "Mock CPT Code",
        diagnoses: ["A123", "B456"],
        units: 1,
        modifier: "26"
      }
    ];
  }

  // Stub for charge calculation
  async calculateCharges(cptCodes: CPTCode[]): Promise<{ lines: number[]; total: number }> {
    // TODO: Implement charge calculation logic
    // For now, return mock charges
    const lines = cptCodes.map(() => 100); // Mock charge per line
    const total = lines.reduce((sum, charge) => sum + charge, 0);
    return { lines, total };
  }
} 