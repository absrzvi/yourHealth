import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { EDI837Generator } from "@/lib/claims/edi/generator";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const EDI_DIR = path.join(process.cwd(), "edi-files");

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId } = await request.json();

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        insurancePlan: true,
        claimLines: true
      }
    });

    if (!claim || claim.userId !== session.user.id) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Generate EDI
    const generator = new EDI837Generator();
    const ediContent = generator.generateFromClaim(claim);

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

    return NextResponse.json({
      success: true,
      fileName,
      ediContent
    });
  } catch (error) {
    console.error("EDI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate EDI" },
      { status: 500 }
    );
  }
} 