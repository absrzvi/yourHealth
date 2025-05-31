/**
 * Generic Biomarker Extractor
 * 
 * This module provides pattern-based extraction of biomarkers from normalized OCR text.
 * It uses a multi-pass approach with decreasing confidence thresholds to extract as many biomarkers as possible.
 */

import { ExtractedBiomarker } from './types';

// Standard biomarker reference ranges based on common medical guidelines
interface BiomarkerReference {
  name: string;
  unit: string;
  range: string;
  category: string;
}

/**
 * GenericBiomarkerExtractor provides methods to extract biomarkers from 
 * normalized OCR text using pattern recognition and knowledge-based matching
 */
export class GenericBiomarkerExtractor {
  // Common biomarkers with their reference ranges and units
  private static commonBiomarkers: BiomarkerReference[] = [
    { name: 'CREATININE', unit: 'mg/dL', range: '0.7-1.3', category: 'kidney' },
    { name: 'GLUCOSE', unit: 'mg/dL', range: '70-99', category: 'diabetes' },
    { name: 'SODIUM', unit: 'mmol/L', range: '135-145', category: 'electrolytes' },
    { name: 'POTASSIUM', unit: 'mmol/L', range: '3.5-5.1', category: 'electrolytes' },
    { name: 'CHLORIDE', unit: 'mmol/L', range: '98-107', category: 'electrolytes' },
    { name: 'BUN', unit: 'mg/dL', range: '7-20', category: 'kidney' },
    { name: 'UREA', unit: 'mg/dL', range: '15-40', category: 'kidney' },
    { name: 'CALCIUM', unit: 'mg/dL', range: '8.5-10.2', category: 'electrolytes' },
    { name: 'MAGNESIUM', unit: 'mg/dL', range: '1.7-2.2', category: 'electrolytes' },
    { name: 'PHOSPHORUS', unit: 'mg/dL', range: '2.5-4.5', category: 'electrolytes' },
    { name: 'ALBUMIN', unit: 'g/dL', range: '3.4-5.4', category: 'liver' },
    { name: 'TOTAL PROTEIN', unit: 'g/dL', range: '6.0-8.3', category: 'liver' },
    { name: 'BILIRUBIN', unit: 'mg/dL', range: '0.1-1.2', category: 'liver' },
    { name: 'ALT', unit: 'U/L', range: '7-55', category: 'liver' },
    { name: 'AST', unit: 'U/L', range: '8-48', category: 'liver' },
    { name: 'ALP', unit: 'U/L', range: '40-129', category: 'liver' },
    { name: 'CHOLESTEROL', unit: 'mg/dL', range: '<200', category: 'lipids' },
    { name: 'TRIGLYCERIDES', unit: 'mg/dL', range: '<150', category: 'lipids' },
    { name: 'HDL', unit: 'mg/dL', range: '>40', category: 'lipids' },
    { name: 'LDL', unit: 'mg/dL', range: '<100', category: 'lipids' },
    { name: 'TSH', unit: 'μIU/mL', range: '0.4-4.0', category: 'thyroid' },
    { name: 'T3', unit: 'ng/dL', range: '80-200', category: 'thyroid' },
    { name: 'T4', unit: 'μg/dL', range: '5.0-12.0', category: 'thyroid' },
    { name: 'HEMOGLOBIN', unit: 'g/dL', range: '13.5-17.5', category: 'blood_count' },
    { name: 'HEMATOCRIT', unit: '%', range: '38.8-50.0', category: 'blood_count' },
    { name: 'WBC', unit: 'x10^3/μL', range: '4.5-11.0', category: 'blood_count' },
    { name: 'RBC', unit: 'x10^6/μL', range: '4.5-5.9', category: 'blood_count' },
    { name: 'PLATELETS', unit: 'x10^3/μL', range: '150-450', category: 'blood_count' },
    { name: 'VITAMIN D', unit: 'ng/mL', range: '30-100', category: 'vitamins' },
    { name: 'VITAMIN B12', unit: 'pg/mL', range: '200-900', category: 'vitamins' },
  ];

