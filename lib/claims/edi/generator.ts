import { Claim, ClaimLine, InsurancePlan, User } from "@prisma/client";

export class EDI837Generator {
  private segments: string[] = [];
  private segmentCount = 0;

  constructor(
    private submitterId: string = "FORYOURHEALTH",
    private receiverId: string = "CLEARINGHOUSE"
  ) { }

  generateFromClaim(claim: Claim & {
    user: User;
    insurancePlan: InsurancePlan;
    claimLines: ClaimLine[];
  }): string {
    this.segments = [];
    this.segmentCount = 0;

    // Add all required segments in order
    this.addISA();
    this.addGS();
    this.addST();
    this.addBHT(claim.claimNumber);
    this.addSubmitterName();
    this.addReceiverName();
    this.addBillingProvider(claim);
    this.addSubscriber(claim);
    this.addPatient(claim);
    this.addClaimInformation(claim);
    this.addServiceLines(claim);
    this.addSE();
    this.addGE();
    this.addIEA();

    return this.segments.join("");
  }

  private addISA() {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, "");
    const timeStr = date.toTimeString().slice(0, 5).replace(":", "");

    this.addSegment([
      "ISA",
      "00",
      "          ",
      "00",
      "          ",
      "ZZ",
      this.padRight(this.submitterId, 15),
      "ZZ",
      this.padRight(this.receiverId, 15),
      dateStr,
      timeStr,
      "^",
      "00501",
      "000000001",
      "0",
      "P",
      ":"
    ]);
  }

  private addGS() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, "");

    this.addSegment([
      "GS",
      "HC",
      this.submitterId,
      this.receiverId,
      dateStr,
      timeStr,
      "1",
      "X",
      "005010X222A1"
    ]);
  }

  private addST() {
    this.addSegment(["ST", "837", "0001", "005010X222A1"]);
  }

  private addBHT(claimNumber: string) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = date.toTimeString().slice(0, 4).replace(":", "");

    this.addSegment([
      "BHT",
      "0019",
      "00",
      claimNumber,
      dateStr,
      timeStr,
      "CH"
    ]);
  }

  private addSubmitterName() {
    this.addSegment([
      "NM1",
      "41",
      "2",
      "FOR YOUR HEALTH",
      "",
      "",
      "",
      "",
      "46",
      this.submitterId
    ]);
  }

  private addReceiverName() {
    this.addSegment([
      "NM1",
      "40",
      "2",
      "CLEARINGHOUSE",
      "",
      "",
      "",
      "",
      "46",
      this.receiverId
    ]);
  }

  private addBillingProvider(claim: any) {
    // Loop 2000A - Billing Provider
    this.addSegment(["HL", "1", "", "20", "1"]);

    // Loop 2010AA - Billing Provider Name
    this.addSegment([
      "NM1",
      "85",
      "2",
      "FOR YOUR HEALTH LAB",
      "",
      "",
      "",
      "",
      "XX",
      "1234567890" // NPI
    ]);

    this.addSegment(["N3", "123 HEALTH STREET"]);
    this.addSegment(["N4", "LOS ANGELES", "CA", "90001"]);
  }

  private addSubscriber(claim: any) {
    // Loop 2000B - Subscriber
    this.addSegment(["HL", "2", "1", "22", "0"]);

    // Loop 2010BA - Subscriber Name
    const user = claim.user;
    this.addSegment([
      "NM1",
      "IL",
      "1",
      user.name?.split(" ")[1] || "DOE",
      user.name?.split(" ")[0] || "JOHN",
      "",
      "",
      "",
      "MI",
      claim.insurancePlan.memberId
    ]);

    this.addSegment(["DMG", "D8", "19800101", "M"]); // Demo data
  }

  private addPatient(claim: any) {
    // For self, patient same as subscriber
    // In production, would check if different
  }

  private addClaimInformation(claim: any) {
    // Loop 2300 - Claim Information
    this.addSegment([
      "CLM",
      claim.claimNumber,
      claim.totalCharge.toFixed(2),
      "",
      "",
      "11:B:1",
      "Y",
      "A",
      "Y",
      "Y"
    ]);

    // Add diagnosis codes
    const diagnoses = this.extractDiagnosisCodes(claim);
    if (diagnoses.length > 0) {
      const hiSegment = ["HI"];
      diagnoses.forEach((code, index) => {
        hiSegment.push(`${index === 0 ? "ABK" : "ABF"}:${code}`);
      });
      this.addSegment(hiSegment);
    }
  }

  private addServiceLines(claim: any) {
    claim.claimLines.forEach((line: any, index: number) => {
      // Loop 2400 - Service Line
      this.addSegment(["LX", (index + 1).toString()]);

      // Professional Service
      this.addSegment([
        "SV1",
        `HC:${line.cptCode}${line.modifier ? `:${line.modifier}` : ""}`,
        line.charge.toFixed(2),
        "UN",
        line.units.toString(),
        "",
        "",
        "1" // Diagnosis code pointer
      ]);

      // Service Date
      const serviceDate = new Date(line.serviceDate)
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      this.addSegment(["DTP", "472", "D8", serviceDate]);
    });
  }

  private addSE() {
    this.addSegment(["SE", (this.segmentCount + 1).toString(), "0001"]);
  }

  private addGE() {
    this.addSegment(["GE", "1", "1"]);
  }

  private addIEA() {
    this.addSegment(["IEA", "1", "000000001"]);
  }

  private addSegment(elements: string[]) {
    this.segments.push(elements.join("*") + "~\n");
    this.segmentCount++;
  }

  private padRight(str: string, length: number): string {
    return str.padEnd(length, " ");
  }

  private extractDiagnosisCodes(claim: any): string[] {
    const codes = new Set<string>();
    claim.claimLines.forEach((line: any) => {
      if (line.icd10Codes && Array.isArray(line.icd10Codes)) {
        line.icd10Codes.forEach((code: string) => codes.add(code));
      }
    });
    return Array.from(codes).slice(0, 12); // Max 12 diagnosis codes
  }
} 