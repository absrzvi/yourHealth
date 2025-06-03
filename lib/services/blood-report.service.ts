import { PrismaClient, BloodTestReport, BloodBiomarker, BloodReportSection, Prisma } from '@prisma/client';
import { z } from 'zod';
import { parseStringPromise } from 'xml2js';
import { parse } from 'date-fns';

// Type definitions
export type BloodTestReportWithRelations = BloodTestReport & {
  biomarkers: BloodBiomarker[];
  sections: BloodReportSection[];
};

export type BiomarkerTrend = {
  name: string;
  unit: string;
  data: Array<{
    date: Date;
    value: number;
    reportId: string;
    referenceRange?: string;
    isAbnormal?: boolean;
  }>;
};

// Validation schemas
const BloodReportCreateSchema = z.object({
  reportDate: z.date(),
  labName: z.string().optional(),
  doctorName: z.string().optional(),
  reportIdentifier: z.string().optional(),
  patientName: z.string().optional(),
  patientDOB: z.date().optional(),
  patientGender: z.string().optional(),
  patientId: z.string().optional(),
  notes: z.string().optional(),
  rawOcrText: z.string().optional(),
  ocrConfidence: z.number().optional(),
  parsingMethod: z.string().optional(),
  biomarkers: z.array(
    z.object({
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
      abnormalityType: z.enum(['HIGH', 'LOW', 'NORMAL', 'UNKNOWN']).optional(),
    })
  ),
});

/**
 * Service for managing blood test reports and related operations
 */
