// lib/services/BloodReportService.ts

import { StreamingBloodTestParser, ExtractedBiomarker, BloodTestData } from '../parsers/streaming/StreamingBloodTestParser';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

/**
 * Service to manage blood report data including parsing, storage, and retrieval
 */
export class BloodReportService {
  private parser: StreamingBloodTestParser;

  constructor() {
    this.parser = new StreamingBloodTestParser({
      enableLogging: process.env.NODE_ENV === 'development',
    });
  }

  /**
   * Parse OCR text and store the complete blood report data
   */
  async parseAndStoreBloodReport(
    userId: string,
    ocrText: string,
    metadata: {
      reportDate?: Date;
      labName?: string;
      doctorName?: string;
      reportIdentifier?: string;
      patientName?: string;
      patientDOB?: Date;
      patientGender?: string;
      patientId?: string;
    } = {}
  ) {
    try {
      // Parse the OCR text using the StreamingBloodTestParser
      const parseResult = await this.parser.parse(ocrText);
      const bloodTestData = parseResult.data;

      // Create categories mapping
      const categories = this.createCategoriesFromBiomarkers(bloodTestData.biomarkers);

      // Create the blood test report record
      const bloodTestReport = await prisma.bloodTestReport.create({
        data: {
          userId,
          reportDate: metadata.reportDate || new Date(),
          labName: metadata.labName,
          doctorName: metadata.doctorName,
          reportIdentifier: metadata.reportIdentifier,
          patientName: metadata.patientName,
          patientDOB: metadata.patientDOB,
          patientGender: metadata.patientGender,
          patientId: metadata.patientId,
          rawOcrText: ocrText,
          ocrConfidence: parseResult.metadata.confidence,
          parsingMethod: 'streaming',
          biomarkers: {
            create: bloodTestData.biomarkers.map((biomarker) => this.mapBiomarkerToDbModel(biomarker, categories)),
          },
          sections: {
            create: Object.entries(categories).map(([category, _], index) => ({
              name: category,
              order: index,
              sectionText: this.extractSectionText(ocrText, category),
            })),
          },
        },
        include: {
          biomarkers: true,
          sections: true,
        },
      });

      return {
        report: bloodTestReport,
        parseResult,
      };
    } catch (error) {
      console.error('Error in parseAndStoreBloodReport:', error);
      throw new Error(`Failed to parse and store blood report: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a blood report by ID with all related data
   */
  async getBloodReport(reportId: string, userId: string) {
    return prisma.bloodTestReport.findUnique({
      where: {
        id: reportId,
        userId,
      },
      include: {
        biomarkers: true,
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
        amendedVersions: {
          select: {
            id: true,
            reportVersion: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Get all blood reports for a user with pagination
   */
  async getUserBloodReports(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      includeDeleted?: boolean;
    } = {}
  ) {
    const { page = 1, limit = 10, status = 'ACTIVE', includeDeleted = false } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.BloodTestReportWhereInput = {
      userId,
    };

    // Only add status filter if not including deleted
    if (!includeDeleted) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.bloodTestReport.findMany({
        where,
        include: {
          biomarkers: {
            select: {
              id: true,
              name: true,
              value: true,
              unit: true,
              isAbnormal: true,
              category: true,
            },
          },
        },
        orderBy: {
          reportDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.bloodTestReport.count({ where }),
    ]);

    return {
      data: reports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all biomarkers for a specific category across user's reports
   * Useful for trending analysis
   */
  async getBiomarkerTrend(userId: string, biomarkerName: string, options: { limit?: number } = {}) {
    const { limit = 10 } = options;

    const biomarkers = await prisma.bloodBiomarker.findMany({
      where: {
        name: biomarkerName,
        report: {
          userId,
          status: 'ACTIVE',
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
      orderBy: {
        report: {
          reportDate: 'asc',
        },
      },
      take: limit,
    });

    return biomarkers.map((biomarker) => ({
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
  }

  /**
   * Map parser's ExtractedBiomarker to database model
   */
  private mapBiomarkerToDbModel(biomarker: ExtractedBiomarker, categories: Record<string, string[]>) {
    // Convert reference range string to numeric low/high if possible
    const { low, high } = this.parseReferenceRange(biomarker.referenceRange || '');

    // Find the category for this biomarker
    const category = Object.entries(categories).find(([_, biomarkers]) =>
      biomarkers.includes(biomarker.name)
    )?.[0] || biomarker.category || 'Other';

    // Determine if the value is abnormal based on reference range
    const isAbnormal =
      (low !== null && biomarker.value < low) ||
      (high !== null && biomarker.value > high);

    // Determine abnormality type
    let abnormalityType: 'HIGH' | 'LOW' | 'NORMAL' | 'UNKNOWN' = 'NORMAL';
    if (isAbnormal) {
      if (low !== null && biomarker.value < low) {
        abnormalityType = 'LOW';
      } else if (high !== null && biomarker.value > high) {
        abnormalityType = 'HIGH';
      }
    }

    return {
      name: biomarker.standardName || biomarker.name,
      originalName: biomarker.name,
      value: biomarker.value.toString(),
      numericValue: biomarker.value,
      unit: biomarker.unit,
      referenceRangeLow: low,
      referenceRangeHigh: high,
      referenceRangeText: biomarker.referenceRange,
      category,
      isAbnormal,
      abnormalityType,
      confidence: biomarker.confidence,
      isVerified: false,
    };
  }

  /**
   * Parse reference range string into numeric low and high values
   */
  private parseReferenceRange(range: string): { low: number | null; high: number | null } {
    const result = { low: null as number | null, high: null as number | null };

    if (!range) return result;

    // Remove any unit text to isolate the numeric values
    const cleanedRange = range.replace(/[a-zA-Z]/g, '').trim();

    // Try to find patterns like "0-100" or "< 200" or "> 50" or "50 - 100"
    const dashMatch = cleanedRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    const lessThanMatch = cleanedRange.match(/[<≤]\s*(\d+\.?\d*)/);
    const greaterThanMatch = cleanedRange.match(/[>≥]\s*(\d+\.?\d*)/);

    if (dashMatch) {
      result.low = parseFloat(dashMatch[1]);
      result.high = parseFloat(dashMatch[2]);
    } else if (lessThanMatch) {
      result.high = parseFloat(lessThanMatch[1]);
    } else if (greaterThanMatch) {
      result.low = parseFloat(greaterThanMatch[1]);
    }

    return result;
  }

  /**
   * Create a mapping of categories to biomarker names
   */
  private createCategoriesFromBiomarkers(biomarkers: ExtractedBiomarker[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {};

    // Define common categories and their biomarkers
    const categoryMappings: Record<string, string[]> = {
      'Lipid Panel': ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'VLDL', 'Non-HDL Cholesterol'],
      'Liver Function': ['ALT', 'AST', 'Alkaline Phosphatase', 'Total Bilirubin', 'Direct Bilirubin', 'Albumin', 'Total Protein'],
      'Kidney Function': ['Creatinine', 'BUN', 'eGFR', 'Uric Acid', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium'],
      'Complete Blood Count': ['WBC', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC', 'Platelets', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'],
      'Glucose Metabolism': ['Glucose', 'HbA1c', 'Insulin', 'C-Peptide'],
      'Thyroid Panel': ['TSH', 'Free T4', 'Free T3', 'Total T4', 'Total T3', 'Thyroid Antibodies'],
      'Inflammation Markers': ['CRP', 'ESR', 'Homocysteine', 'Ferritin'],
      'Vitamins & Minerals': ['Vitamin D', 'Vitamin B12', 'Folate', 'Iron', 'Magnesium', 'Zinc'],
      'Other': [],
    };

    // First pass: assign biomarkers to known categories
    biomarkers.forEach((biomarker) => {
      let assigned = false;
      const name = biomarker.standardName || biomarker.name;

      // Check if biomarker belongs to a predefined category
      for (const [category, markerList] of Object.entries(categoryMappings)) {
        if (markerList.some((marker) => name.includes(marker) || marker.includes(name))) {
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(name);
          assigned = true;
          break;
        }
      }

      // If biomarker has its own category, use that
      if (!assigned && biomarker.category) {
        if (!categories[biomarker.category]) {
          categories[biomarker.category] = [];
        }
        categories[biomarker.category].push(name);
        assigned = true;
      }

      // If not assigned to any category, put in "Other"
      if (!assigned) {
        if (!categories['Other']) {
          categories['Other'] = [];
        }
        categories['Other'].push(name);
      }
    });

    return categories;
  }

  /**
   * Extract section text from OCR content based on category
   * This is a simplistic implementation and can be enhanced with better section detection
   */
  private extractSectionText(ocrText: string, category: string): string | undefined {
    // Try to find sections in the OCR text
    const lines = ocrText.split('\n');
    const categoryKeywords = this.getCategoryKeywords(category);
    
    let sectionStart = -1;
    let sectionEnd = -1;
    
    // Try to find the section based on keywords
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      if (sectionStart === -1) {
        // Look for section start
        if (categoryKeywords.some(keyword => line.includes(keyword.toLowerCase()))) {
          sectionStart = i;
        }
      } else if (
        // Look for next section start (which would be the end of our current section)
        Object.keys(this.getCategoryKeywordsMap()).some(otherCategory => {
          if (otherCategory === category) return false;
          return this.getCategoryKeywords(otherCategory).some(keyword => 
            line.includes(keyword.toLowerCase())
          );
        })
      ) {
        sectionEnd = i;
        break;
      }
    }
    
    // If we found a section, extract its text
    if (sectionStart !== -1) {
      if (sectionEnd === -1) {
        sectionEnd = Math.min(sectionStart + 20, lines.length); // Limit to 20 lines if no end found
      }
      
      return lines.slice(sectionStart, sectionEnd).join('\n');
    }
    
    return undefined;
  }

  /**
   * Get keywords associated with each category for section detection
   */
  private getCategoryKeywordsMap(): Record<string, string[]> {
    return {
      'Lipid Panel': ['lipid', 'cholesterol', 'triglycerides', 'lipoprotein', 'lipids'],
      'Liver Function': ['liver', 'hepatic', 'LFT', 'liver function', 'hepatic panel'],
      'Kidney Function': ['kidney', 'renal', 'creatinine', 'GFR', 'renal function'],
      'Complete Blood Count': ['CBC', 'complete blood', 'blood count', 'hemogram', 'hematology'],
      'Glucose Metabolism': ['glucose', 'sugar', 'A1C', 'HbA1c', 'glycemic', 'diabetes'],
      'Thyroid Panel': ['thyroid', 'TSH', 'T4', 'T3', 'thyroid function'],
      'Inflammation Markers': ['inflammation', 'CRP', 'ESR', 'inflammatory'],
      'Vitamins & Minerals': ['vitamin', 'mineral', 'micronutrient', 'nutrient'],
      'Other': [],
    };
  }

  /**
   * Get keywords for a specific category
   */
  private getCategoryKeywords(category: string): string[] {
    return this.getCategoryKeywordsMap()[category] || [];
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.parser && typeof this.parser.dispose === 'function') {
      this.parser.dispose();
    }
  }
}

// Export singleton instance
export const bloodReportService = new BloodReportService();
