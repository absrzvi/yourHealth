import { ExtractedBiomarker, ValidationRule } from './types';
import { BIOMARKER_DICTIONARY } from './biomarkerDictionary';

/**
 * Validates and enhances biomarker data with confidence scores and status
 */
export class BiomarkerValidator {
  // Validation rules with different severity levels
  private static readonly VALIDATION_RULES: ValidationRule[] = [
    {
      name: 'value_in_range',
      description: 'Value is within the expected range for this biomarker',
      validate: (biomarker) => {
        const definition = BIOMARKER_DICTIONARY[biomarker.standardName.toLowerCase()];
        if (!definition) return true; // Skip validation if no definition found
        
        const { value } = biomarker;
        const { validRange } = definition;
        return value >= validRange.min && value <= validRange.max;
      },
      errorMessage: 'Value is outside expected range',
      severity: 'error',
    },
    {
      name: 'critical_value',
      description: 'Value is in critical range',
      validate: (biomarker) => {
        const definition = BIOMARKER_DICTIONARY[biomarker.standardName.toLowerCase()];
        if (!definition || (definition.criticalLow === undefined && definition.criticalHigh === undefined)) {
          return true; // No critical range defined
        }
        
        const { value } = biomarker;
        const { criticalLow, criticalHigh } = definition;
        
        return !(
          (criticalLow !== undefined && value <= criticalLow) ||
          (criticalHigh !== undefined && value >= criticalHigh)
        );
      },
      errorMessage: 'Critical value detected',
      severity: 'error',
    },
    {
      name: 'unit_validation',
      description: 'Unit is valid for this biomarker',
      validate: (biomarker) => {
        if (!biomarker.unit) return true; // Skip if no unit provided
        
        const definition = BIOMARKER_DICTIONARY[biomarker.standardName.toLowerCase()];
        if (!definition) return true; // Skip validation if no definition found
        
        return definition.unit.some(u => 
          u.toLowerCase() === biomarker.unit?.toLowerCase()
        );
      },
      errorMessage: 'Invalid unit for this biomarker',
      severity: 'warning',
    },
    {
      name: 'reference_range_format',
      description: 'Reference range has valid format',
      validate: (biomarker) => {
        if (!biomarker.referenceRange) return true; // Skip if no reference range
        
        // Check common reference range formats:
        // - 12.0-15.0
        // - 12.0 - 15.0
        // - 12.0 to 15.0
        // - <15.0
        // - >12.0
        const rangePattern = /^(?:<|>)?\s*\d+(?:\.\d+)?\s*(?:-|to|–|—)\s*\d+(?:\.\d+)?$|^(?:<|>)\s*\d+(?:\.\d+)?$/i;
        return rangePattern.test(biomarker.referenceRange);
      },
      errorMessage: 'Invalid reference range format',
      severity: 'warning',
    },
  ];

