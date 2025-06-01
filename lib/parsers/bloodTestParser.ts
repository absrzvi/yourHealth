import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TextPreprocessor } from './textPreprocessor';
import { SectionParser } from './sectionParser';
import { BiomarkerExtractor } from './biomarkerExtractor';
import { RemarksExtractor } from './remarksExtractor';
import { BiomarkerValidator } from './biomarkerValidator';
import { OcrNormalizer, SafeOcrNormalizer } from './ocrNormalizer';
import { PerformanceMonitor } from './performanceMonitor';
import { GenericBiomarkerExtractor } from './genericBiomarkerExtractor';
import { 
  BloodTestReportData, 
  ParserResult, 
  ReportType, 
  ReportSection,
  ExtractedBiomarker,
  Remark
} from './types';

type PatientInfo = NonNullable<BloodTestReportData['patientInfo']>;
type LabInfo = NonNullable<BloodTestReportData['labInfo']>;

/**
 * Parser for blood test reports
 * 
 * This parser uses a multi-strategy approach to extract biomarkers and clinical remarks
 * from various blood test report formats. It includes:
 * 1. Text preprocessing and cleaning
 * 2. Section-based parsing
 * 3. Biomarker extraction and validation
 * 4. Clinical remarks extraction
 * 5. Result validation and confidence scoring
 */
export class BloodTestParser {
  private content: string;
  private logPath: string;
  private parsedData: Partial<BloodTestReportData> = {}; // Ensure this matches the type used in methods
  private sections = new Map<string, ReportSection>();
  private performanceMonitor?: PerformanceMonitor;
  private logger: ((message: string) => void) | null = null;

  constructor(file: File | null = null, content: string = '', options?: { enableMonitoring?: boolean; logger?: (message: string) => void }) {
    // Set up logging
    this.logPath = path.join(process.cwd(), 'logs', `parser-${Date.now()}.log`);
    
    // Ensure content is a string
    if (typeof content !== 'string') {
      console.error('Invalid content type provided to BloodTestParser');
      this.content = String(content || '');
    } else {
      this.content = content;
    }
    
    this.logMessage(`BloodTestParser initialized with ${this.content.length} characters`);
    if (file) {
      this.logMessage(`Processing file: ${file.name}, size: ${file.size} bytes`);
    }
    
    // Log a short preview for debugging
    if (process.env.NODE_ENV === 'development') {
      const preview = this.content.substring(0, Math.min(300, this.content.length));
      this.logMessage(`Content preview: ${preview.replace(/\n/g, ' ').trim()}...`);
    }

    this.logger = options?.logger || null;
    if (options?.enableMonitoring) {
      this.performanceMonitor = new PerformanceMonitor(true);
      this.logMessage('[PerformanceMonitor] Monitoring enabled via constructor options.');
    } else if (process.env.NODE_ENV === 'development' && process.env.ENABLE_PARSER_PERF_MONITOR === 'true') {
      // Fallback to environment variable if not explicitly set by options, for broader dev testing
      this.performanceMonitor = new PerformanceMonitor(true);
      this.logMessage('[PerformanceMonitor] Monitoring enabled via environment variable.');
    }
  }
  