  /**
   * Extract biomarkers from normalized OCR text using multiple pattern-matching approaches
   * @param text Normalized OCR text
   * @returns Array of extracted biomarkers
   */
  static extractBiomarkers(text: string): ExtractedBiomarker[] {
    // Debug logging disabled
    
    const biomarkers: ExtractedBiomarker[] = [];
    
    // Run multiple extraction passes with decreasing strictness
    const knowledgeBasedBiomarkers = this.knowledgeBasedExtraction(text);
    const patternBasedBiomarkers = this.patternBasedExtraction(text);
    
    // Combine and deduplicate
    const allBiomarkers = [...knowledgeBasedBiomarkers, ...patternBasedBiomarkers];
    
    // Basic deduplication by name - prefer higher confidence
    const uniqueBiomarkers = new Map<string, ExtractedBiomarker>();
    for (const biomarker of allBiomarkers) {
      const existing = uniqueBiomarkers.get(biomarker.name.toLowerCase());
      if (!existing || biomarker.confidence > existing.confidence) {
        uniqueBiomarkers.set(biomarker.name.toLowerCase(), biomarker);
      }
    }
    
    console.log(`Extracted ${uniqueBiomarkers.size} biomarkers from ${allBiomarkers.length} total matches`);
    return Array.from(uniqueBiomarkers.values());
  }
  
  /**
   * Extract biomarkers using knowledge of common test names, units, and ranges
   */
  private static knowledgeBasedExtraction(text: string): ExtractedBiomarker[] {
    // Debug logging disabled
    const biomarkers: ExtractedBiomarker[] = [];
    
    // Split text into lines for processing
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Skip lines that are clearly not biomarker entries
      if (line.length < 4 || 
          line.match(/page|date|laboratory|report|address|sample|collected|name|sex|age|mr|phone/i)) {
        continue;
      }
      
      // Check for each known biomarker
      for (const reference of this.commonBiomarkers) {
        // Look for the biomarker name in a case-insensitive way
        const nameRegex = new RegExp(`\\b${reference.name}\\b`, 'i');
        if (nameRegex.test(line)) {
          // Try to find a number in the line - this would be the value
          const numberMatch = line.match(/\b(\d+\.?\d*)\b/);
          if (numberMatch) {
            const value = parseFloat(numberMatch[1]);
            
            // If we found a value, create a biomarker entry
            const biomarker: ExtractedBiomarker = {
              name: reference.name,
              standardName: reference.name,
              value: value,
              unit: reference.unit,  // Use standard unit from reference
              referenceRange: reference.range,  // Use standard range from reference
              confidence: 0.85,  // High confidence for knowledge-based extraction
              category: reference.category,
              rawLineText: line
            };
            
            biomarkers.push(biomarker);
            // Debug logging disabled
          }
        }
      }
    }
    
