import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { logger } from "../../../../../lib/logger";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const prisma = new PrismaClient();
const EDI_DIR = path.join(process.cwd(), "edi-files");

export async function GET(
  request: NextRequest,
  { params }: { params: { claimId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claimId = params.claimId;

    // Get claim with EDI file location
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        id: true,
        userId: true,
        claimNumber: true,
        ediFileLocation: true,
      },
    });

    // Check if claim exists and belongs to user
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    
    // Create a response with the file content
    const response = new NextResponse(fileContent);
    
    // Set appropriate headers for file download
    response.headers.set('Content-Type', 'text/plain');
    response.headers.set('Content-Disposition', `attachment; filename="Claim-${claim.claimNumber}-EDI.837"`);
    
    // Log the download event for HIPAA compliance
    logger.info(`User ${session.user.id} downloaded EDI file for claim ${claim.claimNumber}`);
    
    return response;
  } catch (error) {
    logger.error(`Error downloading EDI file: ${error}`);
    return NextResponse.json(
      { error: "Failed to download EDI file" },
      { status: 500 }
    );
  }
}