  /**
   * Log a message to both console and file for debugging
   */
  private logMessage(message: string): void {
    // Debug logging disabled
    if (this.logger) {
      this.logger(message);
    }
    
    // File logging disabled in most cases
    if (process.env.ENABLE_FILE_LOGGING === 'true') {
      try {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - ${message}\n`;
        fs.appendFileSync(this.logPath, logEntry);
      } catch (error) {
        // Debug error logging disabled
      }
    }
  }

  /**
   * Helper method to create a successful result
   */
  private success(data: BloodTestReportData): ParserResult {
    return {
      success: true,
      data
    };
  }

  /**
   * Helper method to create an error result
   */
  private error(message: string, error?: Error): ParserResult {
    this.logMessage(`Error: ${message}${error ? ` - ${error.message}` : ''}`);
    if (this.performanceMonitor) {
      this.performanceMonitor.reset();
    }
    return {
      success: false,
      error: message
    };
  }

  /**
   * Handle validation errors or safety check failures [REH]
   */
  private handleError(message: string): ParserResult {
    console.error(`[BloodTestParser] Error: ${message}`);
    if (this.performanceMonitor) {
      this.performanceMonitor.reset();
    }
    return {
      success: false,
      error: message
    };
  }

  /**
   * Main parsing method that coordinates the parsing process
   * Enhanced with improved safety checks for OCR text processing [REH]
   */
  async parse(reportType: string = 'generic'): Promise<ParserResult> { 
    // Start performance monitoring for the overall parsing process
    const endOverallParse = this.performanceMonitor?.startPhase('BloodTestParser.parse_overall', this.content.length);
    
    // Validate input content
    if (!this.content || this.content.length === 0) {
      console.error('[BloodTestParser] Cannot parse empty content');
      return this.handleError('Empty content provided to parser');
    }
    
    try {
      // Keep original content as backup for safety
      const originalContent = this.content;
      console.log(`[BloodTestParser] Starting parse with content length: ${originalContent.length}`);
      
      // Step 1: Normalize OCR text to handle common OCR issues
      const endNormalization = this.performanceMonitor?.startPhase('BloodTestParser.normalize', this.content.length);
      const safeNormalizer = new SafeOcrNormalizer();
      let normalizedContent = safeNormalizer.normalize(this.content);
      endNormalization?.(normalizedContent.length);
      
      // SAFETY CHECK: If normalization resulted in empty content, use original
      if (normalizedContent.length === 0 && this.content.length > 0) {
        console.warn('[BloodTestParser] Normalization resulted in empty content - using original content');
        normalizedContent = originalContent;
      }
      
      // Step 2: Preprocess the normalized content
      // Detailed logging for debugging
      console.log('[DEBUG] normalizedContent length before preprocessing:', normalizedContent.length);
      console.log('[DEBUG] normalizedContent first 100 chars:', normalizedContent.substring(0, 100));
      
      let preprocessedContent = TextPreprocessor.preprocess(normalizedContent);
      
      // SAFETY CHECK: If preprocessing resulted in empty content, use normalized content
      if (preprocessedContent.length === 0 && normalizedContent.length > 0) {
        console.warn('[BloodTestParser] Preprocessing resulted in empty content - using normalized content');
        preprocessedContent = normalizedContent;
      }
      
      console.log('[DEBUG] preprocessedContent length after preprocessing:', preprocessedContent.length);
      console.log('[DEBUG] preprocessedContent first 100 chars:', preprocessedContent.substring(0, 100));
      
      // Step 3: Parse document sections
      // Debug logging disabled
      this.sections = SectionParser.parseSections(preprocessedContent);
      
      // Step 4: Extract patient and lab information
      // Debug logging disabled
      this.extractMetadata(preprocessedContent);
      
      // Step 5: Extract biomarkers
      const biomarkers = this.extractBiomarkers(preprocessedContent);
      console.log(`[BloodTestParser] Extracted ${biomarkers.length} biomarkers before validation`);
      if (biomarkers.length > 0) {
        console.log(`[BloodTestParser] First biomarker: ${JSON.stringify({
          name: biomarkers[0].name,
          standardName: biomarkers[0].standardName,
          value: biomarkers[0].value,
          unit: biomarkers[0].unit,
          confidence: biomarkers[0].confidence
        })}`);
      }
      
      // Step 6: Extract and associate remarks
      // Debug logging disabled
      let remarks: Remark[] = [];
      let updatedBiomarkers = [...biomarkers];
      try {
        const remarkResults = this.extractRemarks(preprocessedContent, biomarkers);
        remarks = remarkResults.remarks;
        updatedBiomarkers = remarkResults.updatedBiomarkers;
        // Debug logging disabled
      } catch (error) {
        // Error logging disabled
      }
      
      // Step 7: Validate results
      console.log(`[BloodTestParser] Validating ${updatedBiomarkers.length} biomarkers after remarks extraction`);
      if (updatedBiomarkers.length > 0) {
        console.log(`[BloodTestParser] First biomarker before validation: ${JSON.stringify({
          name: updatedBiomarkers[0].name,
          standardName: updatedBiomarkers[0].standardName,
          value: updatedBiomarkers[0].value,
          unit: updatedBiomarkers[0].unit,
          confidence: updatedBiomarkers[0].confidence
        })}`);
      }
      
      const validatedBiomarkers = BiomarkerValidator.validateAndFilter(updatedBiomarkers);
      console.log(`[BloodTestParser] After validation: ${validatedBiomarkers.length} biomarkers remain`);
      if (validatedBiomarkers.length > 0) {
        console.log(`[BloodTestParser] First validated biomarker: ${JSON.stringify({
          name: validatedBiomarkers[0].name,
          standardName: validatedBiomarkers[0].standardName,
          value: validatedBiomarkers[0].value,
          unit: validatedBiomarkers[0].unit,
          confidence: validatedBiomarkers[0].confidence
        })}`);
      }
      
      const validationReport = BiomarkerValidator.generateValidationReport(validatedBiomarkers, remarks);
      
      // Step 8: Prepare final result
      // Debug logging disabled
      const result: BloodTestReportData = {
        type: 'BLOOD_TEST',
        biomarkers: validatedBiomarkers,
        remarks,
        metadata: {
          parser: 'BloodTestParser',
          biomarkerCount: validatedBiomarkers.length,
          parsedAt: new Date().toISOString(),
          confidence: validationReport.averageConfidence,
          sections: Array.from(this.sections.keys()),
          validation: validationReport,
          remarkCount: remarks.length,
        },
        patientInfo: this.parsedData.patientInfo,
        labInfo: this.parsedData.labInfo,
        criticalFindings: validationReport.criticalFindings,
      };
      
      // Debug logging disabled
      endOverallParse?.(JSON.stringify(result).length);
      if (this.performanceMonitor) {
        // Performance logging disabled
        this.performanceMonitor.reset(); // Reset for next parse call if instance is reused
      }
      return this.success(result);
      
    } catch (error) {
      return this.error(
        'Failed to parse blood test report', 
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Extract metadata from the report content
   */
  private extractMetadata(content: string): void {
    // Debug logging disabled
    
    // Extract patient information
    this.parsedData.patientInfo = SectionParser.extractPatientInfo(content);
    // Debug logging disabled
    
    // Extract lab information
    this.parsedData.labInfo = SectionParser.extractLabInfo(content);
    // Debug logging disabled
  }

  /**
   * Extract biomarkers from the preprocessed content using multiple extraction methods
   */
  private extractBiomarkers(content: string): ExtractedBiomarker[] {
    try {
      console.log(`[BloodTestParser.extractBiomarkers] Starting extraction with content length: ${content.length}`);
      
      // Use the traditional extraction mechanism
      let traditionalBiomarkers = BiomarkerExtractor.extractBiomarkers(content);
      console.log(`[BloodTestParser.extractBiomarkers] Traditional extractor found ${traditionalBiomarkers.length} biomarkers`);
      
      // Log all traditionally extracted biomarkers for debugging
      if (traditionalBiomarkers.length > 0) {
        traditionalBiomarkers.forEach((b, i) => {
          console.log(`[BloodTestParser.extractBiomarkers] Traditional biomarker ${i+1}: ${b.name || 'unnamed'}, value: ${b.value}, unit: ${b.unit}, confidence: ${b.confidence}`);
        });
      }
      
      // Normalize traditional biomarkers
      traditionalBiomarkers = this.normalizeBiomarkerObjects(traditionalBiomarkers);
      console.log(`[BloodTestParser.extractBiomarkers] After normalization: ${traditionalBiomarkers.length} traditional biomarkers`);
      
      // ALWAYS use generic extraction regardless of traditional results
      // This ensures maximum biomarker coverage across different lab formats
      let genericBiomarkers: ExtractedBiomarker[] = [];
      
      // Use the generic extraction mechanism
      genericBiomarkers = GenericBiomarkerExtractor.extractBiomarkers(content);
      console.log(`[BloodTestParser.extractBiomarkers] Generic extractor found ${genericBiomarkers.length} biomarkers`);
      
      // Normalize generic biomarkers
      genericBiomarkers = this.normalizeBiomarkerObjects(genericBiomarkers);
      console.log(`[BloodTestParser.extractBiomarkers] After normalization: ${genericBiomarkers.length} generic biomarkers`);
      
      // Validate generic biomarkers even if we have traditional ones
      // This ensures we don't miss biomarkers in different formats
      genericBiomarkers = BiomarkerExtractor.validateAndEnhanceBiomarkers(genericBiomarkers);
      console.log(`[BloodTestParser.extractBiomarkers] After validation: ${genericBiomarkers.length} generic biomarkers`);
      
      // Combine biomarkers from both extractors
      const allBiomarkers = [...traditionalBiomarkers, ...genericBiomarkers];
      console.log(`[BloodTestParser.extractBiomarkers] Combined ${allBiomarkers.length} biomarkers`);
      
      // If we have no biomarkers at this point, try one more approach - direct extraction with lenient validation
      if (allBiomarkers.length === 0) {
        console.log(`[BloodTestParser.extractBiomarkers] No biomarkers found, trying lenient extraction`);
        let fallbackBiomarkers = BiomarkerExtractor.extractBiomarkers(content);
        // Include biomarkers even with low confidence for lenient validation
        console.log(`[BloodTestParser.extractBiomarkers] Lenient extraction found ${fallbackBiomarkers.length} biomarkers`);
        if (fallbackBiomarkers.length > 0) {
          return fallbackBiomarkers;
        }
      }
      
      // Deduplicate biomarkers by standardName (case-insensitive)
      const biomarkerMap = new Map<string, ExtractedBiomarker>();
      
      for (const biomarker of allBiomarkers) {
        // Skip biomarkers without names entirely
        if (!biomarker.name && !biomarker.standardName) continue;
        
        // Use name if standardName is not available
        const normalizedName = (biomarker.standardName || biomarker.name || '').toLowerCase().trim();
        if (!normalizedName) continue;
        
        if (!biomarkerMap.has(normalizedName)) {
          biomarkerMap.set(normalizedName, biomarker);
        } else {
          const existingBiomarker = biomarkerMap.get(normalizedName)!; // Safe: checked by .has()

          const currentHasValueAndUnit = biomarker.value !== undefined && biomarker.value !== null && biomarker.unit && biomarker.unit.trim() !== '';
          const existingHasValueAndUnit = existingBiomarker.value !== undefined && existingBiomarker.value !== null && existingBiomarker.unit && existingBiomarker.unit.trim() !== '';

          let shouldReplace = false;

          if (currentHasValueAndUnit && !existingHasValueAndUnit) {
            // Current biomarker has value/unit, existing one doesn't: replace
            shouldReplace = true;
          } else if (!currentHasValueAndUnit && existingHasValueAndUnit) {
            // Existing biomarker has value/unit, current one doesn't: keep existing
            shouldReplace = false;
          } else {
            // Both have value/unit OR neither has value/unit: fallback to confidence
            if ((biomarker.confidence || 0) > (existingBiomarker.confidence || 0)) {
              shouldReplace = true;
            }
            // If confidences are equal, the one already in the map is kept.
          }

          if (shouldReplace) {
            biomarkerMap.set(normalizedName, biomarker);
          }
        }
      }
      
      const dedupedBiomarkers = Array.from(biomarkerMap.values());
      console.log(`[BloodTestParser.extractBiomarkers] After deduplication: ${dedupedBiomarkers.length} biomarkers`);
      
      // Return the deduplicated biomarkers
      return dedupedBiomarkers;
    } catch (error) {
      console.error(`[BloodTestParser.extractBiomarkers] Error extracting biomarkers:`, error);
      return [];
    }
  } // <<< Closing brace for extractBiomarkers

  private extractRemarks(
    content: string,
    biomarkers: ExtractedBiomarker[] // biomarkers from previous step, should be valid array
  ): { remarks: Remark[]; updatedBiomarkers: ExtractedBiomarker[] } {
    // Debug logging disabled
    try {
      const externalResult = RemarksExtractor.extractRemarks(content, biomarkers);

      let finalRemarks: Remark[] = [];
      // Initialize finalUpdatedBiomarkers with the passed-in biomarkers array.
      let finalUpdatedBiomarkers: ExtractedBiomarker[] = biomarkers; 

      if (externalResult) {
        finalRemarks = externalResult.remarks || []; 
        // If externalResult.updatedBiomarkers is provided (not null/undefined), use it. 
        // Otherwise, finalUpdatedBiomarkers remains the original 'biomarkers' array.
        if (externalResult.updatedBiomarkers !== null && externalResult.updatedBiomarkers !== undefined) {
            finalUpdatedBiomarkers = externalResult.updatedBiomarkers;
        }

        // Debug logging disabled
      }
      
      return { remarks: finalRemarks, updatedBiomarkers: finalUpdatedBiomarkers };

    } catch (error) {
      // Debug logging disabled
      return { remarks: [], updatedBiomarkers: biomarkers };
    }
  }

  /**
   * Parse a string into a number, handling various formats
   */
  private parseNumber(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return NaN;
    
    // Remove any non-numeric characters except decimal point and minus sign
    const cleaned = value
      .replace(/[^\d.-]/g, '') // Keep only digits, decimal points, and minus signs
      .replace(/(\d),(?=\d)/g, '$1'); // Remove thousand separators
    
    return parseFloat(cleaned);
  }

  /**
   * Determine status based on value and reference range
   */
  private determineStatus(
    value: number,
    referenceRange?: string
  ): 'high' | 'normal' | 'low' | undefined {
    if (!referenceRange) return undefined;
    
    try {
      // Handle different reference range formats:
      // - 12.0 - 15.0
      // - 12.0-15.0
      // - <15.0
      // - >12.0
      const rangePattern = /([<>=]?)\s*(\d+(?:\.\d+)?)(?:\s*[-–—]\s*([<>=]?)\s*(\d+(?:\.\d+)?))?/;
      const match = referenceRange.match(rangePattern);
      
      if (!match) return 'normal'; // Can't determine status
      
      const [_, startOp, startStr, endOp, endStr] = match;
      
      // Handle single value with operator (e.g., <15.0)
      if (startOp && !endStr) {
        const refValue = parseFloat(startStr);
        if (isNaN(refValue)) return 'normal';
        
        if (startOp === '<' && value >= refValue) return 'high';
        if (startOp === '>' && value <= refValue) return 'low';
        return 'normal';
      }
      
      // Handle range (e.g., 12.0 - 15.0)
      const start = parseFloat(startStr);
      const end = endStr ? parseFloat(endStr) : start;
      
      if (isNaN(start) || isNaN(end)) return 'normal';
      
      if (value < start) return 'low';
      if (value > end) return 'high';
      return 'normal';
      
    } catch (error) {
      this.logMessage(`Error determining status: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Parse data when it's in CSV format
   */
  private parseCsvData(data: any[]): ParserResult {
    this.logMessage(`Parsing CSV data with ${data.length} rows`);
    
    try {
      const biomarkers: ExtractedBiomarker[] = [];
      
      // Look for key columns in headers
      const headers = Object.keys(data[0]);
      this.logMessage(`CSV headers: ${headers.join(', ')}`);
      
      // Try to identify column names based on common patterns
      const testNameKey = headers.find(h => /test|parameter|investigation|name|biomarker/i.test(h));
      const valueKey = headers.find(h => /result|value|reading/i.test(h));
      const unitKey = headers.find(h => /unit|measure/i.test(h));
      const rangeKey = headers.find(h => /range|reference|normal/i.test(h));
      
      if (!testNameKey || !valueKey) {
        this.logMessage('CSV missing required columns (test name and value)');
        return { success: false, error: 'CSV data missing required columns' };
      }
      
      // Process each row
      for (const row of data) {
        const name = row[testNameKey]?.toString().trim();
        const rawValue = row[valueKey];
        
        if (!name || !rawValue) continue;
        
        // Parse value, handling different formats
        const value = this.parseNumber(rawValue.toString());
        if (isNaN(value)) continue;
        
        // Get unit if available
        const unit = unitKey && row[unitKey] ? row[unitKey].toString().trim() : '';
        
        // Get reference range if available
        const referenceRange = rangeKey && row[rangeKey] ? row[rangeKey].toString().trim() : '';
        
        // Create biomarker with required fields
        const biomarker: ExtractedBiomarker = {
          name,
          standardName: name, // Will be standardized during validation
          value,
          unit,
          referenceRange,
          confidence: 0.9, // High confidence for structured data
          category: 'general', // Will be categorized during validation
          rawLineText: `${name}: ${value}${unit ? ' ' + unit : ''}${referenceRange ? ' (' + referenceRange + ')' : ''}`,
        };
        
        biomarkers.push(biomarker);
      }
      
      if (biomarkers.length === 0) {
        this.logMessage('No valid biomarkers found in CSV data');
        return { success: false, error: 'No valid biomarkers found in CSV data' };
      }
      
      // Validate biomarkers
      const validatedBiomarkers = BiomarkerValidator.validateAndFilter(biomarkers);
      const validationReport = BiomarkerValidator.generateValidationReport(validatedBiomarkers, []);
      
      return this.success({
        type: 'BLOOD_TEST',
        biomarkers: validatedBiomarkers,
        remarks: [],
        metadata: {
          parser: 'BloodTestParser-CSV',
          biomarkerCount: validatedBiomarkers.length,
          parsedAt: new Date().toISOString(),
          confidence: validationReport.averageConfidence,
          sections: ['CSV_DATA'],
          validation: validationReport,
          remarkCount: 0,
        },
        patientInfo: this.parsedData.patientInfo,
        labInfo: this.parsedData.labInfo,
        criticalFindings: validationReport.criticalFindings,
      });
      
    } catch (error) {
      this.logMessage(`Error parsing CSV data: ${error instanceof Error ? error.message : String(error)}`);
      return this.error('Failed to parse CSV data');
    }
  }

  /**
   * Parse the specialized lab report format for Bahria Town International Hospital
   */
  private parseSpecializedLabReport(content: string): ParserResult {
    try {
      this.logMessage('Parsing specialized lab report format');
      
      // Clean up OCR text - remove unexpected spaces between characters and fix common OCR errors
      this.logMessage('Preprocessing OCR text to normalize spacing issues');
      
      // First exclude the header/title information which is often misinterpreted as biomarker
      const headerEndIndex = content.indexOf('LABORATORY REPORT');
      let contentBody = content;
      
      if (headerEndIndex > 0) {
        contentBody = content.substring(headerEndIndex + 'LABORATORY REPORT'.length);
        this.logMessage(`Separated header from content body. Content starts with: ${contentBody.substring(0, 50)}...`);
      }
      
      // Extract patient information
      const patientInfo: PatientInfo = {};
      const mrNoMatch = contentBody.match(/MR[\.\s]*NO\s*[:,]\s*([^\s]+)/);
      const nameMatch = contentBody.match(/NAME\s*[:_]\s*([^\s].+?)(?=[SG]EX|$)/i);
      const sexMatch = contentBody.match(/SEX\s*[:,]?\s*([MFtTmf])/);
      const ageMatch = contentBody.match(/AGE\s*[:,]?\s*([\d]+)\s*[YyMm]/);
      
      if (mrNoMatch) patientInfo.id = mrNoMatch[1].trim();
      if (nameMatch) patientInfo.name = nameMatch[1].trim();
      if (sexMatch) patientInfo.gender = sexMatch[1].toUpperCase() === 'M' || sexMatch[1] === 't' ? 'male' : 'female';
      if (ageMatch) patientInfo.age = ageMatch[1].trim();
      
      // Extract lab information
      const labInfo: LabInfo = {
        name: 'BAHRIA TOWN INTERNATIONAL HOSPITAL',
        address: 'KARACHI BRANCH',
        reportDate: new Date().toISOString().split('T')[0], // Use current date if not found
      };
      
      // Extract biomarkers using a specialized approach for this format
      const biomarkers: ExtractedBiomarker[] = [];
      const remarks: Remark[] = [];
      
      // Process each test section from the contentBody (excluding header)
      const lines = contentBody.split('\n');
      let currentSection = 'BIOCHEMISTRY'; // Default section for Bahria Town reports
      let sectionStartLine = -1;
      
      this.logMessage(`Processing ${lines.length} lines for biomarker extraction`);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Detect section headers for Bahria Town reports
        // Special handling for OCR text where sections may have irregular spacing
        if (line && 
            !line.toLowerCase().includes('investigation') && 
            !line.toLowerCase().includes('sample') && 
            !line.toLowerCase().includes('remark') && 
            !line.toLowerCase().includes('methodology') && 
            !line.toLowerCase().includes('note') && 
            line.length > 3 && 
            !line.match(/^\s*[\d\.]+\s/) && // Not starting with a number (to avoid biomarker lines)
            i < lines.length - 1) {
          
          // Better detection for Bahria Town report sections with OCR text
          if ((i+1 < lines.length && lines[i+1].trim().toLowerCase().includes('sample')) || 
              (line.match(/CREATININE|MAGNESIUM|SERUM ELECTROLYTES|TSH|UREA/i))) {
            currentSection = line;
            sectionStartLine = i;
            this.logMessage(`Found section: ${currentSection}`);
          }
        }
        
        // Look for specific OCR-recognized section markers
        if (line.match(/CREATININE|MAGNESIUM|SERUM ELECTROLYTES|TSH|UREA/i) && 
            (i+1 < lines.length && lines[i+1].trim().toLowerCase().includes('sample'))) {
          currentSection = line;
          sectionStartLine = i;
          this.logMessage(`Found section marker: ${currentSection}`);
        }  
        
        // Handle the case where a biomarker line appears without a section header
        // by setting a default section if none is detected
        if (currentSection === '' && line.includes('BIOCHEMISTRY')) {
          currentSection = 'BIOCHEMISTRY';
          this.logMessage(`Set default section: ${currentSection}`);
        }
        
        // Specific test patterns for biomarkers in Bahria Town OCR report
        // These are based on the actual OCR output structure
        let biomarkerMatch = null;

        // Look for specific biomarkers from the OCR text
        if (line.includes('Creatinine') && line.includes('mg/dl')) {
          biomarkerMatch = line.match(/Creatinine[^\d]+(\d+[\.\d]*)\s*mg\/d[l1]/);
          if (biomarkerMatch) {
            const [_, value] = biomarkerMatch;
            biomarkerMatch = ['match', 'Creatinine (Serum)', value, 'mg/dl', 'Male 0.9-1.3 mg/dl, Female 0.6-1.1 mg/dl'];
            this.logMessage(`Found Creatinine marker using specific pattern: ${value} mg/dl`);
          }
        }
        // Magnesium specific pattern
        else if (line.includes('Magnesium') && !line.includes('Sample')) {
          biomarkerMatch = line.match(/Magnesium\s+(\d+[\.\d]*)\s*me/);
          if (biomarkerMatch) {
            const [_, value] = biomarkerMatch;
            biomarkerMatch = ['match', 'Magnesium', value, 'mg/dl', '1.6-2.6 mg/dl'];
            this.logMessage(`Found Magnesium marker using specific pattern: ${value} mg/dl`);
          }
        }
        // Sodium specific pattern
        else if (line.includes('Sodium') || (line.includes('odium') && line.includes('mea'))) {
          biomarkerMatch = line.match(/(Sodium|odium)[^\d]+(\d+)\s*mea/);
          if (biomarkerMatch) {
            const [_, name, value] = biomarkerMatch;
            biomarkerMatch = ['match', 'Sodium', value, 'mEq/L', '136-145 mEq/L'];
            this.logMessage(`Found Sodium marker using specific pattern: ${value} mEq/L`);
          }
        }
        // Potassium specific pattern
        else if (line.includes('Potassium') || line.includes('otassium')) {
          biomarkerMatch = line.match(/(Potassium|otassium)[^\d]+(\d+[\.\d]*)\s*me[q1]/);
          if (biomarkerMatch) {
            const [_, name, value] = biomarkerMatch;
            biomarkerMatch = ['match', 'Potassium', value, 'mEq/L', '3.5-5.2 mEq/L'];
            this.logMessage(`Found Potassium marker using specific pattern: ${value} mEq/L`);
          }
        }
        // Chloride specific pattern
        else if (line.includes('Chloride') || line.includes('hloride')) {
          biomarkerMatch = line.match(/(Chloride|hloride)[^\d]+(\d+)\s*me[aq]/);
          if (biomarkerMatch) {
            const [_, name, value] = biomarkerMatch;
            biomarkerMatch = ['match', 'Chloride', value, 'mEq/L', '96-107 mEq/L'];
            this.logMessage(`Found Chloride marker using specific pattern: ${value} mEq/L`);
          }
        }
        // Bicarbonate specific pattern
        else if (line.includes('Bicarbonate') || line.includes('icarbonate')) {
          biomarkerMatch = line.match(/(Bicarbonate|icarbonate)[^\d]+(\d+)\s*me[aq]/);
          if (biomarkerMatch) {
            const [_, name, value] = biomarkerMatch;
            biomarkerMatch = ['match', 'Bicarbonate', value, 'mEq/L', '22-29 mEq/L'];
            this.logMessage(`Found Bicarbonate marker using specific pattern: ${value} mEq/L`);
          }
        }
        // TSH specific pattern
        else if (line.includes('TSH') || line.includes('Tyrol') || line.includes('Stimulating Hormone')) {
          biomarkerMatch = line.match(/(TSH|Tyrol[^\(]+Hormone)[^\d]+(\d+\.\d+)\s*U\/m/);
          if (biomarkerMatch) {
            const [_, name, value] = biomarkerMatch;
            biomarkerMatch = ['match', 'TSH', value, 'uIU/mL', 'Adult 0.4-4.2 uIU/mL'];
            this.logMessage(`Found TSH marker using specific pattern: ${value} uIU/mL`);
          }
        }
        // Urea specific pattern
        else if (line.includes('Urea') && !line.includes('Sample')) {
          biomarkerMatch = line.match(/Urea[^\d]+(\d+)\s*mg\/d[l1]/);
          if (biomarkerMatch) {
            const [_, value] = biomarkerMatch;
            biomarkerMatch = ['match', 'Urea', value, 'mg/dl', '10-50 mg/dl'];
            this.logMessage(`Found Urea marker using specific pattern: ${value} mg/dl`);
          }
        }

        // If specialized pattern didn't match, try generic patterns
        if (!biomarkerMatch) {
          // Generic pattern for name-value-unit-range structure
        }
        
        // Debug output to help identify pattern issues
        if (line && !line.includes('Investigation') && !line.includes('Values') && !line.includes('Sample:') && 
            !line.includes('Remarks') && !line.includes('Methodology') && !line.includes('Note:')) {
          this.logMessage(`Analyzing potential biomarker line: ${line}`);
        }
        
        // Extract remarks
        if (line.startsWith('Remarks') || line.startsWith('Remarks:')) {
          let remarkText = '';
          let j = i + 1;
          while (j < lines.length && !lines[j].trim().startsWith('Methodology') && !lines[j].trim().startsWith('Sample:')) {
            if (lines[j].trim()) {
              remarkText += lines[j].trim() + ' ';
            }
            j++;
          }
          
          if (remarkText) {
            remarks.push({
              id: `remark-${new Date().getTime()}-${Math.floor(Math.random() * 1000)}`,
              associatedBiomarkers: biomarkers
                .filter(b => b.category === this.determineCategory(currentSection, ''))
                .map(b => b.standardName),
              type: 'general',
              confidence: 0.9,
              content: remarkText.trim(),
              source: 'direct'
            });
            this.logMessage(`Found remark: ${remarkText.substring(0, 50)}...`);
          }
        }
      }
      
      // Validate biomarkers
      const validatedBiomarkers = BiomarkerValidator.validateAndFilter(biomarkers);
      const validationReport = BiomarkerValidator.generateValidationReport(validatedBiomarkers, remarks);
      
      // Create the result object
      const result = {
        type: 'BLOOD_TEST',
        biomarkers: validatedBiomarkers,
        remarks,
        metadata: {
          parser: 'BloodTestParser-SpecializedFormat',
          biomarkerCount: validatedBiomarkers.length,
          parsedAt: new Date().toISOString(),
          confidence: validationReport.averageConfidence,
          sections: [currentSection],
          validation: validationReport,
          remarkCount: remarks.length,
        },
        patientInfo,
        labInfo,
        criticalFindings: validationReport.criticalFindings,
      };
      
      // Call endOverallParse with the correct scope
      if (this.performanceMonitor) {
        const resultLength = JSON.stringify(result).length;
        // Get the startPhase return function for the overall parse
        const endFn = this.performanceMonitor.startPhase('BloodTestParser.parse_overall_specialized', resultLength);
        if (endFn) endFn(resultLength);
        this.performanceMonitor.logReport();
        this.performanceMonitor.reset();
      }
      if (this.performanceMonitor) {
        this.performanceMonitor.logReport();
        this.performanceMonitor.reset(); // Reset for next parse call if instance is reused
      }
      
      return this.success({
        type: 'BLOOD_TEST',
        biomarkers: validatedBiomarkers,
        remarks,
        metadata: {
          parser: 'BloodTestParser-SpecializedFormat',
          biomarkerCount: validatedBiomarkers.length,
          parsedAt: new Date().toISOString(),
          confidence: validationReport.averageConfidence,
          sections: [currentSection],
          validation: validationReport,
          remarkCount: remarks.length,
        },
        patientInfo,
        labInfo,
        criticalFindings: validationReport.criticalFindings,
      });
    } catch (error) {
      this.logMessage(`Error in specialized parser: ${error instanceof Error ? error.message : String(error)}`);
      return this.error('Failed to parse specialized lab report', error instanceof Error ? error : undefined);
    }
  }
  
  /**
   * Helper method to create a standardized biomarker object
   */
  private createBiomarker(
    name: string, 
    value: number, 
    unit: string, 
    referenceRange: string, 
    section: string, 
    lineIndex: number, 
    confidence: number = 0.8
  ): ExtractedBiomarker {
    return {
      name: name,
      standardName: name,
      value: value,
      unit: unit,
      referenceRange: referenceRange,
      status: this.determineStatus(value, referenceRange),
      category: this.determineCategory(section, name),
      confidence: confidence,
      rawLineText: name + " " + value + " " + unit + " " + referenceRange
    };
  }



  /**
   * Normalize biomarker objects to clean up names and ensure consistency
   */
  private normalizeBiomarkerObjects(biomarkers: ExtractedBiomarker[]): ExtractedBiomarker[] {
    console.log('[BloodTestParser] Normalizing biomarker objects:', biomarkers.length);
    
    // Import the correct normalization function
    const { normalizeBiomarkerName } = require('./biomarkerDictionary');
    
    return biomarkers.map(biomarker => {
      // Skip if no name
      if (!biomarker.name) return biomarker;
      
      // Create a copy of the biomarker to avoid mutation
      const normalizedBiomarker = { ...biomarker };
      
      try {
        // Use biomarker dictionary's normalization function
        const cleanName = normalizeBiomarkerName(biomarker.name);
        
        // Update the biomarker with normalized name
        normalizedBiomarker.name = cleanName || biomarker.name; // Fallback to original if normalization fails
        
        // Also normalize the standardName
        if (normalizedBiomarker.standardName) {
          normalizedBiomarker.standardName = normalizeBiomarkerName(biomarker.standardName) || biomarker.standardName;
        } else {
          // If no standard name exists, use the normalized name as standard name
          normalizedBiomarker.standardName = cleanName || biomarker.name;
        }
        
        // If name is still pure garbage (e.g., just contains numbers or symbols), skip it
        if (!/[a-z]/i.test(normalizedBiomarker.name)) {
          console.log(`[BloodTestParser] Skipping invalid biomarker name: ${biomarker.name}`);
          return null;
        }
        
        // Log successful normalization for debugging
        if (biomarker.name !== normalizedBiomarker.name) {
          console.log(`[BloodTestParser] Normalized biomarker name: "${biomarker.name}" → "${normalizedBiomarker.name}"`);
        }
        
        return normalizedBiomarker;
      } catch (error) {
        console.error(`[BloodTestParser] Error normalizing biomarker ${biomarker.name}:`, error);
        // On error, return the original biomarker to ensure we don't lose data
        return biomarker;
      }
    }).filter(Boolean) as ExtractedBiomarker[]; // Remove null entries
  }

  /**
   * Determine the category of a biomarker based on the section and name
   */
  private determineCategory(section: string, name: string): string {
    // Default categories based on section titles
    if (section.includes('Vitamin')) return 'vitamins';
    if (section.includes('HbA1C') || name.includes('HbA1C') || name.includes('Glycosylated')) return 'diabetes';
    if (section.includes('Liver') || section.includes('LFT')) return 'liver';
    if (section.includes('Kidney') || section.includes('Renal')) return 'kidney';
    if (section.includes('Lipid') || section.includes('Cholesterol')) return 'lipids';
    if (section.includes('Thyroid')) return 'thyroid';
    if (section.includes('CBC') || section.includes('Complete Blood')) return 'blood_count';
    if (section.includes('Iron') || name.includes('Ferritin')) return 'iron';
    if (section.includes('Hormone')) return 'hormones';
    
    // Categories based on specific test names
    if (name.includes('Vitamin')) return 'vitamins';
    if (name.includes('Bilirubin') || name.includes('ALT') || name.includes('AST') || 
        name.includes('ALP') || name.includes('GGT')) return 'liver';
    if (name.includes('Creatinine') || name.includes('eGFR') || name.includes('BUN')) return 'kidney';
    if (name.includes('Glucose') || name.includes('Insulin')) return 'diabetes';
    if (name.includes('HDL') || name.includes('LDL') || name.includes('Triglyceride') || 
        name.includes('Cholesterol')) return 'lipids';
    if (name.includes('TSH') || name.includes('T3') || name.includes('T4')) return 'thyroid';
    if (name.includes('Hemoglobin') || name.includes('RBC') || name.includes('WBC') || 
        name.includes('Platelet') || name.includes('MCV') || name.includes('MCH')) return 'blood_count';
    if (name.includes('Testosterone') || name.includes('Estrogen') || 
        name.includes('Progesterone')) return 'hormones';
    
    return 'general'; // Default category
  }

  /**
   * Cleanup method to explicitly release large objects and reset state
   * to prevent memory leaks between tests
   */
  public cleanup(): void {
    // Clear large strings - set to empty to help garbage collection
    this.content = '';
    
    // Reset internal state objects based on what's available in this class
    this.sections = new Map<string, ReportSection>();
    this.parsedData = {};
    
    // Reset private internal state that might exist from parsing
    // These are accessed with type safety via class methods
    // @ts-expect-error - accessing private properties for cleanup
    if (this._extractedBiomarkers) this._extractedBiomarkers = [];
    // @ts-expect-error - accessing private properties for cleanup
    if (this._normalizedContent) this._normalizedContent = '';
    // @ts-expect-error - accessing private properties for cleanup
    if (this._remarks) this._remarks = [];
    
    // Reset performance monitor if it exists
    if (this.performanceMonitor) {
      this.performanceMonitor.reset();
      // Just set to null after reset
      this.performanceMonitor = null;
    }
    
    // Reset logger to free up any retained references
    if (this.logger) {
      this.logger = null;
    }
    
    // Explicitly trigger garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc();
      } catch (e) {
        // Silently ignore errors if gc can't be called
      }
    }
  }

}

export default BloodTestParser;
