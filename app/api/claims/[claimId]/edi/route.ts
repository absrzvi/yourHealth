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
    const ediContent = await fs.readFile(filePath, 'utf-8');
    
    // Log the view event for HIPAA compliance
    logger.info(`User ${session.user.id} viewed EDI content for claim ${claimId}`);
    
    return NextResponse.json({ ediContent });
  } catch (error) {
    logger.error(`Error getting EDI content: ${error}`);
    return NextResponse.json(
      { error: "Failed to get EDI content" },
      { status: 500 }
    );
  }
}
