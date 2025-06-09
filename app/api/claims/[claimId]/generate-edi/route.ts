import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient, Prisma } from "@prisma/client";
import { EDI837Generator } from "../../../../../lib/claims/edi/generator";
import { Claim, ClaimLine, InsurancePlan, User } from "../../../../../src/lib/claims/types/claims.types";
import { logger } from "../../../../../lib/logger";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

const prisma = new PrismaClient();
const EDI_DIR = path.join(process.cwd(), "edi-files");

export async function POST(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claimId = params.claimId;

    // Get claim with related data
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        insurancePlan: true,
        claimLines: true
      }
    });

    // Check if claim exists and belongs to user
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate EDI
    const generator = new EDI837Generator();
    
    // Create adapter to match expected types with Prisma model
    const adaptedClaim = {
      ...claim,
      insurancePlan: {
        ...claim.insurancePlan,
        terminationDate: claim.insurancePlan.termDate // Map termDate to terminationDate
      } as unknown as InsurancePlan,
      user: claim.user as unknown as User,
      claimLines: claim.claimLines.map(line => {
        // Convert JsonValue to string[] for icd10Codes
        let icd10CodeArray: string[] = [];
        try {
          if (typeof line.icd10Codes === 'string') {
            icd10CodeArray = JSON.parse(line.icd10Codes);
          } else if (Array.isArray(line.icd10Codes)) {
            icd10CodeArray = line.icd10Codes.map(code => String(code));
          } else if (line.icd10Codes && typeof line.icd10Codes === 'object') {
            // Try to extract array from JSON object
            const jsonObj = line.icd10Codes as Prisma.JsonObject;
            if (jsonObj && Array.isArray(Object.values(jsonObj)[0])) {
              icd10CodeArray = Object.values(jsonObj)[0] as string[];
            }
          }
        } catch (e) {
          logger.error("Error parsing icd10Codes:", e);
          icd10CodeArray = [];
        }

        return {
          ...line,
          icd10Codes: icd10CodeArray,
          // Add missing properties required by the EDI generator
          serviceFacilityName: null,
          serviceFacilityNpi: null,
          renderingProviderNpi: null,
          referringProviderNpi: null
        } as unknown as ClaimLine;
      })
    } as unknown as Claim & { user: User; insurancePlan: InsurancePlan; claimLines: ClaimLine[] };
    
    const ediContent = generator.generateFromClaim(adaptedClaim);

    // Ensure EDI directory exists
    if (!existsSync(EDI_DIR)) {
      await mkdir(EDI_DIR, { recursive: true });
    }

    // Save EDI file
    const fileName = `${claim.claimNumber}.edi`;
    const filePath = path.join(EDI_DIR, fileName);
    await writeFile(filePath, ediContent);

    // Update claim
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        ediFileLocation: fileName,
        status: "READY"
      }
    });

    // Log the generation event for HIPAA compliance
    logger.info(`User ${session.user.id} generated EDI file for claim ${claim.claimNumber}`);

    return NextResponse.json({
      success: true,
      fileName,
      ediContent
    });
  } catch (error) {
    logger.error(`Error generating EDI: ${error}`);
    return NextResponse.json(
      { error: "Failed to generate EDI" },
      { status: 500 }
    );
  }
}
