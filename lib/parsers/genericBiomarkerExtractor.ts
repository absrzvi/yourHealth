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
    // TEMPORARY DEBUG LOGGING
    console.log('[DEBUG] GenericBiomarkerExtractor.extractBiomarkers - Input text first 100 chars:', text.substring(0, 100));
    console.log('[DEBUG] GenericBiomarkerExtractor.extractBiomarkers - Text length:', text.length);
    
    const biomarkers: ExtractedBiomarker[] = [];
    
    // Run multiple extraction passes with decreasing strictness
    const knowledgeBasedBiomarkers = this.knowledgeBasedExtraction(text);
    const patternBasedBiomarkers = this.patternBasedExtraction(text);
    
    // TEMPORARY DEBUG LOGGING
    console.log('[DEBUG] knowledgeBasedBiomarkers:', knowledgeBasedBiomarkers.length);
    console.log('[DEBUG] patternBasedBiomarkers:', patternBasedBiomarkers.length);
    
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
    console.log('[GenericBiomarkerExtractor] patternBasedExtraction called with text length:', text.length);
    const biomarkers: ExtractedBiomarker[] = [];
    
    // Split text into lines for processing
    const lines = text.split('\n');
    console.log('[GenericBiomarkerExtractor] Processing', lines.length, 'lines');
    
    // Generate random ID for the biomarker
    const generateId = () => `bio-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Look for specific biomarkers in the text
    const knownBiomarkers = [
      'Sodium', 'Potassium', 'Chloride', 'Calcium', 'Magnesium', 'Phosphate', 'Phosphorus',
      'Creatinine', 'BUN', 'Urea', 'Glucose', 'HbA1c', 'eGFR', 'GFR', 
      'TSH', 'T3', 'T4', 'Free T3', 'Free T4',
      'Cholesterol', 'HDL', 'LDL', 'Triglycerides', 'VLDL',
      'ALT', 'AST', 'ALP', 'GGT', 'Bilirubin', 'Total Protein', 'Albumin', 'Globulin',
      'Hemoglobin', 'Hematocrit', 'RBC', 'WBC', 'Platelets', 'MCV', 'MCH', 'MCHC',
      'Vitamin D', 'Vitamin B12', 'Folate', 'Ferritin', 'Iron'
    ];
    
    // Log presence of some common biomarkers for debugging
    for (const marker of ['Sodium', 'Creatinine', 'Glucose', 'Potassium', 'Hemoglobin']) {
      const markerIndex = lines.findIndex(l => new RegExp(`\\b${marker}\\b`, 'i').test(l));
      if (markerIndex >= 0) {
        console.log(`[GenericBiomarkerExtractor] Found ${marker} line:`, lines[markerIndex]);
      }
    }
  
    // First, try a more direct approach for the known biomarkers
    for (const biomarkerName of knownBiomarkers) {
      // Look for lines that contain this biomarker name
      for (const line of lines) {
        if (new RegExp(`\\b${biomarkerName}\\b`, 'i').test(line)) {
          // Check if the line contains a number (potential value)
          const valueMatch = line.match(/\b(\d+\.?\d*)\b/g);
          if (valueMatch && valueMatch.length > 0) {
            // Try to find a unit in the line
            const unitMatch = line.match(/\b(mg\/d[Ll]|g\/d[Ll]|mmol\/[Ll]|U\/[Ll]|IU\/[Ll]|meq\/[Ll]|µ?g\/[Ll]|%|µIU\/m[Ll]|ng\/m[Ll]|pg\/m[Ll]|f[Ll]|x10\^\d+\/[µu][Ll])\b/i);
            const value = parseFloat(valueMatch[0]);
            const unit = unitMatch ? unitMatch[0] : '';
            
            if (!isNaN(value)) {
              // Try to find a reference range in the line
              const rangeMatch = line.match(/\b(\d+\.?\d*\s*[-–—]\s*\d+\.?\d*)\b/);
              const refRange = rangeMatch ? rangeMatch[0] : '';
              
              biomarkers.push({
                name: biomarkerName,
                standardName: biomarkerName,
                value: value,
                unit: unit,
                referenceRange: refRange,
                confidence: 0.9, // High confidence for known biomarkers
                category: this.determineCategoryFromName(biomarkerName),
                rawLineText: line
              });
              
              console.log(`[GenericBiomarkerExtractor] Found ${biomarkerName}: ${value} ${unit}`);
            }
          }
        }
      }
    }
    
    // Now process line by line with pattern matching
    for (const line of lines) {
      // Log potential biomarker lines for debugging
      if (line.includes('mg/') || line.includes('meq') || line.includes('g/dl') || 
          line.includes('mmol') || line.includes('U/L') || line.includes('%')) {
        console.log('[GenericBiomarkerExtractor] Potential biomarker line:', line);
      }
      
      // Skip lines that are clearly headers, footers, or formatting
      if (line.length < 4 || 
          line.match(/page|date|laboratory|report|address|contact|printed|methodology|methadology/i)) {
        continue;
      }
      
      // Try different pattern matching strategies
      
      // Pattern 1: Name followed by number and unit, then reference range
      // Example: "Glucose 95 mg/dL 70-99"
      const pattern1 = line.match(/([A-Za-z][A-Za-z\s\-.,()]+)\s+(\d+\.?\d*)\s+([A-Za-z/%µ]+\/?[A-Za-z0-9]*|me\/[^\s]+|mea\/[^\s]+|u\/ml|iu\/ml|x10\^\d+\/[µu]l)(?:\s+([0-9<>.,\-–—]+|[0-9.,]+\s*[\-–—]\s*[0-9.,]+))?/i);
      if (pattern1) {
        const [_, name, valueStr, unitRaw, refRange] = pattern1;
        const value = parseFloat(valueStr);
        
        // Normalize unit with common OCR errors
        let unit = unitRaw.trim();
        // Fix common OCR errors in units
        if (unit.match(/me\/[eél]/i) || unit.match(/mea\//i)) {
          unit = 'mg/dL'; // Common substitution error
        } else if (unit.match(/mea?q\/?[!1iIl]/i)) {
          unit = 'meq/L'; // Common substitution error
        } else if (unit.match(/[uµ]\/ml/i)) {
          unit = 'U/mL'; // Fix for microunits
        } else if (unit.match(/i[uµ]\/ml/i)) {
          unit = 'IU/mL'; // Fix for international units
        }
        
        if (!isNaN(value) && name.trim()) {
          const normalizedName = name.trim().replace(/\s+/g, ' ');
          const biomarker: ExtractedBiomarker = {
            name: normalizedName,
            standardName: normalizedName,
            value,
            unit: unit,
            referenceRange: refRange ? refRange.trim() : '',
            confidence: 0.8,
            category: this.determineCategoryFromName(normalizedName),
            rawLineText: line
          };
          
          biomarkers.push(biomarker);
          console.log(`[GenericBiomarkerExtractor] Pattern 1 match: ${normalizedName}: ${value} ${unit}`);
          continue;
        }
      }
      
      // Pattern 2: Name and value with delimiter (colon, equals)
      // Example: "Creatinine: 0.9 mg/dL" or "Creatinine = 0.9 mg/dL"
      const pattern2 = line.match(/([A-Za-z][A-Za-z\s\-.,()]+)\s*[:=]\s*(\d+\.?\d*)\s*([A-Za-z/%µ]+\/?[A-Za-z0-9]*|me\/[^\s]+|mea\/[^\s]+|u\/ml|iu\/ml|x10\^\d+\/[µu]l)(?:\s+([0-9<>.,\-–—]+|[0-9.,]+\s*[\-–—]\s*[0-9.,]+))?/i);
      if (pattern2) {
        const [_, name, valueStr, unitRaw, refRange] = pattern2;
        const value = parseFloat(valueStr);
        
        // Normalize unit with common OCR errors
        let unit = unitRaw.trim();
        // Fix common OCR errors in units
        if (unit.match(/me\/[eél]/i) || unit.match(/mea\//i)) {
          unit = 'mg/dL'; // Common substitution error
        } else if (unit.match(/mea?q\/?[!1iIl]/i)) {
          unit = 'meq/L'; // Common substitution error
        } else if (unit.match(/[uµ]\/ml/i)) {
          unit = 'U/mL'; // Fix for microunits
        } else if (unit.match(/i[uµ]\/ml/i)) {
          unit = 'IU/mL'; // Fix for international units
        }
        
        if (!isNaN(value) && name.trim()) {
          const normalizedName = name.trim().replace(/\s+/g, ' ');
          const biomarker: ExtractedBiomarker = {
            name: normalizedName,
            standardName: normalizedName,
            value,
            unit: unit,
            referenceRange: refRange ? refRange.trim() : '',  // Now we capture reference range if present
            confidence: 0.75,
            category: this.determineCategoryFromName(normalizedName),
            rawLineText: line
          };
          
          biomarkers.push(biomarker);
          console.log(`[GenericBiomarkerExtractor] Pattern 2 match: ${normalizedName}: ${value} ${unit}`);
          continue;
        }
      }
      
      // Pattern 3: Tabular format with name at start, value in middle, and reference range
      // Example: "Sodium s41mea/! 136-145 mea/!" or "Potassium 4.2 meq/L 3.5-5.0"
      const pattern3 = line.match(/^\s*([A-Za-z][A-Za-z\s\-.,()]+)\s+([s!1]?\d+\.?\d*)\s*([A-Za-z/%µ]+\/?[A-Za-z!1]*|me\/[^\s]+|mea\/[^\s]+|u\/ml|iu\/ml|x10\^\d+\/[µu]l)\s+([0-9<>.,\-–—]+|[0-9.,]+\s*[\-–—]\s*[0-9.,]+)/i);
      if (pattern3) {
        const [_, name, valueStrRaw, unitRaw, refRange] = pattern3;
        // Fix common OCR errors in values
        let valueStr = valueStrRaw;
        if (valueStr.startsWith('s') || valueStr.startsWith('!')) {
          valueStr = '1' + valueStr.substring(1); // Fix common OCR error for '1'
        }
        const value = parseFloat(valueStr);
        
        // Normalize unit with common OCR errors
        let unit = unitRaw.trim();
        // Fix common OCR errors in units
        if (unit.match(/me\/[eél]/i) || unit.match(/mea\//i)) {
          unit = 'mg/dL'; // Common substitution error
        } else if (unit.match(/mea?q\/?[!1iIl]/i)) {
          unit = 'meq/L'; // Common substitution error
        } else if (unit.match(/[uµ]\/ml/i)) {
          unit = 'U/mL'; // Fix for microunits
        } else if (unit.match(/i[uµ]\/ml/i)) {
          unit = 'IU/mL'; // Fix for international units
        }
        
        if (!isNaN(value) && name.trim()) {
          const normalizedName = name.trim().replace(/\s+/g, ' ');
          const biomarker: ExtractedBiomarker = {
            name: normalizedName,
            standardName: normalizedName,
            value,
            unit: unit,
            referenceRange: refRange ? refRange.trim() : '',
            confidence: 0.8, // Increased confidence as tabular formats are usually reliable
            category: this.determineCategoryFromName(normalizedName),
            rawLineText: line
          };
          
          biomarkers.push(biomarker);
          console.log(`[GenericBiomarkerExtractor] Pattern 3 match: ${normalizedName}: ${value} ${unit}, range: ${refRange}`);
          continue;
        }
      }
      
      // Pattern 4: Isolated biomarker with value and unit
      // Example: "Creatinine (Serum) 0.9 mg/dL" or "Creatinine  0.9"
      const pattern4 = line.match(/([A-Za-z][A-Za-z\s\-.,()]+)\s+(\d+\.?\d*)\s*([A-Za-z/%µ]+\/?[A-Za-z0-9]*|me\/[^\s]+|mea\/[^\s]+|u\/ml|iu\/ml|x10\^\d+\/[µu]l)?/i);
      if (pattern4 && !pattern1 && !pattern2 && !pattern3) { // Only if other patterns didn't match
        const [_, name, valueStr, unitRaw] = pattern4;
        const value = parseFloat(valueStr);
        
        // Only continue if the name matches a known biomarker to avoid false positives
        const normalizedName = name.trim().replace(/\s+/g, ' ');
        
        // Check if this is likely a real biomarker - match against parts of known biomarker names
        if (!this.isLikelyBiomarker(normalizedName)) {
          continue;
        }
        
        // Normalize unit with common OCR errors
        let unit = unitRaw ? unitRaw.trim() : '';
        // Fix common OCR errors in units
        if (unit.match(/me\/[eél]/i) || unit.match(/mea\//i)) {
          unit = 'mg/dL'; // Common substitution error
        } else if (unit.match(/mea?q\/?[!1iIl]/i)) {
          unit = 'meq/L'; // Common substitution error
        } else if (unit.match(/[uµ]\/ml/i)) {
          unit = 'U/mL'; // Fix for microunits
        } else if (unit.match(/i[uµ]\/ml/i)) {
          unit = 'IU/mL'; // Fix for international units
        }
        
        // Try to infer unit if missing, based on the biomarker name
        if (!unit) {
          unit = this.inferUnitFromName(normalizedName);
        }
        
        if (!isNaN(value)) {
          const biomarker: ExtractedBiomarker = {
            name: normalizedName,
            standardName: normalizedName,
            value,
            unit: unit,
            referenceRange: '',
            confidence: 0.65,
            category: this.determineCategoryFromName(normalizedName),
            rawLineText: line
          };
          
          biomarkers.push(biomarker);
          console.log(`[GenericBiomarkerExtractor] Pattern 4 match: ${normalizedName}: ${value} ${unit}`);
        }
      }
      
      // Pattern 5: Handle hormone tests with U/mL or IU/mL units
      // Example: "TSH 4.23 U/mL" or "TSH 4.23 uU/mL"
      const pattern5 = line.match(/([A-Za-z][A-Za-z\s()]+)\s+(\d+\.?\d*)\s+([uU]+\/m[lL]|[iI][uU]\/m[lL])/i);
      if (pattern5) {
        const [_, name, valueStr, unit] = pattern5;
        const value = parseFloat(valueStr);
        
        if (!isNaN(value) && name.trim()) {
          const biomarker: ExtractedBiomarker = {
            name: name.trim(),
            standardName: name.trim(),
            value,
            unit: unit.trim(),
            referenceRange: '',
            confidence: 0.75,
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
   * Check if a name is likely to be a biomarker by comparing with common biomarker names
   */
  private static isLikelyBiomarker(name: string): boolean {
    const normalizedName = name.toLowerCase();
    
    // Check against common biomarker patterns to avoid false positives
    return (
      /creatinine|urea|bun|egfr|gfr|glucose|hba1c|insulin|glyco|sodium|potassium|chloride|calcium|magnesium|phosph|cholesterol|triglyceride|hdl|ldl|vldl|tsh|t3|t4|thyroid|hemoglobin|hematocrit|wbc|rbc|platelets|mch|mchc|mcv|vitamin|vit |folate|b12|b6|b1|d3|a |e |k |c |alt|ast|alp|ggt|bilirubin|protein|albumin|globulin|testosterone|estrogen|estradiol|progesterone|lh|fsh/.test(normalizedName)
    );
  }
  
  /**
   * Infer a unit for a biomarker based on its name
   */
  private static inferUnitFromName(name: string): string {
    const normalizedName = name.toLowerCase();
    
    // Electrolytes typically use meq/L
    if (/sodium|potassium|chloride|bicarbonate|co2/.test(normalizedName)) {
      return 'meq/L';
    }
    
    // Blood glucose and related typically use mg/dL in US
    if (/glucose|sugar|creatinine|urea|bun/.test(normalizedName)) {
      return 'mg/dL';
    }
    
    // Cholesterol and lipids typically use mg/dL in US
    if (/cholesterol|lipid|triglyceride|hdl|ldl|vldl/.test(normalizedName)) {
      return 'mg/dL';
    }
    
    // Thyroid hormones
    if (/tsh/.test(normalizedName)) {
      return 'µIU/mL';
    }
    
    if (/t3|t4/.test(normalizedName)) {
      return 'ng/dL';
    }
    
    // Hemoglobin
    if (/hemoglobin|hgb/.test(normalizedName)) {
      return 'g/dL';
    }
    
    // White blood cell counts
    if (/wbc|white/.test(normalizedName)) {
      return '10^3/µL';
    }
    
    // Red blood cell counts
    if (/rbc|red/.test(normalizedName)) {
      return '10^6/µL';
    }
    
    // Percentages
    if (/hematocrit|lymphocyte|neutrophil|monocyte|eosinophil|basophil|percentage/.test(normalizedName)) {
      return '%';
    }
    
    // Default
    return 'mg/dL';
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
