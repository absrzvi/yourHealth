import { EDI837Generator } from "../generator";
import { Claim, ClaimLine, InsurancePlan, User } from "@prisma/client";

describe("EDI837Generator", () => {
  let generator: EDI837Generator;
  let mockClaim: Claim & {
    user: User;
    insurancePlan: InsurancePlan;
    claimLines: ClaimLine[];
  };

  beforeEach(() => {
    generator = new EDI837Generator();

    // Create mock data
    mockClaim = {
      id: "test-claim-1",
      userId: "test-user-1",
      reportId: "test-report-1",
      insurancePlanId: "test-plan-1",
      claimNumber: "CLM-123456",
      status: "DRAFT",
      totalCharge: 1500.00,
      allowedAmount: null,
      paidAmount: null,
      patientResponsibility: null,
      denialReason: null,
      submissionDate: null,
      processedDate: null,
      ediFileLocation: null,
      clearinghouseId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: "test-user-1",
        name: "John Doe",
        email: "john@example.com",
        password: "hashed_password",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      insurancePlan: {
        id: "test-plan-1",
        userId: "test-user-1",
        payerName: "Test Insurance",
        payerId: "TEST001",
        memberId: "M123456",
        groupNumber: "G789",
        planType: "PPO",
        isPrimary: true,
        isActive: true,
        effectiveDate: new Date(),
        termDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      claimLines: [
        {
          id: "line-1",
          claimId: "test-claim-1",
          lineNumber: 1,
          cptCode: "80053",
          description: "Comprehensive metabolic panel",
          icd10Codes: ["Z00.00"],
          charge: 500.00,
          units: 1,
          modifier: null,
          serviceDate: new Date()
        },
        {
          id: "line-2",
          claimId: "test-claim-1",
          lineNumber: 2,
          cptCode: "80061",
          description: "Lipid panel",
          icd10Codes: ["E78.5"],
          charge: 1000.00,
          units: 1,
          modifier: null,
          serviceDate: new Date()
        }
      ]
    };
  });

  it("should generate valid EDI 837 content", () => {
    const ediContent = generator.generateFromClaim(mockClaim);

    // Check for required segments
    expect(ediContent).toContain("ISA*");
    expect(ediContent).toContain("GS*HC*");
    expect(ediContent).toContain("ST*837*");
    expect(ediContent).toContain("BHT*0019*");
    expect(ediContent).toContain("NM1*41*");
    expect(ediContent).toContain("NM1*40*");
    expect(ediContent).toContain("HL*1*");
    expect(ediContent).toContain("NM1*85*");
    expect(ediContent).toContain("HL*2*");
    expect(ediContent).toContain("NM1*IL*");
    expect(ediContent).toContain("CLM*CLM-123456*");
    expect(ediContent).toContain("HI*ABK:Z00.00*ABF:E78.5");
    expect(ediContent).toContain("LX*1~");
    expect(ediContent).toContain("SV1*HC:80053*");
    expect(ediContent).toContain("LX*2~");
    expect(ediContent).toContain("SV1*HC:80061*");
    expect(ediContent).toContain("SE*");
    expect(ediContent).toContain("GE*");
    expect(ediContent).toContain("IEA*");
  });

  it("should include correct claim information", () => {
    const ediContent = generator.generateFromClaim(mockClaim);

    // Check claim details
    expect(ediContent).toContain(`CLM*${mockClaim.claimNumber}*1500.00`);
    expect(ediContent).toContain("SV1*HC:80053*500.00");
    expect(ediContent).toContain("SV1*HC:80061*1000.00");
  });

  it("should include correct subscriber information", () => {
    const ediContent = generator.generateFromClaim(mockClaim);

    // Check subscriber details
    expect(ediContent).toContain("NM1*IL*1*Doe*John");
    expect(ediContent).toContain(`MI*${mockClaim.insurancePlan.memberId}`);
  });

  it("should handle diagnosis codes correctly", () => {
    const ediContent = generator.generateFromClaim(mockClaim);

    // Check diagnosis codes
    expect(ediContent).toContain("HI*ABK:Z00.00*ABF:E78.5");
  });

  it("should format dates correctly", () => {
    const ediContent = generator.generateFromClaim(mockClaim);

    // Check date formats
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    expect(ediContent).toContain(`DTP*472*D8*${dateStr}`);
  });
}); 