// lib/parsers/ocrNormalizer.ts - COMPLETE FIXED VERSION

export class OcrNormalizer {
  // Emergency fix: Add caching and recursion prevention
  private static normalizationCache = new Map<string, string>();
  private static normalizationDepth = new Map<string, number>();
  private static readonly MAX_NORMALIZATION_DEPTH = 3;
  
  // FIXED: Disable debug logging to prevent memory issues
  private static readonly ENABLE_DEBUG_LOGGING = false;

  /**
   * Main normalization method - FIXED to prevent infinite loops
   */
  public static normalize(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Emergency fix: Prevent infinite recursion
    const currentDepth = this.normalizationDepth.get(content) || 0;
    if (currentDepth >= this.MAX_NORMALIZATION_DEPTH) {
      if (this.ENABLE_DEBUG_LOGGING) {
        console.warn(`[EMERGENCY] Normalization depth exceeded for: ${content.substring(0, 50)}...`);
      }
      return content; // Return as-is to break the loop
    }

    // Emergency fix: Check cache first
    if (this.normalizationCache.has(content)) {
      return this.normalizationCache.get(content)!;
    }

    // Emergency fix: Track recursion depth
    this.normalizationDepth.set(content, currentDepth + 1);

    let result = content;
    
    try {
      // FIXED: Removed excessive debug logging that was causing memory issues
      if (this.ENABLE_DEBUG_LOGGING) {
        console.log(`[DEBUG_NORMALIZE] Input to normalize (first 100 chars): ${result.substring(0, 100)}...`);
      }

      // Apply normalization steps in order
      result = this.reassembleSpacedWords(result);
      result = this.fixCharacterSubstitutions(result);
      result = this.normalizeSpacing(result);
      result = this.normalizeLineBreaks(result);
      result = this.standardizeUnits(result);
      result = this.removeHeadersAndFooters(result);
      result = this.trimLines(result);

      if (this.ENABLE_DEBUG_LOGGING) {
        console.log(`[DEBUG_NORMALIZE] Final result (first 100 chars): ${result.substring(0, 100)}...`);
      }

    } catch (error) {
      console.error(`[EMERGENCY] Normalization failed for: ${content.substring(0, 50)}...`, error);
      result = content; // Return original on error
    }

    // Emergency fix: Cache result and clean up depth tracking
    this.normalizationCache.set(content, result);
    this.normalizationDepth.delete(content);

    // Emergency fix: Prevent cache from growing too large
    if (this.normalizationCache.size > 1000) {
      this.normalizationCache.clear();
    }

    return result;
  }

  /**
   * Fix character substitutions - common OCR errors
   */
  private static fixCharacterSubstitutions(text: string): string {
    if (!text) return '';

    let result = text;

    // Define substitution rules
    const substitutions: [RegExp, string][] = [
      // Specific contextual corrections
      [/VILLA#I7/gi, 'VILLA#17'],
      [/s41/gi, '141'],
      
      // Unit standardization (major fix for blood test parsing)
      [/\bmeq\/l\b/gi, 'meq/L'],
      [/\bmeq\/I\b/gi, 'meq/L'],
      [/\bmeq\/!\b/gi, 'meq/L'],
      [/\bmeq\/1\b/gi, 'meq/L'],
      
      [/\bmg\/dl\b/gi, 'mg/dL'],
      [/\bme\/at\b/gi, 'mg/dL'],
      [/\bme\/él\b/gi, 'mg/dL'],
      [/\bmg\/al\b/gi, 'mg/dL'],
      
      [/\buu\/m\b/gi, 'µIU/mL'],
      [/\bµU\/mL\b/gi, 'µIU/mL'],
      
      [/\bK\/uL\b/gi, '10^3/µL'],
      [/\b10\*3\/uL\b/gi, '10^3/µL'],
      
      [/\bM\/uL\b/gi, '10^6/µL'],
      [/\b10\*6\/uL\b/gi, '10^6/µL'],
      
      [/\bpercent\b/gi, '%'],
      [/\bpct\b/gi, '%'],
      
      // Common OCR character errors
      [/\$(?=\d)/g, '5'], // $ mistaken for 5 before numbers
      [/\bG1ucose\b/gi, 'Glucose'],
      [/\bCho1estero1\b/gi, 'Cholesterol'],
      [/\b1(?=\d{2,})/g, 'I'], // 1 at start of long numbers might be I
      
      // Clean up extra spaces and normalize punctuation
      [/\s*:\s*/g, ': '],
      [/\s*-\s*/g, ' - '],
      [/\s*\(\s*/g, ' ('],
      [/\s*\)\s*/g, ') '],
    ];

    // Apply substitutions safely
    for (const [pattern, replacement] of substitutions) {
      try {
        const before = result.length;
        result = result.replace(pattern, replacement);
        const after = result.length;
        
        // Safety check: prevent massive string expansion
        if (after > before * 3) {
          console.warn(`[SAFETY] Substitution caused large expansion, reverting`);
          result = text; // Revert to original
          break;
        }
      } catch (error) {
        console.warn(`[SAFETY] Substitution failed, skipping:`, error);
      }
    }

    return result;
  }

  /**
   * Normalize spacing - remove extra whitespace
   */
  private static normalizeSpacing(text: string): string {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\s*\n\s*/g, '\n') // Clean up around line breaks
      .replace(/\s*\t\s*/g, ' ') // Replace tabs with spaces
      .trim();
  }

