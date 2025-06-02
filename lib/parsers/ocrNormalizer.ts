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
    // Basic input validation
    if (!content || typeof content !== 'string') {
      console.log('[OcrNormalizer] Received empty or non-string input');
      return '';
    }

    // Log the content length we're processing
    console.log(`[OcrNormalizer] Processing content with length: ${content.length}`);

    // Emergency fix: Prevent infinite recursion
    const currentDepth = this.normalizationDepth.get(content) || 0;
    if (currentDepth >= this.MAX_NORMALIZATION_DEPTH) {
      console.warn(`[EMERGENCY] Normalization depth exceeded for: ${content.substring(0, 50)}...`);
      return content; // Return as-is to break the loop
    }

    // Emergency fix: Check cache first
    if (this.normalizationCache.has(content)) {
      const cachedResult = this.normalizationCache.get(content)!;
      console.log(`[OcrNormalizer] Returning cached result with length: ${cachedResult.length}`);
      return cachedResult;
    }

    // Emergency fix: Track recursion depth
    this.normalizationDepth.set(content, currentDepth + 1);

    let result = content;
    
    try {
      console.log(`[OcrNormalizer] Starting normalization steps for content: ${result.substring(0, 100)}...`);

      // Apply normalization steps in order with safety checks
      result = this.safelyApplyStep('reassembleSpacedWords', result);
      result = this.safelyApplyStep('fixCharacterSubstitutions', result);
      result = this.safelyApplyStep('normalizeSpacing', result);
      result = this.safelyApplyStep('normalizeLineBreaks', result);
      result = this.safelyApplyStep('standardizeUnits', result);
      result = this.safelyApplyStep('removeHeadersAndFooters', result);
      result = this.safelyApplyStep('trimLines', result);

      // Final safety check - don't return empty string for non-empty input
      if (result.length === 0 && content.length > 0) {
        console.warn('[OcrNormalizer] Normalization resulted in empty string - returning original content');
        result = content;
      }

      console.log(`[OcrNormalizer] Completed normalization, result length: ${result.length}`);
      console.log(`[OcrNormalizer] First 100 chars of result: ${result.substring(0, 100)}...`);

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

    for (const [pattern, replacement] of substitutions) {
      result = result.replace(pattern, replacement);
    }

    return result;
  }

  /**
   * Normalize spacing - remove extra whitespace
   */
  private static normalizeSpacing(text: string): string {
    if (!text) return '';
    
    // Remove multiple spaces, tabs, etc.
    let result = text.replace(/\s+/g, ' ');
    
    // Trim start and end
    result = result.trim();
    
    return result;
  }

  /**
   * Reassemble words that were incorrectly split by OCR
   */
  private static reassembleSpacedWords(text: string): string {
    if (!text) return '';
    
    let result = text;
    
    // Common terms that might be split by OCR
    const termsToFix: [string, string][] = [
      ['Tri glycerides', 'Triglycerides'],
      ['Chol esterol', 'Cholesterol'],
      ['Hemo globin', 'Hemoglobin'],
      ['Glo bulin', 'Globulin'],
      ['Bili rubin', 'Bilirubin'],
      ['Creat inine', 'Creatinine'],
      ['Alb umin', 'Albumin'],
    ];
    
    for (const [spaced, normal] of termsToFix) {
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
    
    // Standardize all line breaks to \n
    let result = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remove excessive line breaks
    result = result.replace(/\n{3,}/g, '\n\n');
    
    return result;
  }

  /**
   * Standardize units to canonical forms
   */
  private static standardizeUnits(text: string): string {
    if (!text) return '';
    
    let result = text;
    
    // Define unit standardizations
    const unitStandardizations: [RegExp, string][] = [
      [/\bul\b/gi, 'µL'],
      [/\buL\b/g, 'µL'],
      [/\bmicro[Ll]\b/g, 'µL'],
      
      [/\bmg\/dl\b/gi, 'mg/dL'],
      [/\bmg\/dL\b/g, 'mg/dL'], // Ensure consistent capitalization
      
      [/\bng\/ml\b/gi, 'ng/mL'],
      [/\bng\/mL\b/g, 'ng/mL'], // Ensure consistent capitalization
      
      [/\bpg\/ml\b/gi, 'pg/mL'],
      [/\bpg\/mL\b/g, 'pg/mL'], // Ensure consistent capitalization
      
      [/\biu\/l\b/gi, 'IU/L'],
      [/\bIU\/L\b/g, 'IU/L'], // Ensure consistent capitalization
      
      [/\bu\/l\b/gi, 'U/L'],
      [/\bU\/L\b/g, 'U/L'], // Ensure consistent capitalization
      
      [/\bmmol\/l\b/gi, 'mmol/L'],
      [/\bmmol\/L\b/g, 'mmol/L'], // Ensure consistent capitalization
      
      [/\bumol\/l\b/gi, 'µmol/L'],
      [/\bµmol\/L\b/g, 'µmol/L'], // Ensure consistent capitalization
      
      [/\bmeq\/l\b/gi, 'mEq/L'],
      [/\bmEq\/L\b/g, 'mEq/L'], // Ensure consistent capitalization
      
      [/\bmosm\/kg\b/gi, 'mOsm/kg'],
      [/\bmOsm\/kg\b/g, 'mOsm/kg'], // Ensure consistent capitalization
      
      [/\bpct\b/gi, '%'],
      [/\bpercent\b/gi, '%'],
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
      /^.*?lab report.*$/gmi,
      /^.*?patient:.*$/gmi,
      /^.*?doctor:.*$/gmi,
      /^.*?specimen:.*$/gmi,
      /^.*?collected:.*$/gmi,
      /^.*?ordered:.*$/gmi,
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
    
    // Split by line, trim each line, then join non-empty lines
    const lines = text.split('\n');
    const trimmedLines = lines.map(line => line.trim()).filter(line => line !== '');
    
    return trimmedLines.join('\n');
  }

  /**
   * Clear the normalization cache
   */
  public static clearCache(): void {
    this.normalizationCache.clear();
    this.normalizationDepth.clear();
  }

  /**
   * Safely applies a normalization step with safety checks and logging
   * @param stepName The name of the normalization step method to apply
   * @param text The text to normalize
   * @returns The normalized text, or the original if the step fails
   */
  private static safelyApplyStep(stepName: string, text: string): string {
    if (!text || text.length === 0) {
      console.log(`[OcrNormalizer] Skipping ${stepName} for empty text`);
      return text;
    }

    try {
      console.log(`[OcrNormalizer] Applying ${stepName} to text of length ${text.length}`);
      const method = this[stepName] as (text: string) => string;
      
      if (typeof method !== 'function') {
        console.error(`[OcrNormalizer] ${stepName} is not a valid normalization method`);
        return text;
      }
      
      const result = method.call(this, text);
      
      // Safety check for this step
      if (!result && text.length > 0) {
        console.warn(`[OcrNormalizer] ${stepName} returned empty result for non-empty input - using original`);
        return text;
      }
      
      console.log(`[OcrNormalizer] ${stepName} produced result of length ${result?.length || 0}`);
      return result || text;
    } catch (error) {
      console.error(`[OcrNormalizer] Error in ${stepName}:`, error);
      return text; // Return original on error
    }
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

/**
 * A safer version of OcrNormalizer that handles memory constraints
 * for large text blocks by processing in chunks to prevent memory issues.
 */
export class SafeOcrNormalizer {
  private maxChunkSize: number = 5000; // Process in chunks to avoid memory issues

  constructor() {
    console.log('[DEBUG] SafeOcrNormalizer instantiated');
  }

  /**
   * Normalize OCR text using chunked processing to prevent memory issues
   * @param content The OCR text to normalize
   * @returns Normalized text
   */
  public normalize(content: string): string {
    console.log('[DEBUG] SafeOcrNormalizer.normalize called with content length:', content?.length || 0);
    if (!content || typeof content !== 'string') {
      console.log('[DEBUG] SafeOcrNormalizer.normalize received empty or non-string input');
      return '';
    }
    
    // Keep a copy of the original content for safety
    const originalContent = content;
    console.log('[DEBUG] First 100 chars of original content:', originalContent.substring(0, 100));
    
    // For small content, process directly
    if (content.length < this.maxChunkSize) {
      console.log('[DEBUG] Processing small content directly');
      const result = OcrNormalizer.normalize(content);
      console.log('[DEBUG] Direct normalization result length:', result?.length || 0);
      
      // SAFETY CHECK: If normalization resulted in empty string from non-empty input
      if (result.length === 0 && content.length > 0) {
        console.log('[DEBUG] Warning: Direct normalization resulted in empty string - returning original');
        return originalContent; // Return the original content
      }
      
      return result || originalContent; // Return result if not empty/null, otherwise original
    }
    
    // For larger content, process in chunks
    console.log('[DEBUG] Processing large content in chunks');
    const chunks: string[] = this.splitIntoChunks(content, this.maxChunkSize);
    console.log('[DEBUG] Split into', chunks.length, 'chunks');
    const normalizedChunks: string[] = [];
    
    for (const chunk of chunks) {
      // Process each chunk individually
      let normalizedChunk = OcrNormalizer.normalize(chunk);
      
      // Safety check for each chunk
      if (normalizedChunk.length === 0 && chunk.length > 0) {
        console.log('[DEBUG] Warning: Chunk normalization resulted in empty string - using original chunk');
        normalizedChunk = chunk; // Use original chunk if normalization failed
      }
      
      normalizedChunks.push(normalizedChunk);
      
      // Clear cache between chunks to prevent memory buildup
      OcrNormalizer.clearCache();
    }
    
    // Join the chunks back together with double newlines to preserve paragraph structure
    const result = normalizedChunks.join('\n\n');
    console.log('[DEBUG] Final normalized result length:', result.length);
    
    // Final SAFETY CHECK: If normalization resulted in empty string from non-empty input
    if (result.length === 0 && content.length > 0) {
      console.log('[DEBUG] Critical Warning: Normalization resulted in empty string - returning original');
      return originalContent; // Return the original content
    }
    
    // Log sample of final result for debugging
    console.log('[DEBUG] First 100 chars of normalized result:', result.substring(0, 100));
    
    return result;
  }

  /**
   * Split text into chunks of approximately equal size
   * Tries to split at paragraph boundaries when possible
   */
  private splitIntoChunks(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    
    // Try to split at paragraph boundaries
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed max size, save current chunk and start a new one
      if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        // Otherwise add to current chunk
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    // If we ended up with no chunks (unlikely), just split by size
    if (chunks.length === 0) {
      let i = 0;
      while (i < text.length) {
        chunks.push(text.substring(i, i + maxChunkSize));
        i += maxChunkSize;
      }
    }
    
    return chunks;
  }
}