    return biomarkers;
  }
  
  /**
   * Extract biomarkers using pattern matching for common lab report layouts
   */
  private static patternBasedExtraction(text: string): ExtractedBiomarker[] {
    // Debug logging disabled
    const biomarkers: ExtractedBiomarker[] = [];
    
    // Split text into lines for processing
    const lines = text.split('\n');
    
    // Generate random ID for the biomarker
    const generateId = () => `bio-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    for (const line of lines) {
      // Skip lines that are clearly headers, footers, or formatting
      if (line.length < 4 || 
          line.match(/page|date|laboratory|report|address|sample|collected|name|sex|age|mr|phone/i)) {
        continue;
      }
      
      // Try different pattern matching strategies
      
      // Pattern 1: Name followed by number and unit, then reference range
      // Example: "Glucose 95 mg/dL 70-99"
      const pattern1 = line.match(/([A-Za-z][A-Za-z\s]+)\s+(\d+\.?\d*)\s+([A-Za-z/%]+)(?:\s+([0-9<>.-]+|[0-9.]+-[0-9.]+))?/);
      if (pattern1) {
        const [_, name, valueStr, unit, refRange] = pattern1;
        const value = parseFloat(valueStr);
        
        if (!isNaN(value) && name.trim()) {
          const biomarker: ExtractedBiomarker = {
            name: name.trim(),
            standardName: name.trim(),
            value,
            unit: unit.trim(),
            referenceRange: refRange ? refRange.trim() : '',
            confidence: 0.8,
            category: this.determineCategoryFromName(name.trim()),
            rawLineText: line
          };
          
          biomarkers.push(biomarker);
          // Debug logging disabled
          continue;
        }
      }
      
      // Pattern 2: Name and value with delimiter (colon, equals)
      // Example: "Creatinine: 0.9 mg/dL"
      const pattern2 = line.match(/([A-Za-z][A-Za-z\s]+)[:\s=]+(\d+\.?\d*)\s*([A-Za-z/%]+)/i);
      if (pattern2) {
        const [_, name, valueStr, unit] = pattern2;
        const value = parseFloat(valueStr);
        
        if (!isNaN(value) && name.trim()) {
          const biomarker: ExtractedBiomarker = {
            name: name.trim(),
            standardName: name.trim(),
            value,
            unit: unit.trim(),
            referenceRange: '',  // No reference range in this pattern
            confidence: 0.7,
            category: this.determineCategoryFromName(name.trim()),
            rawLineText: line
          };
          
          biomarkers.push(biomarker);
          // Debug logging disabled
          continue;
        }
      }
      
      // Pattern 3: Isolated number followed by unit in a line with biomarker name
      // Example: "Creatinine (Serum) 0.9 mg/dL"
      const pattern3 = line.match(/([A-Za-z][A-Za-z\s()]+)\s+(\d+\.?\d*)\s+([A-Za-z/%]+)/i);
      if (pattern3) {
        const [_, name, valueStr, unit] = pattern3;
        const value = parseFloat(valueStr);
        
        if (!isNaN(value) && name.trim()) {
          const biomarker: ExtractedBiomarker = {
            name: name.trim(),
            standardName: name.trim(),
            value,
            unit: unit.trim(),
            referenceRange: '',
            confidence: 0.65,
            category: this.determineCategoryFromName(name.trim()),
            rawLineText: line
          };
          
          biomarkers.push(biomarker);
          // Debug logging disabled
        }
      }
    }
    
    return biomarkers;
  }
  
  /**
   * Determine biomarker category based on name
   */
  private static determineCategoryFromName(name: string): string {
    // Normalize the name for comparison
    const normalizedName = name.toLowerCase();
    
    // Check against common biomarker names to determine category
    if (/creatinine|urea|bun|egfr|gfr/.test(normalizedName)) {
      return 'kidney';
    }
    
    if (/glucose|hba1c|insulin|glyco/.test(normalizedName)) {
      return 'diabetes';
    }
    
    if (/sodium|potassium|chloride|calcium|magnesium|phosph/.test(normalizedName)) {
      return 'electrolytes';
    }
    
    if (/cholesterol|triglyceride|hdl|ldl|vldl/.test(normalizedName)) {
      return 'lipids';
    }
    
    if (/tsh|t3|t4|thyroid/.test(normalizedName)) {
      return 'thyroid';
    }
    
    if (/hemoglobin|hematocrit|wbc|rbc|platelets|mch|mchc|mcv/.test(normalizedName)) {
      return 'blood_count';
    }
    
    if (/vitamin|vit |folate|b12|b6|b1|d3|a |e |k |c /.test(normalizedName)) {
      return 'vitamins';
    }
    
    if (/alt|ast|alp|ggt|bilirubin|protein|albumin|globulin/.test(normalizedName)) {
      return 'liver';
    }
    
    if (/testosterone|estrogen|estradiol|progesterone|lh|fsh/.test(normalizedName)) {
      return 'hormones';
    }
    
    // Default category
    return 'general';
  }
  
  /**
   * Determine status based on value and reference range
   */
  static determineStatus(value: number, referenceRange?: string): 'low' | 'normal' | 'high' | 'critical' | undefined {
    if (!referenceRange) return undefined;
    
    try {
      // Handle ranges like "70-99"
      const rangeMatch = referenceRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
      if (rangeMatch) {
        const lower = parseFloat(rangeMatch[1]);
        const upper = parseFloat(rangeMatch[2]);
        
        if (value < lower) return 'low';
        if (value > upper) return 'high';
        return 'normal';
      }
      
      // Handle thresholds like "<200"
      const lessThanMatch = referenceRange.match(/<(\d+\.?\d*)/);
      if (lessThanMatch) {
        const threshold = parseFloat(lessThanMatch[1]);
        if (value >= threshold) return 'high';
        return 'normal';
      }
      
      // Handle thresholds like ">40"
      const greaterThanMatch = referenceRange.match(/>(\d+\.?\d*)/);
      if (greaterThanMatch) {
        const threshold = parseFloat(greaterThanMatch[1]);
        if (value <= threshold) return 'low';
        return 'normal';
      }
    } catch (error) {
      // Debug logging disabled
    }
    
    return undefined;
  }
}

export default GenericBiomarkerExtractor;