export class BloodReportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new blood test report with biomarkers
   */
  async createReport(
    userId: string,
    data: z.infer<typeof BloodReportCreateSchema>,
    options: { skipDuplicates?: boolean } = {}
  ): Promise<BloodTestReportWithRelations> {
    // Validate input data
    const validatedData = BloodReportCreateSchema.parse(data);
    
    // Check for duplicate reports if needed
    if (options.skipDuplicates) {
      const existingReport = await this.prisma.bloodTestReport.findFirst({
        where: {
          userId,
          reportDate: validatedData.reportDate,
          labName: validatedData.labName,
          status: 'ACTIVE',
        },
      });

      if (existingReport) {
        throw new Error('A similar report already exists');
      }
    }

    // Create the report with biomarkers in a transaction
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.bloodTestReport.create({
        data: {
          userId,
          reportDate: validatedData.reportDate,
          labName: validatedData.labName,
          doctorName: validatedData.doctorName,
          reportIdentifier: validatedData.reportIdentifier,
          patientName: validatedData.patientName,
          patientDOB: validatedData.patientDOB,
          patientGender: validatedData.patientGender,
          patientId: validatedData.patientId,
          notes: validatedData.notes,
          rawOcrText: validatedData.rawOcrText,
          ocrConfidence: validatedData.ocrConfidence,
          parsingMethod: validatedData.parsingMethod,
          status: 'ACTIVE',
          isVerified: false,
          biomarkers: {
            create: validatedData.biomarkers.map((bm) => ({
              ...bm,
              // Auto-detect abnormality if not provided
              isAbnormal: bm.isAbnormal ?? this.detectAbnormality(bm),
              abnormalityType: bm.abnormalityType ?? this.getAbnormalityType(bm),
            })),
          },
        },
        include: {
          biomarkers: true,
          sections: true,
        },
      });

      return report;
    });
  }

  /**
   * Get a blood test report by ID with all related data
   */
  async getReportById(
    userId: string,
    reportId: string
  ): Promise<BloodTestReportWithRelations | null> {
    return this.prisma.bloodTestReport.findUnique({
      where: { id: reportId, userId },
      include: {
        biomarkers: true,
        sections: true,
      },
    });
  }

  /**
   * Get all blood test reports for a user with pagination
   */
  async getUserReports(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string[];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    data: BloodTestReportWithRelations[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BloodTestReportWhereInput = {
      userId,
      status: { in: options.status ?? ['ACTIVE'] },
    };

    if (options.startDate || options.endDate) {
      where.reportDate = {};
      if (options.startDate) where.reportDate.gte = options.startDate;
      if (options.endDate) where.reportDate.lte = options.endDate;
    }

    const [total, data] = await Promise.all([
      this.prisma.bloodTestReport.count({ where }),
      this.prisma.bloodTestReport.findMany({
        where,
        include: {
          biomarkers: {
            take: 5, // Only include a few biomarkers for the list view
            orderBy: { isAbnormal: 'desc' }, // Show abnormal results first
          },
          sections: true,
        },
        orderBy: { reportDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get biomarker trends for a user over time
   */
  async getBiomarkerTrends(
    userId: string,
    biomarkerNames: string[],
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<BiomarkerTrend[]> {
    const { startDate, endDate, limit = 100 } = options;

    // Get all matching biomarkers across reports
    const biomarkers = await this.prisma.bloodBiomarker.findMany({
      where: {
        name: { in: biomarkerNames },
        report: {
          userId,
          status: 'ACTIVE',
          reportDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        numericValue: { not: null },
      },
      include: {
        report: {
          select: {
            id: true,
            reportDate: true,
          },
        },
      },
      orderBy: {
        report: {
          reportDate: 'asc',
        },
      },
      take: limit,
    });

    // Group by biomarker name
    const trends = new Map<string, BiomarkerTrend>();

    for (const bm of biomarkers) {
      if (!bm.numericValue || !bm.report) continue;

      const trend = trends.get(bm.name) || {
        name: bm.name,
        unit: bm.unit || '',
        data: [],
      };

      trend.data.push({
        date: bm.report.reportDate,
        value: bm.numericValue,
        reportId: bm.report.id,
        referenceRange: this.formatReferenceRange(bm),
        isAbnormal: bm.isAbnormal ?? false,
      });

      trends.set(bm.name, trend);
    }

    return Array.from(trends.values());
  }

  /**
   * Parse raw OCR text into structured blood test data
   */
  async parseOcrText(ocrText: string): Promise<z.infer<typeof BloodReportCreateSchema>> {
    // This is a simplified implementation. In a real app, you would use more sophisticated
    // NLP or pattern matching to extract data from the OCR text.
    
    // For now, we'll return a basic structure that needs to be completed by the user
    return {
      reportDate: new Date(),
      rawOcrText: ocrText,
      ocrConfidence: 0.8, // Example confidence score
      parsingMethod: 'generic',
      biomarkers: [], // Would be populated by actual parsing logic
    };
  }

  /**
   * Delete a blood test report (soft delete)
   */
  async deleteReport(userId: string, reportId: string): Promise<BloodTestReport> {
    return this.prisma.bloodTestReport.update({
      where: { id: reportId, userId },
      data: { status: 'DELETED' },
    });
  }

  /**
   * Get summary statistics for a user's blood tests
   */
  async getSummaryStats(userId: string): Promise<{
    totalReports: number;
    abnormalResults: number;
    firstTestDate: Date | null;
    lastTestDate: Date | null;
    categories: Array<{
      name: string;
      count: number;
      abnormalCount: number;
    }>;
  }> {
    const [totalReports, firstReport, lastReport, categoryStats] = await Promise.all([
      this.prisma.bloodTestReport.count({
        where: { userId, status: 'ACTIVE' },
      }),
      this.prisma.bloodTestReport.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { reportDate: 'asc' },
        select: { reportDate: true },
      }),
      this.prisma.bloodTestReport.findFirst({
        where: { userId, status: 'ACTIVE' },
        orderBy: { reportDate: 'desc' },
        select: { reportDate: true },
      }),
      this.prisma.$queryRaw`
        SELECT 
          category,
          COUNT(*) as count,
          SUM(CASE WHEN "isAbnormal" = true THEN 1 ELSE 0 END) as "abnormalCount"
        FROM "BloodBiomarker"
        WHERE "reportId" IN (
          SELECT id FROM "BloodTestReport" 
          WHERE "userId" = ${userId} AND status = 'ACTIVE'
        )
        GROUP BY category
        ORDER BY count DESC
      ` as Promise<Array<{ category: string; count: bigint; abnormalCount: bigint }>>,
    ]);

    return {
      totalReports,
      abnormalResults: await this.prisma.bloodBiomarker.count({
        where: {
          report: { userId, status: 'ACTIVE' },
          isAbnormal: true,
        },
      }),
      firstTestDate: firstReport?.reportDate || null,
      lastTestDate: lastReport?.reportDate || null,
      categories: categoryStats.map((cat) => ({
        name: cat.category || 'Uncategorized',
        count: Number(cat.count),
        abnormalCount: Number(cat.abnormalCount),
      })),
    };
  }

  // Helper methods
  private detectAbnormality(biomarker: {
    numericValue?: number | null;
    referenceRangeLow?: number | null;
    referenceRangeHigh?: number | null;
  }): boolean {
    if (biomarker.numericValue === undefined) return false;
    return (
      (biomarker.referenceRangeLow !== null && biomarker.numericValue < biomarker.referenceRangeLow!) ||
      (biomarker.referenceRangeHigh !== null && biomarker.numericValue > biomarker.referenceRangeHigh!)
    );
  }

  private getAbnormalityType(biomarker: {
    numericValue?: number | null;
    referenceRangeLow?: number | null;
    referenceRangeHigh?: number | null;
  }): 'HIGH' | 'LOW' | 'NORMAL' | 'UNKNOWN' {
    if (biomarker.numericValue === undefined) return 'UNKNOWN';
    
    if (biomarker.referenceRangeLow !== null && biomarker.numericValue < biomarker.referenceRangeLow) {
      return 'LOW';
    }
    
    if (biomarker.referenceRangeHigh !== null && biomarker.numericValue > biomarker.referenceRangeHigh) {
      return 'HIGH';
    }
    
    return 'NORMAL';
  }

  private formatReferenceRange(biomarker: {
    referenceRangeLow?: number | null;
    referenceRangeHigh?: number | null;
    unit?: string | null;
  }): string {
    const { referenceRangeLow, referenceRangeHigh, unit } = biomarker;
    
    if (referenceRangeLow !== null && referenceRangeHigh !== null) {
      return `${referenceRangeLow} - ${referenceRangeHigh} ${unit || ''}`.trim();
    }
    
    if (referenceRangeLow !== null) {
      return `> ${referenceRangeLow} ${unit || ''}`.trim();
    }
    
    if (referenceRangeHigh !== null) {
      return `< ${referenceRangeHigh} ${unit || ''}`.trim();
    }
    
    return 'N/A';
  }
}

// Singleton instance
export const bloodReportService = new BloodReportService(new PrismaClient());