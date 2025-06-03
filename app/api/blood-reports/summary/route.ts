import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bloodReportService } from "@/lib/services/blood-report.service";
import { z } from "zod";

// Validation schema for query parameters
const summaryQuerySchema = z.object({
  startDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

/**
 * GET /api/blood-reports/summary
 * Returns summary statistics for the authenticated user's blood reports
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

    // Parse and validate query parameters [IV, REH]
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { startDate, endDate } = summaryQuerySchema.parse(queryParams);

    // Get summary statistics from the service [CA]
    const summary = await bloodReportService.getSummaryStats(session.user.id);

    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error("Error fetching blood report summary:", error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid query parameters", details: error.errors }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch blood report summary" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// No other HTTP methods are allowed for this endpoint
export { GET };