  /**
   * Validate a single biomarker against all rules
   */
  static validateBiomarker(biomarker: ExtractedBiomarker): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    status?: 'low' | 'normal' | 'high' | 'critical';
    confidence: number;
  } {
    const definition = BIOMARKER_DICTIONARY[biomarker.standardName.toLowerCase()];
    const result = {
      isValid: true,
      warnings: [] as string[],
      errors: [] as string[],
      status: biomarker.status as 'low' | 'normal' | 'high' | 'critical' | undefined,
      confidence: biomarker.confidence || 0.8, // Start with base confidence
    };

    // If no definition found, return with warning
    if (!definition) {
      result.warnings.push(`No definition found for biomarker: ${biomarker.standardName}`);
      result.confidence = 0.1; // Drastically reduce confidence if no definition found
      return result;
    }

    // Apply all validation rules
    for (const rule of this.VALIDATION_RULES) {
      try {
        if (!rule.validate(biomarker)) {
          if (rule.severity === 'error') {
            result.errors.push(rule.errorMessage);
            result.isValid = false;
            result.confidence *= 0.8; // Reduce confidence for errors
          } else {
            result.warnings.push(rule.errorMessage);
            result.confidence *= 0.9; // Slight reduction for warnings
          }
        }
      } catch (error) {
        console.error(`Error validating biomarker ${biomarker.standardName} with rule ${rule.name}:`, error);
        result.warnings.push(`Validation error: ${rule.name}`);
        result.confidence *= 0.9;
      }
    }

    // Determine status based on value and reference range if not already set
    if (!result.status && definition) {
      const { value } = biomarker;
      const { validRange, criticalLow, criticalHigh } = definition;

      // Check critical ranges first
      if (criticalLow !== undefined && value <= criticalLow) {
        result.status = 'critical';
      } else if (criticalHigh !== undefined && value >= criticalHigh) {
        result.status = 'critical';
      }
      // Then check normal ranges if not critical
      else if (value < validRange.min) {
        result.status = 'low';
      } else if (value > validRange.max) {
        result.status = 'high';
      } else {
        result.status = 'normal';
      }
    }

    // Ensure confidence is within bounds
    result.confidence = Math.max(0, Math.min(1, result.confidence));

    return result;
  }

  /**
   * Validate and filter a list of biomarkers
   */
  static validateAndFilter(
    biomarkers: ExtractedBiomarker[],
    options: { minConfidence: number } = { minConfidence: 0.5 }
  ): ExtractedBiomarker[] {
    console.log(`[BiomarkerValidator] Validating ${biomarkers.length} biomarkers with min confidence ${options.minConfidence}`);
    
    const validatedBiomarkers = biomarkers.map(biomarker => {
      console.log(`[BiomarkerValidator] Validating biomarker: ${biomarker.name}, standardName: ${biomarker.standardName || 'undefined'}`);
      const validation = this.validateBiomarker(biomarker);
      console.log(`[BiomarkerValidator] Validation result for ${biomarker.standardName || biomarker.name}: confidence=${validation.confidence}, isValid=${validation.isValid}, warnings=${validation.warnings.length}, errors=${validation.errors.length}`);
      if (validation.warnings.length > 0) {
        console.log(`[BiomarkerValidator] Warnings for ${biomarker.standardName || biomarker.name}: ${validation.warnings.join(', ')}`);
      }
      return {
        ...biomarker,
        status: validation.status || biomarker.status,
        confidence: validation.confidence,
        _validation: {
          isValid: validation.isValid,
          warnings: validation.warnings,
          errors: validation.errors,
        },
      };
    });
    
    // Log and filter biomarkers by confidence
    const filteredBiomarkers = validatedBiomarkers.filter(biomarker => {
      const passedFilter = biomarker.confidence >= options.minConfidence;
      if (!passedFilter) {
        console.log(`[BiomarkerValidator] FILTERED OUT: ${biomarker.standardName || biomarker.name} with confidence ${biomarker.confidence} < ${options.minConfidence}`);
      }
      return passedFilter;
    });
    
    console.log(`[BiomarkerValidator] Filtering complete: ${biomarkers.length} input, ${filteredBiomarkers.length} output`);
    
    // Sort by confidence (highest first)
    return filteredBiomarkers.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Group biomarkers by category
   */
  static groupByCategory(
    biomarkers: ExtractedBiomarker[]
  ): Map<string, ExtractedBiomarker[]> {
    const grouped = new Map<string, ExtractedBiomarker[]>();
    
    for (const biomarker of biomarkers) {
      const category = biomarker.category || 'uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(biomarker);
    }
    
    // Sort biomarkers within each category by confidence
    for (const [category, markers] of grouped.entries()) {
      grouped.set(
        category,
        [...markers].sort((a, b) => b.confidence - a.confidence)
      );
    }
    
    return grouped;
  }

  /**
   * Generate a validation report for a set of biomarkers
   */
  static generateValidationReport(
    biomarkers: ExtractedBiomarker[],
    remarks: any[] = []
  ): {
    totalBiomarkers: number;
    validBiomarkers: number;
    averageConfidence: number;
    categoryCounts: Record<string, number>;
    criticalFindings: ExtractedBiomarker[];
    lowConfidenceMarkers: ExtractedBiomarker[];
    remarkCount: number;
  } {
    const validated = this.validateAndFilter(biomarkers);
    const grouped = this.groupByCategory(validated);
    
    const categoryCounts: Record<string, number> = {};
    for (const [category, markers] of grouped.entries()) {
      categoryCounts[category] = markers.length;
    }
    
    const criticalFindings = validated.filter(
      b => b.status === 'critical' && b.confidence >= 0.7
    );
    
    const lowConfidenceMarkers = validated.filter(
      b => b.confidence < 0.7
    );
    
    const totalConfidence = validated.reduce((sum, b) => sum + (b.confidence || 0), 0);
    
    return {
      totalBiomarkers: validated.length,
      validBiomarkers: validated.filter(b => b._validation?.isValid !== false).length,
      averageConfidence: validated.length > 0 
        ? totalConfidence / validated.length 
        : 0,
      categoryCounts,
      criticalFindings,
      lowConfidenceMarkers,
      remarkCount: remarks.length,
    };
  }
}
