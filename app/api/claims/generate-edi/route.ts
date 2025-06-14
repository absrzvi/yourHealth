import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma, ClaimStatus } from "@prisma/client";
import { EDI837Generator } from "../../../../lib/claims/edi";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Directory to store generated EDI files
const EDI_DIR = path.join(process.cwd(), "edi-files");

// Ensure EDI directory exists
async function ensureEdiDir() {
  if (!existsSync(EDI_DIR)) {
    await mkdir(EDI_DIR, { recursive: true });
  }
  return EDI_DIR;
}

/**
 * POST /api/claims/generate-edi
 * Generates an EDI 837 file for a claim
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      logger.warn("Unauthorized EDI generation attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId } = await request.json();
    
    if (!claimId) {
      return NextResponse.json(
        { error: "Missing required field: claimId" },
        { status: 400 }
      );
    }

    logger.info(`Generating EDI for claim ${claimId}`);

    // Fetch the claim with related data
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        insurancePlan: true,
        claimLines: {
          orderBy: { lineNumber: 'asc' }
        },
        report: {
          include: {
            biomarkers: true
          }
        }
      }
    });

    // Validate claim exists and belongs to user
    if (!claim || claim.userId !== session.user.id) {
      logger.warn(`Claim not found or access denied: ${claimId}`);
      return NextResponse.json(
        { error: "Claim not found or access denied" },
        { status: 404 }
      );
    }

    // Ensure claim is in a valid state for EDI generation
    if (claim.status !== 'DRAFT' && claim.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Claim must be in DRAFT or PENDING status, current status: ${claim.status}` },
        { status: 400 }
      );
    }

    // Generate EDI using our enhanced generator
    const generator = new EDI837Generator();
    let ediContent: string;
    
    try {
      // Convert Prisma model to format expected by EDI generator
      const enhancedClaim = {
        ...claim,
        // Map insurance plan fields
        insurancePlan: claim.insurancePlan ? {
          ...claim.insurancePlan,
          // Map any necessary field renames or transformations
          terminationDate: claim.insurancePlan.termDate,
        } : null,
        // Process claim lines
        claimLines: claim.claimLines.map(line => ({
          ...line,
          // Ensure icd10Codes is always an array of strings
          icd10Codes: parseIcd10Codes(line.icd10Codes),
          // Ensure required fields have defaults
          serviceFacilityName: line.serviceFacilityName || null,
          serviceFacilityNpi: line.serviceFacilityNpi || null,
          renderingProviderNpi: line.renderingProviderNpi || null,
          referringProviderNpi: line.referringProviderNpi || null,
        })),
        // Include report biomarkers if available
        report: claim.report ? {
          ...claim.report,
          biomarkers: claim.report.biomarkers || []
        } : null
      };

      // Generate the EDI content
      ediContent = await generator.generateEDI(enhancedClaim);
      
    } catch (error) {
      logger.error(`EDI generation failed for claim ${claimId}:`, error);
      return NextResponse.json(
        { 
          error: "Failed to generate EDI content", 
          details: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }

    // Ensure EDI directory exists
    await ensureEdiDir();
    
    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `claim-${claim.claimNumber}-${timestamp}.edi`;
    const filePath = path.join(EDI_DIR, fileName);
    
    try {
      // Save the EDI file
      await writeFile(filePath, ediContent);
      logger.info(`EDI file generated: ${fileName}`);

      // Update the claim with EDI file info
      await prisma.claim.update({
        where: { id: claimId },
        data: {
          ediFileLocation: fileName,
          status: 'SUBMITTED' as ClaimStatus,
          submittedAt: new Date(),
          // Add a claim event
          claimEvents: {
            create: {
              eventType: 'EDI_GENERATED',
              description: 'EDI 837 file generated',
              userId: session.user.id
            }
          }
        }
      });

      // Log the EDI generation
      await prisma.auditLog.create({
        data: {
          action: 'EDI_GENERATED',
          entityType: 'CLAIM',
          entityId: claimId,
          userId: session.user.id,
          details: {
            fileName,
            claimNumber: claim.claimNumber
          }
        }
      });

      return NextResponse.json({ 
        success: true, 
        fileName,
        claimId: claim.id,
        claimNumber: claim.claimNumber,
        status: 'SUBMITTED'
      });

    } catch (error) {
      logger.error(`Failed to save EDI file for claim ${claimId}:`, error);
      return NextResponse.json(
        { 
          error: "Failed to save EDI file", 
          details: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error("Error in EDI generation endpoint:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to parse ICD-10 codes from various formats
 */
function parseIcd10Codes(icd10Codes: any): string[] {
  if (!icd10Codes) return [];
  
  try {
    // If it's already an array of strings, return as is
    if (Array.isArray(icd10Codes)) {
      return icd10Codes.map(code => String(code).trim()).filter(Boolean);
    }
    
    // If it's a JSON string, parse it
    if (typeof icd10Codes === 'string') {
      const parsed = JSON.parse(icd10Codes);
      return Array.isArray(parsed) 
        ? parsed.map(code => String(code).trim()).filter(Boolean)
        : [String(parsed).trim()].filter(Boolean);
    }
    
    // If it's an object with array values, extract the first array
    if (typeof icd10Codes === 'object' && icd10Codes !== null) {
      const values = Object.values(icd10Codes);
      const firstArray = values.find(Array.isArray);
      if (firstArray) {
        return firstArray.map(code => String(code).trim()).filter(Boolean);
      }
      return [String(icd10Codes).trim()].filter(Boolean);
    }
    
    // Fallback
    return [String(icd10Codes).trim()].filter(Boolean);
  } catch (error) {
    logger.error("Error parsing ICD-10 codes:", error);
    return [];
  }
}
