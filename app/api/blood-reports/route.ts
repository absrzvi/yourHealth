import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bloodReportService } from "@/lib/services/blood-report.service";
import { z } from "zod";
import { BloodTestReportWithRelations } from "@/lib/services/blood-report.service";

/**
 * Validation schemas for blood report data [IV, REH]
 */
const bloodBiomarkerSchema = z.object({
  name: z.string(),
  originalName: z.string().optional(),
  value: z.string(),
  numericValue: z.number().optional(),
  unit: z.string().optional(),
  referenceRangeLow: z.number().optional(),
  referenceRangeHigh: z.number().optional(),
  referenceRangeText: z.string().optional(),
  category: z.string().optional(),
  isAbnormal: z.boolean().optional(),
  abnormalityType: z.enum(["HIGH", "LOW", "NORMAL", "UNKNOWN"]).optional(),
  clinicalSignificance: z.string().optional(),
  confidence: z.number().optional(),
  isVerified: z.boolean().optional(),
  notes: z.string().optional(),
});

const bloodReportSectionSchema = z.object({
  name: z.string(),
  order: z.number(),
  sectionText: z.string().optional(),
});

const bloodTestReportSchema = z.object({
  reportDate: z.string().transform(str => new Date(str)),
  labName: z.string().optional(),
  doctorName: z.string().optional(),
  reportIdentifier: z.string().optional(),
  patientName: z.string().optional(),
  patientDOB: z.string().optional().transform(str => str ? new Date(str) : undefined),
  patientGender: z.string().optional(),
  patientId: z.string().optional(),
  status: z.enum(["ACTIVE", "AMENDED", "DELETED"]).default("ACTIVE"),
  isVerified: z.boolean().default(false),
  notes: z.string().optional(),
  originalReportId: z.string().optional(),
  rawOcrText: z.string().optional(),
  ocrConfidence: z.number().optional(),
  parsingMethod: z.string().optional(),
  biomarkers: z.array(bloodBiomarkerSchema),
  sections: z.array(bloodReportSectionSchema).optional(),
});

/**
 * GET /api/blood-reports
 * Returns a paginated list of blood reports for the authenticated user
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

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const page = parseInt(url.searchParams.get("page") || "1");
    const status = url.searchParams.get("status") || "ACTIVE";
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;

    // Get reports using the service [CA, RM]
    const { data: reports, total, totalPages } = await bloodReportService.getUserReports(
      session.user.id,
      {
        page,
        limit,
        status: [status],
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    );

    return NextResponse.json({
      data: reports as BloodTestReportWithRelations[],
      pagination: {
        total,
        page,
        limit,
        pages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching blood reports:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch blood reports" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * POST /api/blood-reports
 * Creates a new blood report for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session [SFT]
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body [IV, REH]
    const body = await request.json();
    const validatedData = bloodTestReportSchema.parse(body);

    // Create the blood test report using the service [CA]
    const newReport = await bloodReportService.createReport(
      session.user.id,
      {
        ...validatedData,
        // Ensure report date is a Date object
        reportDate: new Date(validatedData.reportDate),
      },
      { skipDuplicates: true } // Prevent duplicate reports
    );

    return NextResponse.json({ data: newReport }, { status: 201 });
  } catch (error) {
    console.error("Error creating blood report:", error);
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
      JSON.stringify({ error: "Failed to create blood report" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