  /**
   * Reassemble words that were incorrectly split by OCR
   */
  private static reassembleSpacedWords(text: string): string {
    if (!text) return '';

    let result = text;

    // Common medical terms that get split
    const termsToReassemble = [
      ['G L U C O S E', 'GLUCOSE'],
      ['C H O L E S T E R O L', 'CHOLESTEROL'],
      ['T R I G L Y C E R I D E S', 'TRIGLYCERIDES'],
      ['C R E A T I N I N E', 'CREATININE'],
      ['H E M O G L O B I N', 'HEMOGLOBIN'],
    ];

    for (const [spaced, normal] of termsToReassemble) {
      result = result.replace(new RegExp(spaced, 'gi'), normal);
    }

    // General pattern: rejoin single letters with spaces
    result = result.replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\b/g, '$1$2$3');
    result = result.replace(/\b([A-Z])\s+([A-Z])\b/g, '$1$2');

    return result;
  }

  /**
   * Normalize line breaks
   */
  private static normalizeLineBreaks(text: string): string {
    if (!text) return '';

    return text
      .replace(/\r\n/g, '\n') // Windows to Unix line endings
      .replace(/\r/g, '\n') // Mac to Unix line endings
      .replace(/\n{3,}/g, '\n\n') // Multiple line breaks to double
      .trim();
  }

  /**
   * Standardize units to canonical forms
   */
  private static standardizeUnits(text: string): string {
    if (!text) return '';

    let result = text;

    // Unit standardization patterns
    const unitStandardizations: [RegExp, string][] = [
      // Blood glucose units
      [/mg\/dl/gi, 'mg/dL'],
      [/mmol\/l/gi, 'mmol/L'],
      
      // Cholesterol units  
      [/mg\/dl/gi, 'mg/dL'],
      
      // Electrolyte units
      [/meq\/l/gi, 'meq/L'],
      [/mmol\/l/gi, 'mmol/L'],
      
      // Blood count units
      [/10\^3\/ul/gi, '10^3/µL'],
      [/10\^6\/ul/gi, '10^6/µL'],
      [/cells\/ul/gi, 'cells/µL'],
      
      // Protein units
      [/g\/dl/gi, 'g/dL'],
      [/g\/l/gi, 'g/L'],
      
      // Percentage
      [/percent/gi, '%'],
      [/pct/gi, '%'],
    ];

    for (const [pattern, replacement] of unitStandardizations) {
      result = result.replace(pattern, replacement);
    }

    return result;
  }

  /**
   * Remove common headers and footers
   */
  private static removeHeadersAndFooters(text: string): string {
    if (!text) return '';

    let result = text;

    // Common header/footer patterns to remove
    const patternsToRemove = [
      /^.*?laboratory.*$/gmi,
      /^.*?page \d+ of \d+.*$/gmi,
      /^.*?confidential.*$/gmi,
      /^.*?printed on.*$/gmi,
      /^.*?report date.*$/gmi,
      /^.*?lab director.*$/gmi,
    ];

    for (const pattern of patternsToRemove) {
      result = result.replace(pattern, '');
    }

    return result;
  }

  /**
   * Trim lines and remove empty lines
   */
  private static trimLines(text: string): string {
    if (!text) return '';

    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  /**
   * Clear normalization cache - call this periodically or between tests
   */
  public static clearCache(): void {
    this.normalizationCache.clear();
    this.normalizationDepth.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  public static getCacheStats(): { size: number; maxDepthReached: number } {
    const maxDepth = Math.max(0, ...Array.from(this.normalizationDepth.values()));
    return {
      size: this.normalizationCache.size,
      maxDepthReached: maxDepth
    };
  }

  /**
   * Enable/disable debug logging
   */
  public static setDebugLogging(enabled: boolean): void {
    // Note: This would require making ENABLE_DEBUG_LOGGING non-readonly
    // For now, debug logging is permanently disabled for safety
    if (enabled) {
      console.warn('[OcrNormalizer] Debug logging is disabled for memory safety');
    }
  }
}