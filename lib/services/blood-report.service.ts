import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaClient, BloodBiomarker, BloodReportSection, BloodTestReport, Prisma } from '@prisma/client';
import * as z from 'zod';

type AbnormalityType = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICALLY_LOW' | 'CRITICALLY_HIGH' | 'UNKNOWN';

interface BiomarkerWithAbnormality extends Omit<BloodBiomarker, 'abnormalityType'> {
  abnormality: AbnormalityType;
  formattedReferenceRange: string;
  isAbnormal: boolean;
  sectionId: string | null;
  category: string | null;
  notes: string | null;
  clinicalSignificance: string | null;
  confidence: number | null;
  originalName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EnrichedSection extends Omit<BloodReportSection, 'parentSectionId'> {
  biomarkers: BiomarkerWithAbnormality[];
  sections: EnrichedSection[];
  isVerified: boolean;
  notes: string | null;
  parentSectionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface BloodTestReportWithRelations extends Omit<BloodTestReport, 'biomarkers' | 'sections' | 'amendedVersions'> {
  biomarkers: BiomarkerWithAbnormality[];
  sections: EnrichedSection[];
  amendedVersions: Array<{
    id: string;
    reportVersion: number;
    createdAt: Date;
  }>;
  reportDate: Date;
  labName: string | null;
  doctorName: string | null;
  notes: string | null;
  status: string;
  isVerified: boolean;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  reportVersion: number;
  isAmended: boolean;
  originalReportId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type BiomarkerTrend = {
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

type CreateReportInput = z.infer<typeof BloodReportCreateSchema>;

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
  sections: z.array(
    z.object({
      name: z.string(),
      order: z.number(),
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
    })
  ),
});

@Injectable()
export class BloodReportService {
  private readonly logger = new Logger(BloodReportService.name);

  constructor(private readonly prisma: PrismaClient) {}

  private detectAbnormality(
    value: string | number | null | undefined,
    referenceRange: string | null | undefined,
    unit: string | null = null
  ): AbnormalityType {
    if (!value || !referenceRange) {
      return 'UNKNOWN';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return 'UNKNOWN';
    }

    return this.detectAbnormalityFromNumeric(numValue, referenceRange, unit);
  }

  private detectAbnormalityFromNumeric(
    valueOrBiomarker: number | {
      numericValue?: number | null;
      referenceRangeLow?: number | null;
      referenceRangeHigh?: number | null;
    },
    referenceRange?: string,
    unit: string | null = null
  ): AbnormalityType {
    if (typeof valueOrBiomarker === 'object') {
      const { numericValue, referenceRangeLow, referenceRangeHigh } = valueOrBiomarker;

      if (numericValue === null || numericValue === undefined) {
        return 'UNKNOWN';
      }

      if (referenceRangeLow !== null && referenceRangeLow !== undefined && 
          referenceRangeHigh !== null && referenceRangeHigh !== undefined) {
        if (numericValue < referenceRangeLow) return 'LOW';
        if (numericValue > referenceRangeHigh) return 'HIGH';
        return 'NORMAL';
      }

      if (referenceRangeLow !== null && referenceRangeLow !== undefined) {
        return numericValue < referenceRangeLow ? 'LOW' : 'NORMAL';
      }

      if (referenceRangeHigh !== null && referenceRangeHigh !== undefined) {
        return numericValue > referenceRangeHigh ? 'HIGH' : 'NORMAL';
      }

      return 'UNKNOWN';
    }

    const value = valueOrBiomarker;
    if (!referenceRange) return 'UNKNOWN';

    const rangeMatch = referenceRange.match(/([<>=]*)\s*(\d+(?:\.\d+)?)\s*-?\s*([<>=]*)\s*(\d+(?:\.\d+)?)?/);

    if (!rangeMatch) {
      console.warn(`Invalid reference range format: ${referenceRange}`);
      return 'UNKNOWN';
    }

    const [_, op1, val1, op2, val2] = rangeMatch;
    const min = parseFloat(val1);
    const max = val2 ? parseFloat(val2) : null;
    const operator = op1 || op2 || '';

    if (val2 === undefined && operator) {
      if (operator.includes('>')) {
        return value > min ? 'HIGH' : 'NORMAL';
      } else if (operator.includes('<')) {
        return value < min ? 'LOW' : 'NORMAL';
      } else if (operator.includes('=')) {
        return value === min ? 'NORMAL' : 
               value > min ? 'HIGH' : 'LOW';
      }
    }

    if (min !== null && max !== null) {
      if (value < min) return 'LOW';
      if (value > max) return 'HIGH';
      return 'NORMAL';
    }

    if (min !== null) {
      if (referenceRange.includes('<')) {
        return value < min ? 'NORMAL' : 'HIGH';
      } else if (referenceRange.includes('>')) {
        return value > min ? 'NORMAL' : 'LOW';
      } else if (referenceRange.includes('=')) {
        const tolerance = min * 0.01; 
        return Math.abs(value - min) <= tolerance ? 'NORMAL' :
               value > min ? 'HIGH' : 'LOW';
      }

      const tolerance = min * 0.1; 
      if (value < min - tolerance) return 'LOW';
      if (value > min + tolerance) return 'HIGH';
      return 'NORMAL';
    }

    return 'UNKNOWN';
  }

  private formatReferenceRange(
    referenceRange: string | null | undefined,
    unit: string | null = null
  ): string {
    if (!referenceRange) return '';

    if (unit) {
      if (unit.startsWith('x10^') || unit === '%' || unit === '°C' || unit === '°F') {
        return `${referenceRange} (${unit})`;
      }
      return `${referenceRange} ${unit}`;
    }

    return referenceRange;
  }

  private toBiomarkerWithAbnormality(biomarker: Partial<BloodBiomarker> & { reportId: string; name: string }): BiomarkerWithAbnormality {
    // Ensure required fields have default values
    const {
      id = '',
      name = '',
      value = '',
      numericValue = null,
      unit = null,
      referenceRangeLow = null,
      referenceRangeHigh = null,
      referenceRangeText = null,
      category = null,
      reportId,
      sectionId = null,
      isVerified = false,
      notes = null,
      clinicalSignificance = null,
      confidence = null,
      originalName = null,
      createdAt = new Date(),
      updatedAt = new Date(),
      ...rest
    } = biomarker;

    // Format the reference range for display
    const formattedRange = referenceRangeText || 
      (referenceRangeLow !== null && referenceRangeHigh !== null
        ? `${referenceRangeLow} - ${referenceRangeHigh} ${unit || ''}`.trim()
        : 'N/A');

    // Create the base result object with safe defaults
    const result: BiomarkerWithAbnormality = {
      id,
      name,
      value,
      numericValue: numericValue ?? null,
      unit: unit ?? null,
      referenceRangeLow: referenceRangeLow ?? null,
      referenceRangeHigh: referenceRangeHigh ?? null,
      referenceRangeText: referenceRangeText ?? null,
      category: category ?? null,
      reportId,
      sectionId: sectionId ?? null,
      isVerified: isVerified ?? false,
      notes: notes ?? null,
      clinicalSignificance: clinicalSignificance ?? null,
      confidence: confidence ?? null,
      originalName: originalName ?? null,
      abnormality: 'NORMAL',
      formattedReferenceRange: formattedRange,
      isAbnormal: false,
      createdAt: createdAt ?? new Date(),
      updatedAt: updatedAt ?? new Date()
    };
    const numericValueParsed = typeof numericValue === 'number' ? numericValue : parseFloat(value);
    const refLow = typeof referenceRangeLow === 'number' ? referenceRangeLow : null;
    const refHigh = typeof referenceRangeHigh === 'number' ? referenceRangeHigh : null;

    if (isNaN(numericValueParsed) || refLow === null || refHigh === null) {
        return {
          ...result,
          abnormality: 'UNKNOWN',
          abnormalityType: 'UNKNOWN',
          formattedReferenceRange: referenceRange,
          isAbnormal: false
        };
      }

      const abnormality = abnormality || this.detectAbnormality(
        numericValueParsed,
        referenceRange,
        unit
      );

      return {
        ...result,
        abnormality,
        isAbnormal: abnormality !== 'NORMAL' && abnormality !== 'UNKNOWN',
        abnormalityType: abnormality
      };
    } catch (error) {
      console.error('Error in toBiomarkerWithAbnormality:', error);
      return {
        ...biomarker,
        abnormality: 'UNKNOWN' as const,
          },
          orderBy: { order: 'asc' }
    try {
      // Get the base report with basic relations
      const report = await this.prisma.bloodTestReport.findUnique({
        where: { id, userId },
        include: {
          biomarkers: true,
          amendedVersions: {
            select: {
              id: true,
              reportVersion: true,
              createdAt: true
            },
        },
        amendedVersions: {
          select: {
            id: true,
            reportVersion: true,
            createdAt: true
          },
          orderBy: { reportVersion: 'desc' }
        }
      }
    });

    if (!report) {
      this.logger.warn(`Report not found with id: ${id} for user: ${userId}`);
      throw new NotFoundException('Report not found');
    }

    /**
     * Processes biomarkers to add abnormality information and format reference ranges
     */
    const processBiomarkers = (biomarkers: BloodBiomarker[]): BiomarkerWithAbnormality[] => {
      if (!biomarkers) return [];
      
      return biomarkers.map(biomarker => {
        const formattedRange = biomarker.referenceRangeText || 
          (biomarker.referenceRangeLow !== null && biomarker.referenceRangeHigh !== null
            ? `${biomarker.referenceRangeLow} - ${biomarker.referenceRangeHigh} ${biomarker.unit || ''}`.trim()
            : 'N/A');
        
        const abnormality = this.detectAbnormality(
          biomarker.numericValue,
          biomarker.referenceRangeText || undefined,
          biomarker.unit || null
        );
        
        return {
          ...biomarker,
          abnormality,
          formattedReferenceRange: formattedRange,
          isAbnormal: abnormality !== 'NORMAL' && abnormality !== 'UNKNOWN',
          sectionId: biomarker.sectionId || null,
          category: biomarker.category || null,
          notes: biomarker.notes || null,
          clinicalSignificance: biomarker.clinicalSignificance || null,
          confidence: biomarker.confidence || null,
          originalName: biomarker.originalName || null,
          createdAt: biomarker.createdAt || new Date(),
          updatedAt: biomarker.updatedAt || new Date()
        };
      });
    };

    /**
     * Processes sections recursively to include biomarkers and subsections
     */
    const processSections = (sections: BloodReportSection[]): EnrichedSection[] => {
      if (!sections) return [];
      
      return sections.map(section => ({
        ...section,
        biomarkers: processBiomarkers(section.biomarkers || []),
        sections: processSections(section.sections || []),
        isVerified: section.isVerified ?? false,
        notes: section.notes || null,
        parentSectionId: section.parentSectionId || null,
        createdAt: section.createdAt || new Date(),
        updatedAt: section.updatedAt || new Date()
      }));
    };

    // Process the report data
    const processedBiomarkers = processBiomarkers(report.biomarkers || []);
    const processedSections = processSections(report.sections || []);

    // Construct the final report with all processed data
    const result: BloodTestReportWithRelations = {
      ...report,
      biomarkers: processedBiomarkers,
      sections: processedSections,
      amendedVersions: report.amendedVersions || [],
      reportDate: report.reportDate || new Date(),
      labName: report.labName || null,
      doctorName: report.doctorName || null,
      notes: report.notes || null,
      status: report.status || 'pending',
      isVerified: report.isVerified ?? false,
      verifiedAt: report.verifiedAt || null,
      verifiedBy: report.verifiedBy || null,
      reportVersion: report.reportVersion || 1,
      isAmended: report.isAmended ?? false,
      originalReportId: report.originalReportId || null,
      createdAt: report.createdAt || new Date(),
      updatedAt: report.updatedAt || new Date()
    };

    return result;
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    this.logger.error(`Error fetching report ${id} for user ${userId}:`, error);
    throw new Error('Failed to fetch report');
  }
}
          amendedVersions: {
            select: {
              id: true,
              reportVersion: true,
              createdAt: true
            },
            orderBy: { reportVersion: 'desc' }
          }
        }
      });

      if (!report) return null;

      // Get all sections and subsections in a flat structure
      const allSections = await this.prisma.bloodReportSection.findMany({
        where: { reportId: id },
        include: {
          biomarkers: true
        },
        orderBy: { order: 'asc' }
      });

      // Process biomarkers with abnormality detection
      const processedBiomarkers = report.biomarkers.map(b => 
        this.toBiomarkerWithAbnormality({
          ...b,
          isVerified: b.isVerified ?? false,
          notes: b.notes ?? null,
          clinicalSignificance: b.clinicalSignificance ?? null,
          confidence: b.confidence ?? null
        })
      );

      // Build section hierarchy
      const buildSectionHierarchy = (parentId: string | null): EnrichedSection[] => {
        return allSections
          .filter(s => s.parentSectionId === parentId)
          .map(section => {
            const sectionBiomarkers = (section.biomarkers || []).map(b => 
              this.toBiomarkerWithAbnormality({
                ...b,
                isVerified: b.isVerified ?? false,
                notes: b.notes ?? null,
                clinicalSignificance: b.clinicalSignificance ?? null,
                confidence: b.confidence ?? null
              })
            );

            return {
              ...section,
              biomarkers: sectionBiomarkers,
              sections: buildSectionHierarchy(section.id),
              isVerified: section.isVerified ?? false,
              notes: section.notes ?? null
            };
          });
      };

      const processedSections = buildSectionHierarchy(null);

      // Return the complete report with all relations
      return {
        ...report,
        biomarkers: processedBiomarkers,
        sections: processedSections,
        // Ensure all optional fields have proper defaults
        reportDate: report.reportDate || new Date(),
        labName: report.labName || null,
        doctorName: report.doctorName || null,
        notes: report.notes || null,
        status: report.status || 'pending',
        isVerified: report.isVerified ?? false,
        verifiedAt: report.verifiedAt || null,
        verifiedBy: report.verifiedBy || null,
        reportVersion: report.reportVersion || 1,
        isAmended: report.isAmended ?? false,
        originalReportId: report.originalReportId || null,
        amendedVersions: report.amendedVersions || []
      };
    } catch (error) {
      this.logger.error(`Error fetching report ${id}:`, error);
      throw new Error('Failed to fetch report');
    }
    try {
      const report = await this.prisma.bloodTestReport.findUnique({
        where: { id, userId },
        include: {
          biomarkers: true,
          amendedVersions: {
            select: {
              id: true,
              reportVersion: true,
              createdAt: true
            },
            orderBy: { reportVersion: 'desc' }
          }
        }
      });

      if (!report) return null;

      const sections = await this.prisma.bloodReportSection.findMany({
        where: { reportId: id },
        include: {
          biomarkers: true,
          sections: {
            include: {
              biomarkers: true
            }
          }
        },
        orderBy: { order: 'asc' }
      });

      const processedBiomarkers = report.biomarkers.map(b => 
        this.toBiomarkerWithAbnormality(b as any)
          category: string | null;
          reportId: string;
          sectionId: string | null;
          isVerified: boolean;
          notes: string | null;
          clinicalSignificance: string | null;
          confidence: number | null;
          createdAt: Date;
          updatedAt: Date;
        }>;
        sections: Array<{
          id: string;
          name: string;
          order: number;
          reportId: string;
          parentSectionId: string | null;
          sectionText: string | null;
          isVerified: boolean;
          notes: string | null;
          createdAt: Date;
          updatedAt: Date;
          biomarkers: Array<{
            id: string;
            name: string;
            value: string;
            numericValue: number | null;
            unit: string | null;
            referenceRangeLow: number | null;
            referenceRangeHigh: number | null;
            referenceRangeText: string | null;
            category: string | null;
            reportId: string;
            sectionId: string | null;
            isVerified: boolean;
            notes: string | null;
            clinicalSignificance: string | null;
            confidence: number | null;
            createdAt: Date;
            updatedAt: Date;
          }>;
          sections: Array<{
            id: string;
            name: string;
            order: number;
            reportId: string;
            parentSectionId: string | null;
            sectionText: string | null;
            isVerified: boolean;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            biomarkers: Array<{
              id: string;
              name: string;
              value: string;
              numericValue: number | null;
              unit: string | null;
              referenceRangeLow: number | null;
              referenceRangeHigh: number | null;
              referenceRangeText: string | null;
              category: string | null;
              reportId: string;
              sectionId: string | null;
              isVerified: boolean;
              notes: string | null;
              clinicalSignificance: string | null;
              confidence: number | null;
              createdAt: Date;
              updatedAt: Date;
            }>;
          }>;
        }>;
        amendedVersions: Array<{
          id: string;
          reportVersion: number;
          createdAt: Date;
        }>;
      };

      if (!report) {
        return null;
      }

      // Convert Prisma types to our enriched types
      const typedReport = report as any;

      // Process top-level biomarkers
      const enrichedBiomarkers = (typedReport.biomarkers || []).map(
        (b: any) => this.toBiomarkerWithAbnormality(b)
      );

      // Process sections and their biomarkers
      const enrichedSections = (typedReport.sections || []).map((section: any) => ({
        ...section,
        sectionText: section.sectionText ?? null,
        createdAt: section.createdAt ? new Date(section.createdAt) : new Date(),
        updatedAt: section.updatedAt ? new Date(section.updatedAt) : new Date(),
        biomarkers: (section.biomarkers || []).map((b: any) => this.toBiomarkerWithAbnormality(b)),
        sections: (section.sections || []).map((subSection: any) => ({
          ...subSection,
          sectionText: subSection.sectionText ?? null,
          createdAt: subSection.createdAt ? new Date(subSection.createdAt) : new Date(),
          updatedAt: subSection.updatedAt ? new Date(subSection.updatedAt) : new Date(),
          biomarkers: (subSection.biomarkers || []).map((b: any) => this.toBiomarkerWithAbnormality(b))
        }))
      }));

      // Process amended versions
      const processedAmendedVersions = (typedReport.amendedVersions || []).map((version: any) => ({
        id: version.id,
        reportVersion: version.reportVersion,
        createdAt: version.createdAt ? new Date(version.createdAt) : new Date()
      }));

      // Create the final result with proper typing
      const result: BloodTestReportWithRelations = {
        ...typedReport,
        biomarkers: enrichedBiomarkers,
        sections: enrichedSections,
        amendedVersions: processedAmendedVersions,
        receivedDate: typedReport.receivedDate ? new Date(typedReport.receivedDate) : new Date(),
        createdAt: typedReport.createdAt ? new Date(typedReport.createdAt) : new Date(),
        updatedAt: typedReport.updatedAt ? new Date(typedReport.updatedAt) : new Date(),
        labName: typedReport.labName ?? null,
        doctorName: typedReport.doctorName ?? null,
        reportIdentifier: typedReport.reportIdentifier ?? null,
        patientName: typedReport.patientName ?? null,
        patientDOB: typedReport.patientDOB ? new Date(typedReport.patientDOB) : null,
        patientGender: typedReport.patientGender ?? null,
        patientId: typedReport.patientId ?? null,
        status: typedReport.status ?? 'PENDING',
        isVerified: typedReport.isVerified ?? false,
        notes: typedReport.notes ?? null,
        originalReportId: typedReport.originalReportId ?? null,
        rawOcrText: typedReport.rawOcrText ?? null,
        ocrConfidence: typedReport.ocrConfidence ?? null,
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
    try {
      const page = Math.max(1, options.page || 1);
      const limit = Math.min(100, Math.max(1, options.limit || 10));
      const skip = (page - 1) * limit;

      // Build the where clause
      const where: any = { userId };

      if (options.status?.length) {
        where.status = { in: options.status };
      }

      if (options.startDate || options.endDate) {
        where.reportDate = {};
        if (options.startDate) {
          where.reportDate.gte = options.startDate;
        }
        if (options.endDate) {
          where.reportDate.lte = options.endDate;
        }
      }

      // Get total count for pagination
      const total = await this.prisma.bloodTestReport.count({ where });

      // Get paginated reports with minimal relations first
      const reports = await this.prisma.bloodTestReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportDate: 'desc' },
        include: {
          amendedVersions: {
            select: {
              id: true,
              reportVersion: true,
              createdAt: true
            },
            orderBy: { reportVersion: 'desc' }
          }
        }
      });

      // Process all reports in parallel with proper error handling
      const reportsWithRelations: BloodTestReportWithRelations[] = [];
      
      for (const report of reports) {
        try {
          // Fetch related data in parallel
          const [biomarkers, sections] = await Promise.all([
            // Get all biomarkers for this report
            this.prisma.bloodBiomarker.findMany({
              where: { reportId: report.id },
            }),
            // Get all sections for this report (only top-level ones)
            this.prisma.bloodReportSection.findMany({
              where: { 
                reportId: report.id,
                // Filter for top-level sections (no parent)
                parentSectionId: null
              },
              include: {
                biomarkers: true,
                sections: {
                  include: {
                    biomarkers: true
                  }
                }
              }
            })
          ]);

          // Process biomarkers with abnormality detection
          const processedBiomarkers = biomarkers.map(b => 
            this.toBiomarkerWithAbnormality(b as any)
          );
          
          // Process sections and subsections with proper type safety
          const processedSections = await Promise.all(
            sections.map(async (section: any) => {
              // Process section biomarkers
              const sectionBiomarkers = Array.isArray(section.biomarkers) ? section.biomarkers : [];
              const processedSectionBiomarkers = sectionBiomarkers.map((b: any) => 
                this.toBiomarkerWithAbnormality(b)
              );
              
              // Process subsections
              const subsections = Array.isArray(section.sections) ? section.sections : [];
              const processedSubsections = await Promise.all(
                subsections.map(async (subSection: any) => {
                  const subsectionBiomarkers = Array.isArray(subSection.biomarkers) ? subSection.biomarkers : [];
                  const processedSubsectionBiomarkers = subsectionBiomarkers.map((b: any) => 
                    this.toBiomarkerWithAbnormality(b)
                  );
                  
                  return {
                    ...subSection,
                    biomarkers: processedSubsectionBiomarkers,
                    sections: [], // Subsections don't have nested subsections
                    sectionText: subSection.sectionText || null,
                    isVerified: subSection.isVerified ?? false,
                    notes: subSection.notes || null,
                    name: subSection.name || '',
                    order: subSection.order ?? 0,
                    reportId: subSection.reportId,
                    parentSectionId: subSection.parentSectionId || null,
                    createdAt: subSection.createdAt,
                    updatedAt: subSection.updatedAt
                  };
                })
              );
              
              return {
                ...section,
                biomarkers: processedSectionBiomarkers,
                sections: processedSubsections,
                sectionText: section.sectionText || null,
                isVerified: section.isVerified ?? false,
                notes: section.notes || null,
                name: section.name || '',
                order: section.order ?? 0,
                reportId: section.reportId,
                parentSectionId: section.parentSectionId || null,
                createdAt: section.createdAt,
                updatedAt: section.updatedAt
              };
            })
          );
          
          // Return the enriched report with all relations
          reportsWithRelations.push({
            ...report,
            biomarkers: processedBiomarkers,
            sections: processedSections,
            // Ensure all optional fields have proper defaults
            reportDate: report.reportDate || null,
            labName: report.labName || null,
            doctorName: report.doctorName || null,
            notes: report.notes || null,
            status: report.status || 'pending',
            isVerified: report.isVerified ?? false,
            verifiedAt: report.verifiedAt || null,
            verifiedBy: report.verifiedBy || null,
            reportVersion: report.reportVersion || 1,
            isAmended: report.isAmended ?? false,
            originalReportId: report.originalReportId || null,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            userId: report.userId,
            amendedVersions: report.amendedVersions || []
          } as BloodTestReportWithRelations);
        } catch (error) {
          this.logger.error(`Error processing report ${report.id}:`, error);
          // Skip this report but continue with others
          continue;
        }
      }

      if (options.startDate || options.endDate) {
        where.reportDate = {};
        if (options.startDate) where.reportDate.gte = options.startDate;
        if (options.endDate) where.reportDate.lte = options.endDate;
      }

      // Get total count
      const total = await this.prisma.bloodTestReport.count({ where });
      
      // First get the base reports with minimal relations to avoid type issues
      const baseReports = await this.prisma.bloodTestReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reportDate: 'desc' },
        select: {
          id: true,
          userId: true,
          reportDate: true,
          receivedDate: true,
          labName: true,
          doctorName: true,
          reportIdentifier: true,
          reportVersion: true,
          patientName: true,
          patientDOB: true,
          patientGender: true,
          patientId: true,
          status: true,
          isVerified: true,
          notes: true,
          originalReportId: true,
          rawOcrText: true,
          ocrConfidence: true,
          parsingMethod: true,
          createdAt: true,
          updatedAt: true,
          amendedVersions: {
            select: {
              id: true,
              reportVersion: true,
              createdAt: true
            },
            orderBy: { reportVersion: 'desc' as const }
          }
        }
      });

      // Define the section include type for Prisma queries
      const sectionInclude = {
        include: {
          biomarkers: true,
          sections: {
            include: {
              biomarkers: true
            }
          }
        }
      };
      
      // Define the type for sections with relations
      type SectionWithRelations = Prisma.BloodReportSectionGetPayload<{
        include: {
          biomarkers: true;
          sections: true;
        };
      }> & {
        biomarkers: BloodReportBiomarker[];
        sections: Array<SectionWithRelations>;
        sectionText?: string | null;
        isVerified?: boolean;
        notes?: string | null;
        parentSectionId?: string | null;
      };

      // Then fetch all related data in parallel

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
    const [
      totalReports,
      firstReport,
      lastReport,
      abnormalCount,
      categoryStats
    ] = await Promise.all([
      // Total reports count
      this.prisma.bloodTestReport.count({
        where: { 
          userId, 
          status: 'ACTIVE' 
        },
      }),
      // First report date
      this.prisma.bloodTestReport.findFirst({
        where: { 
          userId, 
          status: 'ACTIVE' 
        },
        orderBy: { reportDate: 'asc' },
        select: { reportDate: true },
      }),
      // Last report date
      this.prisma.bloodTestReport.findFirst({
        where: { 
          userId, 
          status: 'ACTIVE' 
        },
        orderBy: { reportDate: 'desc' },
        select: { reportDate: true },
      }),
      // Abnormal results count
      this.prisma.bloodBiomarker.count({
        where: {
          report: { 
            userId, 
            status: 'ACTIVE' 
          },
          isAbnormal: true,
        },
      }),
      // Category statistics
      this.prisma.bloodBiomarker.groupBy({
        by: ['category'],
        where: {
          report: { 
            userId, 
            status: 'ACTIVE' 
          },
        },
        _count: {
          _all: true,
        },
        _sum: {
          isAbnormal: true,
        },
      })
    ]);

    // Format category statistics
    const categories = categoryStats.map(cat => ({
      name: cat.category || 'Uncategorized',
      count: Number(cat._count?._all || 0),
      abnormalCount: Number(cat._sum?.isAbnormal || 0),
    }));

    return {
      totalReports,
      abnormalResults: abnormalCount,
      firstTestDate: firstReport?.reportDate || null,
      lastTestDate: lastReport?.reportDate || null,
      categories,
    };
  }


}

// Export service
export const bloodReportService = new BloodReportService(new PrismaClient());