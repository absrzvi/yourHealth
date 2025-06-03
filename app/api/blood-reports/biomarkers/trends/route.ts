import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { models } from "@/lib/prisma-helpers";
import { z } from "zod";

// Schema for trend request validation
const trendRequestSchema = z.object({
  name: z.string(),
  limit: z.coerce.number().int().positive().optional().default(10),
});

/**
 * GET /api/blood-reports/biomarkers/trends
 * Returns historical data for a specific biomarker across all reports
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session [SFT]
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = trendRequestSchema.parse({
      name: searchParams.get("name"),
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    const { name, limit } = validatedParams;

    // Get biomarker data across reports
    const biomarkers = await models.bloodBiomarker.findMany({
      where: {
        name,
        report: {
          userId: session.user.id,
          status: {
            not: "DELETED", // Exclude deleted reports
          },
        },
      },
      include: {
        report: {
          select: {
            reportDate: true,
            labName: true,
          },
        },
      },
      orderBy: [
        {
          report: {
            reportDate: "asc",
          },
        },
        {
          createdAt: "asc",
        },
      ],
      take: limit,
    });

    // Transform data for API response
    const trendData = biomarkers.map((biomarker) => ({
      id: biomarker.id,
      name: biomarker.name,
      value: biomarker.value,
      numericValue: biomarker.numericValue,
      unit: biomarker.unit,
      referenceRangeLow: biomarker.referenceRangeLow,
      referenceRangeHigh: biomarker.referenceRangeHigh,
      isAbnormal: biomarker.isAbnormal,
      date: biomarker.report.reportDate,
      labName: biomarker.report.labName,
    }));

    return NextResponse.json({
      data: trendData,
      meta: {
        biomarker: name,
        count: trendData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching biomarker trends:", error);
    
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
      JSON.stringify({ error: "Failed to fetch biomarker trends" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
