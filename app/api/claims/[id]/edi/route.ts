import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { logger } from '@/lib/logger';
import { EDI837Generator } from '@/lib/claims/edi/generator';
import { Claim, ClaimLine, InsurancePlan, User } from '@/src/lib/claims/types/claims.types';
import { Prisma } from '@prisma/client';

const EDI_DIR = path.join(process.cwd(), "edi-files");

// Ensure EDI directory exists
try {
  if (!existsSync(EDI_DIR)) {
    fs.mkdir(EDI_DIR, { recursive: true });
    logger.info(`Created EDI directory: ${EDI_DIR}`);
  }
} catch (error) {
  logger.error(`Failed to create EDI directory: ${error}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check for action parameter
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized access' }),
        { status: 401 }
      );
    }
    
    // Log the action for HIPAA compliance
    logger.info(`User ${session.user.id} accessing EDI for claim ${params.id} with action: ${action || 'view'}`);

    const claimId = params.id;
    
    // Fetch claim to verify ownership
    interface ClaimData {
      userId: string;
      ediFileLocation?: string | null;
    }
    
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        userId: true,
        ediFileLocation: true,
      }
    }) as ClaimData | null;

    if (!claim) {
      return new NextResponse(
        JSON.stringify({ message: 'Claim not found' }),
        { status: 404 }
      );
    }

    // Ensure the claim belongs to the user
    if (claim.userId !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized access to this claim' }),
        { status: 403 }
      );
    }

    // If no EDI file exists yet
    if (!claim.ediFileLocation) {
      return new NextResponse(
        JSON.stringify({ message: 'No EDI file exists for this claim' }),
        { status: 404 }
      );
    }

    // Handle different actions based on the query parameter
    switch (action) {
      case 'status':
        return await handleStatusAction(claimId, claim);
      case 'download':
        return await handleDownloadAction(claimId, claim);
      case 'generate':
        return await handleGenerateAction(claimId, claim, session as { user: { id: string } });
      default: {
        // Using block scope to contain lexical declarations
        // Default behavior - fetch EDI content
        interface EDIFile {
          content: string;
          filePath: string;
          fileName: string;
          createdAt: Date;
        }
        
        interface EDIFileQuery {
          where: { claimId: string };
          orderBy: { createdAt: 'asc' | 'desc' };
        }
        
        const ediFile = await (prisma as unknown as { ediFile: { findFirst: (args: EDIFileQuery) => Promise<EDIFile | null> } }).ediFile.findFirst({
          where: { 
            claimId: claimId 
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (!ediFile) {
          return new NextResponse(
            JSON.stringify({ message: 'EDI file reference exists but content not found' }),
            { status: 404 }
          );
        }

        return NextResponse.json({ 
          message: 'EDI file retrieved successfully', 
          ediContent: ediFile.content,
          filePath: ediFile.filePath,
          fileName: ediFile.fileName,
          createdAt: ediFile.createdAt
        });
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error processing EDI request:', errorMessage);
    return new NextResponse(
      JSON.stringify({ 
        message: 'Failed to process EDI request', 
        error: errorMessage 
      }),
      { status: 500 }
    );
  }
}

// Helper function to handle status action
async function handleStatusAction(claimId: string, claim: { ediFileLocation?: string | null }) {
  try {
    // Check if EDI file exists
    if (!claim.ediFileLocation) {
      return NextResponse.json(
        { error: "EDI file not generated yet" },
        { status: 404 }
      );
    }

    const filePath = path.join(EDI_DIR, claim.ediFileLocation);

    // Check if file exists on disk
    if (!existsSync(filePath)) {
      logger.warn(`EDI file not found on disk: ${filePath}`);
      return NextResponse.json(
        { error: "EDI file not found on disk" },
        { status: 404 }
      );
    }

    // Get file stats
    const stats = statSync(filePath);

    // Return file details
    return NextResponse.json({
      fileName: claim.ediFileLocation,
      createdAt: stats.birthtime.toISOString(),
      size: stats.size,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error getting EDI status: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to get EDI status" },
      { status: 500 }
    );
  }
}

// Helper function to handle EDI generation action
async function handleGenerateAction(
  claimId: string, 
  claim: { ediFileLocation?: string | null; userId?: string }, 
  session: { user: { id: string } }
) {
  try {
    // Fetch complete claim data with all necessary relations for EDI generation
    const fullClaim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        insurancePlan: true,
        claimLines: true
      }
    });

    if (!fullClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Generate EDI
    const generator = new EDI837Generator();
    
    // Create adapter to match expected types with Prisma model
    // We need to convert the Prisma model to match the EDI types
    const adaptedClaim = {
      ...fullClaim,
      insurancePlan: {
        ...fullClaim.insurancePlan,
        terminationDate: fullClaim.insurancePlan.termDate // Map termDate to terminationDate
      } as unknown as InsurancePlan,
      user: fullClaim.user as unknown as User,
      claimLines: fullClaim.claimLines.map(line => {
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
          console.error("Error parsing icd10Codes:", e);
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
    
    // Use claim number for filename
    const fileName = `${fullClaim.claimNumber}.edi`;
    const filePath = path.join(EDI_DIR, fileName);
    
    // Write EDI file to disk
    await fs.writeFile(filePath, ediContent, 'utf-8');
    
    // Update claim with EDI file location and status
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        ediFileLocation: fileName,
        status: "READY"
      }
    });
    
    // Log the generation for HIPAA compliance
    logger.info(`EDI file generated for claim ${claimId} by user ${session.user.id}`);
    
    return NextResponse.json({
      success: true,
      fileName,
      ediContent
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error generating EDI file: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to generate EDI file" },
      { status: 500 }
    );
  }
}

// Helper function to handle download action
async function handleDownloadAction(claimId: string, claim: { ediFileLocation?: string | null }) {
  try {
    // Check if EDI file exists
    if (!claim.ediFileLocation) {
      return NextResponse.json(
        { error: "EDI file not generated yet" },
        { status: 404 }
      );
    }

    const filePath = path.join(EDI_DIR, claim.ediFileLocation);

    // Check if file exists on disk
    if (!existsSync(filePath)) {
      logger.warn(`EDI file not found on disk: ${filePath}`);
      return NextResponse.json(
        { error: "EDI file not found on disk" },
        { status: 404 }
      );
    }

    // Read file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Log the download for HIPAA compliance
    logger.info(`EDI file downloaded for claim ${claimId}`);
    
    // Return file as downloadable content
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${claim.ediFileLocation}"`,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error downloading EDI file: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to download EDI file" },
      { status: 500 }
    );
  }
}
