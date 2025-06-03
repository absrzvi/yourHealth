import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for updating biomarker data [IV, REH]
const updateBiomarkerSchema = z.object({
  name: z.string().optional(),
  originalName: z.string().optional(),
  value: z.string().optional(),
  numericValue: z.number().optional(),
  unit: z.string().optional(),
  referenceRangeLow: z.number().optional(),
  referenceRangeHigh: z.number().optional(),
  referenceRangeText: z.string().optional(),
  category: z.string().optional(),
  isAbnormal: z.boolean().optional(),
  abnormalityType: z.enum(["HIGH", "LOW", "NORMAL", "UNKNOWN"]).optional(),
  clinicalSignificance: z.string().optional(),
  isVerified: z.boolean().optional(),
  notes: z.string().optional(),
});

/**
 * Middleware to verify biomarker ownership and access rights
 */
async function verifyBiomarkerAccess(biomarkerId: string, userId: string) {
  // Find the biomarker
  const biomarker = await prisma.bloodBiomarker.findUnique({
    where: { id: biomarkerId },
    include: {
      report: {
        select: {
          userId: true,
          status: true,
        },
      },
    },
  });

  // Check if biomarker exists and belongs to the user
  if (!biomarker || biomarker.report.userId !== userId) {
    return null;
  }

  // Check if the report is not deleted
  if (biomarker.report.status === "DELETED") {
    return null;
  }

  return biomarker;
}

/**
 * GET /api/blood-reports/biomarkers/[id]
 * Returns a specific biomarker by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated session [SFT]
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;

    // Verify biomarker access
    const biomarker = await verifyBiomarkerAccess(id, session.user.id);
    if (!biomarker) {
      return new NextResponse(JSON.stringify({ error: "Biomarker not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return NextResponse.json({ data: biomarker });
  } catch (error) {
    console.error("Error fetching biomarker:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch biomarker" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * PATCH /api/blood-reports/biomarkers/[id]
 * Updates a specific biomarker
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated session [SFT]
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;

    // Verify biomarker access
    const biomarker = await verifyBiomarkerAccess(id, session.user.id);
    if (!biomarker) {
      return new NextResponse(JSON.stringify({ error: "Biomarker not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateBiomarkerSchema.parse(body);

    // Calculate isAbnormal if numeric values are provided
    let isAbnormal = validatedData.isAbnormal;
    
    if (
      validatedData.numericValue !== undefined &&
      (validatedData.referenceRangeLow !== undefined || 
       validatedData.referenceRangeHigh !== undefined)
    ) {
      isAbnormal = 
        (validatedData.referenceRangeLow !== undefined && 
         validatedData.numericValue < validatedData.referenceRangeLow) || 
        (validatedData.referenceRangeHigh !== undefined && 
         validatedData.numericValue > validatedData.referenceRangeHigh);
    }

    // Update the biomarker
    const updatedBiomarker = await prisma.bloodBiomarker.update({
      where: { id },
      data: {
        ...validatedData,
        isAbnormal,
      },
    });

    return NextResponse.json({ data: updatedBiomarker });
  } catch (error) {
    console.error("Error updating biomarker:", error);
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: "Validation error", details: error.errors }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new NextResponse(
      JSON.stringify({ error: "Failed to update biomarker" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * DELETE /api/blood-reports/biomarkers/[id]
 * Deletes a specific biomarker
 * This should be used with caution as it permanently removes the biomarker
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;

    // Verify biomarker access
    const biomarker = await verifyBiomarkerAccess(id, session.user.id);
    if (!biomarker) {
      return new NextResponse(JSON.stringify({ error: "Biomarker not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the biomarker
    await prisma.bloodBiomarker.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: "Biomarker deleted successfully",
      id
    });
  } catch (error) {
    console.error("Error deleting biomarker:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete biomarker" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
