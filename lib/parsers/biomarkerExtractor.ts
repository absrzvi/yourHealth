import { ExtractedBiomarker } from './types';
import { BIOMARKER_DICTIONARY, findBiomarkerDefinition, normalizeBiomarkerName, validateBiomarkerValue } from './biomarkerDictionary';
import { TextPreprocessor } from './textPreprocessor';

const CRITICAL_EXPANSION_INCREASE_THRESHOLD = 100000; // 100KB
const CRITICAL_EXPANSION_TOTAL_THRESHOLD = 5000000; // 5MB

// Helper function for logging and checking string length - disabled
function logAndCheckLength(value: string | undefined | null, label: string, context: string, operationName: string = ""): void {
    // Debug logging disabled
    return;
}

// Helper function for logging and checking string expansion - disabled
function logAndCheckExpansion(originalValue: string | undefined | null, newValue: string | undefined | null, label: string, context: string, operationName: string = ""): void {
    // Debug logging disabled
    return;
}

/**
 * Extracts biomarkers from blood test report content
 */
export class BiomarkerExtractor {
  // Patterns for extracting biomarker values
  private static readonly VALUE_PATTERNS = {
    // Pattern 1: Biomarker name followed by value and unit
    STANDARD: /^(.+?)\s+(\d+\.?\d*)\s*(mg\/dL|g\/dL|U\/L|%|ng\/mL|µg\/dL|µIU\/mL|mEq\/L|mmol\/L|\/cmm|million\/cmm|pg\/mL|µmol\/L)/i,
    
    // Pattern 2: Biomarker name: value unit
    COLON_SEPARATED: /^(.+?):\s*(\d+\.?\d*)\s*(mg\/dL|g\/dL|U\/L|%)?/i,
    
    // Pattern 3: Value unit (biomarker name on previous line)
    VALUE_ONLY: /^(\d+\.?\d*)\s*(mg\/dL|g\/dL|U\/L|%|ng\/mL|µg\/dL|µIU\/mL|mEq\/L|mmol\/L|\/cmm|million\/cmm|pg\/mL|µmol\/L)/i,
    
    // Pattern 4: Reference range format: value (range)
    WITH_REFERENCE: /^(.+?)\s+(\d+\.?\d*)\s*\(?([\d\.\-\s]+(?:\s*[-–—]\s*[\d\.\-]+)?)\s*[\w\/]*\)?/i,
    
    // Pattern 5: Lab report format with aligned columns (name with spaces followed by value and unit, then reference ranges)
    LAB_REPORT: /^([A-Za-z0-9\s\-\/\(\)]+?)\s{2,}(\d+\.?\d*)\s*(%|ng\/ml|U\/l|mg\/dl|g\/dl|mEq\/L|mmol\/L)\s+/i,
    
    // Pattern 6: Specific pattern for Creatinine in various lab formats
    CREATININE: /Creatinine\s*(?:\(Serum\))?\s*(\d+\.?\d*)\s*(mg\/dL|g\/dL)/i,
    
    // Pattern 7: More general pattern for biomarkers with value and unit, allowing more flexible spacing
    GENERAL: /([A-Za-z]+(?:\s*\([^\)]+\))?)\s+(\d+\.?\d*)\s*(mg\/dL|g\/dL|U\/L|%|ng\/mL|µg\/dL|µIU\/mL|mEq\/L|mmol\/L)/i,
  };

  // Common units and their variations
  private static readonly UNIT_VARIANTS: Record<string, string> = {
    'g/dl': 'g/dL',
    'gm/dl': 'g/dL',
    'mg/dl': 'mg/dL',
    'ng/ml': 'ng/mL',
    'ug/dl': 'µg/dL',
    'mcg/dl': 'µg/dL',
    'miu/ml': 'µIU/mL',
    'meq/l': 'mEq/L',
    'mmol/l': 'mmol/L',
    'x10e3/ul': 'x10^3/µL',
    'x10e9/l': 'x10^9/L',
    'cells/ul': 'cells/µL',
    'cells/mm3': 'cells/µL',
    'meq': 'mEq/L',
    // Add variations specific to lab report
    'u/l': 'U/L',
    'u/dl': 'U/dL',
    '%': '%',
  };

  /**
   * Normalize units to standard format
   */
  private static normalizeUnit(unit: string): string {
    if (!unit) return '';
    
    // Convert to lowercase and trim
    let normalized = unit.toLowerCase().trim();
    
    // Replace common variations
    normalized = BiomarkerExtractor.UNIT_VARIANTS[normalized] || normalized;
    
    return normalized;
  }

  /**
   * Validate and enhance extracted biomarkers
   */
  static validateAndEnhanceBiomarkers(
    biomarkers: ExtractedBiomarker[]
  ): ExtractedBiomarker[] {
    const processedBiomarkers: ExtractedBiomarker[] = [];
    console.log(`[BiomarkerExtractor] Validating ${biomarkers?.length || 0} biomarkers`);
    
    for (let biomarker of biomarkers) {
      if (!biomarker || !biomarker.name) continue;
      
      const originalName = biomarker.name.trim();
      const normalizedInputName = normalizeBiomarkerName(originalName);
      const definition = findBiomarkerDefinition(originalName);
      
      console.log(`[BiomarkerExtractor] Processing biomarker: ${originalName}, Definition found: ${!!definition}`);
      
      // Create enhanced biomarker, assign confidence based on dictionary presence
      let enhancedBiomarker: ExtractedBiomarker = {
        ...biomarker,
        standardName: definition ? definition.standardName : normalizedInputName,
        category: definition ? definition.category : 'uncategorized',
        unit: biomarker.unit || (definition && definition.unit.length > 0 ? definition.unit[0] : ''),
        referenceRange: biomarker.referenceRange || (definition ? `${definition.validRange.min}-${definition.validRange.max}` : ''),
        confidence: definition
          ? (biomarker.confidence ? Math.max(biomarker.confidence, 0.85) : 0.85)
          : (biomarker.confidence ? Math.min(biomarker.confidence, 0.6) : 0.6),
        remarkIds: biomarker.remarkIds ? [...biomarker.remarkIds] : [],
        status: biomarker.status
      };
      
      // Add a remark ID if no definition was found
      if (!definition) {
        enhancedBiomarker.remarkIds.push('no_dictionary_definition');
        console.log(`[BiomarkerExtractor] No definition found for ${originalName}, keeping with confidence ${enhancedBiomarker.confidence}`);
      }
      // Special case handling for Creatinine
      else if (enhancedBiomarker.standardName === 'Creatinine' && 
               definition.unit.some(u => u.toLowerCase() === 'mg/dl') && 
               (enhancedBiomarker.unit?.toLowerCase() === 'mg/dl' || enhancedBiomarker.unit === '' || !enhancedBiomarker.unit) && 
               enhancedBiomarker.value % 1 === 0 && 
               enhancedBiomarker.value > definition.validRange.max * 2 && 
               enhancedBiomarker.value < definition.validRange.max * 20) {
        
        const inferredValue = enhancedBiomarker.value / 10;
        // Check if inferred value is now plausible
        if (inferredValue >= definition.validRange.min * 0.8 && inferredValue <= definition.validRange.max * 1.2) {
          enhancedBiomarker.value = inferredValue;
          enhancedBiomarker.remarkIds.push('decimal_inferred_creatinine');
          enhancedBiomarker.confidence = Math.min(1.0, enhancedBiomarker.confidence + 0.1); // Slightly boost confidence after correction
        }
      }

      // Validate value against reference ranges (if we have a definition)
      if (definition) {
        const validationResult = validateBiomarkerValue({
          name: enhancedBiomarker.standardName,
          value: enhancedBiomarker.value,
          unit: enhancedBiomarker.unit
        });
        if (validationResult.status) {
          enhancedBiomarker.status = validationResult.status;
        }
      }

      processedBiomarkers.push(enhancedBiomarker);
      console.log(`[BiomarkerExtractor] Added biomarker: ${originalName} with confidence ${enhancedBiomarker.confidence}`);
    }

    // TSH Deduplication Logic
    const tshStandardName = 'Thyroid Stimulating Hormone';
    const allTshEntries = processedBiomarkers.filter(b => b.standardName === tshStandardName);
    
    if (allTshEntries.length > 1) {
      // Prefer entries not suspected to be date components
      let candidates = allTshEntries.filter(tsh => !tsh.remarkIds?.includes('date_component_suspected'));
      
      // If all TSH entries were date-suspected, consider all of them again
      if (candidates.length === 0) {
        candidates = allTshEntries;
      }

      // Select the one with the highest confidence from the candidates
      let bestTsh = candidates.reduce((prev, current) => 
        (prev.confidence > current.confidence) ? prev : current
      );
      
      // Reconstruct processedBiomarkers: include all non-TSH and only the best TSH
      const finalProcessedBiomarkers = processedBiomarkers.filter(b => b.standardName !== tshStandardName);
      finalProcessedBiomarkers.push(bestTsh);
      
      return finalProcessedBiomarkers;
    }

    return processedBiomarkers;
  }

  /**
   * Clean and focus on biomarker sections of text
   */
  private static cleanTextForExtraction(text: string): string {
    if (!text) return '';
    
    // Try to isolate the biochemistry section if it exists
    const biochemMatch = text.match(/BIOCHEMISTRY.*$/i);
    if (biochemMatch) {
      console.log('[BiomarkerExtractor] Found BIOCHEMISTRY section, focusing extraction');
      return biochemMatch[0];
    }
    
    // Try to find the section after any patient data
    const afterPatientDataMatch = text.match(/(?:AGE|SEX|GENDER|DOB|CONTACT).*?\n\n(.+)$/i);
    if (afterPatientDataMatch && afterPatientDataMatch[1]) {
      console.log('[BiomarkerExtractor] Found section after patient data, focusing extraction');
      return afterPatientDataMatch[1];
    }
    
    // Look for sections with common biomarker-related titles
    const sectionMatch = text.match(/(?:TEST RESULTS|RESULTS|LABORATORY REPORT|LAB RESULTS).*$/i);
    if (sectionMatch) {
      console.log('[BiomarkerExtractor] Found results section, focusing extraction');
      return sectionMatch[0];
    }
    
    return text;
  }
  
  /**
   * Extract biomarkers from text content
   */
  static extractBiomarkers(content: string): ExtractedBiomarker[] {
    // If no content, return empty array
    if (!content || content.length === 0) {
      return [];
    }
    
    try {
      // First, clean and focus on relevant sections
      const focusedText = this.cleanTextForExtraction(content);
      console.log(`[BiomarkerExtractor] Focused text length: ${focusedText.length}`);
      
      // Clean OCR text for extraction
      const cleanedText = TextPreprocessor.preprocess(focusedText);
      console.log(`[BiomarkerExtractor] Cleaned OCR Text (Before Regex - First 500 chars):\n${cleanedText.substring(0, 500)}...`);
      
      // Extract biomarkers using multiple patterns
      const biomarkers: ExtractedBiomarker[] = [];
      const lines = cleanedText.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip empty lines
        if (!line || line.trim().length === 0) continue;
        
        // Skip header-like lines
        if (line.match(/^(Name|Date|Test|Report|Lab|Range|Value|Result|ID|Patient|Address|Phone|Contact):/i)) {
          continue;
        }
        
        // Try to extract using various patterns
        const biomarker = this.extractUsingPatterns(line, cleanedText);
        
        if (biomarker) {
          if (!biomarker.name && i > 0) {
            // If biomarker has no name, try using previous line as name
            biomarker.name = lines[i - 1].trim();
          }
          
          // Combine with next line if it looks like reference range (simple check)
          if (i < lines.length - 1 && !biomarker.referenceRange) {
            const nextLine = lines[i + 1];
            const nextLineHasNoValue = !nextLine.match(/\d+\.?\d*\s*(mg\/dL|g\/dL|U\/L|%)/i);
            
            if (nextLineHasNoValue && nextLine.match(/[\d\.\-\s]+/)) {
              biomarker.referenceRange = nextLine.trim();
            }
          }
          
          // Skip likely report headers
          if (biomarker.name.match(/\b(name|test|report|date|lab|range|value|result)\b/i)) {
            continue;
          }
          
          console.log(`[BiomarkerExtractor] Added biomarker: ${biomarker.name} with confidence ${biomarker.confidence}`);
          // Default to 'normal' status for initial extraction - will be refined during validation
          biomarkers.push({ ...biomarker, rawLineText: line, status: 'normal' });
        }
      }
      
      // Validate biomarkers
      const validatedBiomarkers = this.validateAndEnhanceBiomarkers(biomarkers);
      console.log(`[BiomarkerExtractor] Validated ${validatedBiomarkers.length} biomarkers out of ${biomarkers.length} extracted`);
      
      return validatedBiomarkers;
    } catch (error) {
      console.error('[BiomarkerExtractor] Error extracting biomarkers:', error);
      return [];
    }
  }

  /**
   * Try to extract biomarker using different patterns
   */
  private static extractUsingPatterns(line: string, rawLineTextForCreate: string): Omit<ExtractedBiomarker, 'rawLineText' | 'status'> | null {
    logAndCheckLength(line, 'Input line', 'extractUsingPatterns', 'Start');
    logAndCheckLength(rawLineTextForCreate, 'Input rawLineTextForCreate', 'extractUsingPatterns', 'Start');
  
    // Diagnostic logging to help debug
    console.log(`[BiomarkerExtractor] Testing line pattern match: "${line.substring(0, 80)}..."`);
  
    // Try specialized Creatinine pattern first (highest priority)
    let match = line.match(BiomarkerExtractor.VALUE_PATTERNS.CREATININE);
    if (match) {
      console.log(`[BiomarkerExtractor] Found Creatinine match: ${match[1]} ${match[2]}`);
      return BiomarkerExtractor.createBiomarker('Creatinine', match[1], match[2], rawLineTextForCreate);
    }
  
    // Try standard pattern
    match = line.match(BiomarkerExtractor.VALUE_PATTERNS.STANDARD);
    if (match) {
      return BiomarkerExtractor.createBiomarker(match[1], match[2], match[3], rawLineTextForCreate);
    }
  
    // Try colon-separated pattern
    match = line.match(BiomarkerExtractor.VALUE_PATTERNS.COLON_SEPARATED);
    if (match) {
      return BiomarkerExtractor.createBiomarker(match[1], match[2], match[3], rawLineTextForCreate);
    }
  
    // Try reference range pattern
    match = line.match(BiomarkerExtractor.VALUE_PATTERNS.WITH_REFERENCE);
    if (match) {
      const [_, name, value, referenceRange] = match;
      const biomarker = BiomarkerExtractor.createBiomarker(name, value, undefined, rawLineTextForCreate);
      if (biomarker) {
        biomarker.referenceRange = referenceRange.trim();
        return biomarker;
      }
    }
  
    // Try lab report format (aligned columns)
    match = line.match(BiomarkerExtractor.VALUE_PATTERNS.LAB_REPORT);
    if (match) {
      return BiomarkerExtractor.createBiomarker(match[1], match[2], match[3], rawLineTextForCreate);
    }
  
    // Try general flexible pattern 
    match = line.match(BiomarkerExtractor.VALUE_PATTERNS.GENERAL);
    if (match && match[1] && match[1].trim().length > 0) {
      console.log(`[BiomarkerExtractor] Found general match: ${match[1]} ${match[2]} ${match[3]}`);
      return BiomarkerExtractor.createBiomarker(match[1], match[2], match[3], rawLineTextForCreate);
    }
  
    // Try value only pattern (lowest priority)
    match = line.match(BiomarkerExtractor.VALUE_PATTERNS.VALUE_ONLY);
    if (match) {
      return BiomarkerExtractor.createBiomarker('', match[1], match[2], rawLineTextForCreate);
    }
  
    return null;
  }

  /**
   * Create a biomarker object from extracted components
   */
  private static createBiomarker(
    name: string,
    valueStr: string,
    unit: string | undefined,
    rawLineText: string
  ): Omit<ExtractedBiomarker, 'rawLineText' | 'status'> | null {
    logAndCheckLength(name, 'Input name', 'createBiomarker', 'Start');
    logAndCheckLength(valueStr, 'Input valueStr', 'createBiomarker', 'Start');
    logAndCheckLength(unit, 'Input unit', 'createBiomarker', 'Start');
    logAndCheckLength(rawLineText, 'Input rawLineText', 'createBiomarker', 'Start');
    // Normalize unit if provided
    const normalizedUnit = unit ? BiomarkerExtractor.normalizeUnit(unit.trim()) : '';
    
    // Find matching biomarker definition
    const trimmedName = name.trim();
    const definition = findBiomarkerDefinition(trimmedName);

    let currentConfidence = 0.5; // Base confidence

    if (definition) {
      const normalizedTrimmedName = normalizeBiomarkerName(trimmedName);
      if (normalizeBiomarkerName(definition.standardName) === normalizedTrimmedName) {
        currentConfidence = 0.95; // Standard name match
        if (trimmedName.toLowerCase() === definition.standardName.toLowerCase()) {
            currentConfidence = 1.0; // Exact standard name match (case insensitive)
        }
      } else {
        const matchedAlias = definition.aliases.find(
          (alias) => normalizeBiomarkerName(alias) === normalizedTrimmedName
        );
        if (matchedAlias) {
          if (matchedAlias.length > 6) currentConfidence = 0.9;
          else if (matchedAlias.length > 3) currentConfidence = 0.8;
          else currentConfidence = 0.7; // Shorter alias match
        }
      }
    } else {
      // If no definition, it's likely a header or non-biomarker text, so lower confidence or return null
      // For now, we'll keep it but with very low confidence if name is not empty
      currentConfidence = trimmedName ? 0.1 : 0; 
      if (!trimmedName) return null; // If name is empty, definitely not a biomarker here
    }

    const parsedValue = parseFloat(valueStr);
    if (isNaN(parsedValue)) {
      return null; // Invalid value
    }

    const remarkIds: string[] = []; // Initialize remarkIds

    // Date component check: Reduce confidence if value looks like part of a date
    // Regex for DD-Mon-YYYY, Mon-DD-YYYY, YYYY-Mon-DD, or DD/MM/YYYY etc. or common date keywords
    const datePattern = new RegExp(
      `(\b(${valueStr})-[A-Za-z]{3}-\d{2,4}\b|` + // 15-Apr-2025
      `\b[A-Za-z]{3}-(${valueStr})-\d{2,4}\b|` + // Apr-15-2025
      `\b\d{2,4}-(${valueStr})-[A-Za-z]{3}\b|` + // 2025-15-Apr (less common for day)
      `\b\d{2,4}-[A-Za-z]{3}-(${valueStr})\b|` + // 2025-Apr-15
      `\b(${valueStr})/\d{1,2}/\d{2,4}\b|` +    // 15/04/2025
      `\b\d{1,2}/(${valueStr})/\d{2,4}\b|` +    // 04/15/2025
      `(Sample|Date|Collected|Received|DOB)[:\s]*.*\b${valueStr}\b)`,
      'i'
    );
    if (datePattern.test(rawLineText)) {
      // If value is small (like a day/month) and part of a date string, significantly reduce confidence
      if (parsedValue <= 31) { // Common for day or month
         // Check if the biomarker name itself is not a date-related term
         const isBiomarkerDateRelated = /date|year|month|day/i.test(trimmedName);
         if (!isBiomarkerDateRelated) {
            currentConfidence = Math.min(currentConfidence, 0.2); 
            remarkIds.push('date_component_suspected'); // Add remark
         }  
      }
    }

    // If after all checks, confidence is too low, consider it not a valid biomarker extraction here
    if (currentConfidence < 0.3 && !definition) { // Stricter if no definition found
      // We'll still keep it but with low confidence so it can be filtered later if needed
      // Lower confidence but don't discard completely
    }
    
    return {
      name: trimmedName,
      standardName: definition ? definition.standardName : normalizeBiomarkerName(trimmedName),
      value: parsedValue,
      rawValueString: valueStr,
      unit: normalizedUnit, // Ensure unit is always a string, even if empty
      category: definition ? definition.category : 'Unknown',
      confidence: parseFloat(currentConfidence.toFixed(2)),
      remarkIds: remarkIds // Include remarkIds in the return
    };
  }

  /**
   * Group biomarkers by category
   */
  static groupByCategory(
    biomarkers: ExtractedBiomarker[]
  ): Map<string, ExtractedBiomarker[]> {
    const grouped = new Map<string, ExtractedBiomarker[]>();
    
    for (const biomarker of biomarkers) {
      const category = biomarker.category || 'other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(biomarker);
    }
    
    // Sort biomarkers within each category by name
    // Using Array.from to avoid TypeScript downlevelIteration issues
    Array.from(grouped.keys()).forEach(category => {
      const markers = grouped.get(category)!;
      markers.sort((a, b) => a.standardName.localeCompare(b.standardName));
    });
    
    return grouped;
  }
}
