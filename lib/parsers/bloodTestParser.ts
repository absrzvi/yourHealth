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
  private parsedData: {
    patientInfo?: PatientInfo;
    labInfo?: LabInfo;
  } = {};
  private sections = new Map<string, ReportSection>();

  constructor(file: File | null = null, content: string = '') {
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
  }
  
  /**
   * Log a message to both console and file for debugging
   */
  private logMessage(message: string): void {
    console.log(message);
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `${timestamp} - ${message}\n`;
      fs.appendFileSync(this.logPath, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
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
    if (error?.stack) {
      this.logMessage(`Stack trace: ${error.stack}`);
    }
    return {
      success: false,
      error: message
    };
  }

  /**
   * Main parsing method that coordinates the parsing process
   */
  async parse(): Promise<ParserResult> {
    try {
      this.logMessage('Starting blood test report parsing');
      
      // Step 1: Preprocess the content
      this.logMessage('Step 1: Preprocessing content');
      const preprocessedContent = TextPreprocessor.preprocess(this.content);
      
      // Step 2: Parse document sections
      this.logMessage('Step 2: Parsing document sections');
      this.sections = SectionParser.parseSections(preprocessedContent);
      
      // Step 3: Extract patient and lab information
      this.logMessage('Step 3: Extracting metadata');
      this.extractMetadata(preprocessedContent);
      
      // Step 4: Extract biomarkers
      this.logMessage('Step 4: Extracting biomarkers');
      const biomarkers = await this.extractBiomarkers(preprocessedContent);
      
      // Step 5: Extract and associate remarks
      this.logMessage('Step 5: Extracting clinical remarks');
      const { remarks, updatedBiomarkers } = await this.extractRemarks(preprocessedContent, biomarkers);
      
      // Step 6: Validate biomarkers and generate report
      this.logMessage('Step 6: Validating results');
      const validatedBiomarkers = BiomarkerValidator.validateAndFilter(updatedBiomarkers);
      const validationReport = BiomarkerValidator.generateValidationReport(validatedBiomarkers, remarks);
      
      // Step 7: Prepare final result
      this.logMessage('Step 7: Preparing final result');
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
      
      this.logMessage(`Parsing completed successfully. Found ${validatedBiomarkers.length} biomarkers and ${remarks.length} remarks.`);
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
    this.logMessage('Extracting metadata from content');
    
    // Extract patient information
    this.parsedData.patientInfo = SectionParser.extractPatientInfo(content);
    this.logMessage(`Extracted patient info: ${JSON.stringify(this.parsedData.patientInfo)}`);
    
    // Extract lab information
    this.parsedData.labInfo = SectionParser.extractLabInfo(content);
    this.logMessage(`Extracted lab info: ${JSON.stringify(this.parsedData.labInfo)}`);
  }

  /**
   * Extract biomarkers from the report content
   */
  private async extractBiomarkers(content: string): Promise<ExtractedBiomarker[]> {
    this.logMessage('Starting biomarker extraction');
    
    try {
      // Use the BiomarkerExtractor to get biomarkers from content
      const biomarkers = BiomarkerExtractor.extractBiomarkers(content);
      this.logMessage(`Extracted ${biomarkers.length} potential biomarkers`);
      
      return biomarkers;
    } catch (error) {
      this.logMessage(`Error extracting biomarkers: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Extract and associate remarks with biomarkers
   */
  private async extractRemarks(
    content: string,
    biomarkers: ExtractedBiomarker[]
  ): Promise<{ remarks: Remark[]; updatedBiomarkers: ExtractedBiomarker[] }> {
    this.logMessage('Starting remarks extraction');
    
    try {
      // Use the RemarksExtractor to get remarks and associate them with biomarkers
      const result = RemarksExtractor.extractRemarks(content, biomarkers);
      this.logMessage(`Extracted ${result.remarks.length} remarks`);
      
      return result;
    } catch (error) {
      this.logMessage(`Error extracting remarks: ${error instanceof Error ? error.message : String(error)}`);
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
          rawText: `${name}: ${value}${unit ? ' ' + unit : ''}${referenceRange ? ' (' + referenceRange + ')' : ''}`,
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
}

export default BloodTestParser;
