import { InsurancePlan } from "@prisma/client";
import { BaseEligibilityParser } from "./base.parser";
import { EligibilityResult } from "../types";

/**
 * Default parser for eligibility responses
 */
export class DefaultEligibilityParser extends BaseEligibilityParser {
  /**
   * Check if this parser can handle the response
   */
  canParse(response: unknown): boolean {
    // Default parser can handle any response
    return true;
  }

  /**
   * Parse the response from the payer
   */
  async parse(response: unknown, plan: InsurancePlan): Promise<EligibilityResult> {
    // Create a minimal plan object from the provided plan
    const minimalPlan = {
      type: plan.planType,
      name: plan.payerName,
      id: plan.payerId
    };

    try {
      // If response is already an EligibilityResult, ensure it has required fields
      if (this.isEligibilityResponse(response)) {
        return {
          ...response,
          rawResponse: response.rawResponse || response,
          plan: response.plan || minimalPlan
        };
      }

      // If response is a string, try to parse it as JSON
      let data: any;
      if (typeof response === 'string') {
        try {
          data = JSON.parse(response);
        } catch (e) {
          return this.createErrorResult(
            'Failed to parse response as JSON',
            'PARSE_ERROR',
            { response },
            response,
            minimalPlan
          );
        }
      } else {
        data = response;
      }

      // Map common fields from the response to our standard format
      const result: EligibilityResult = {
        isEligible: this.getBooleanValue(data, 'isEligible', data.status === 'active'),
        effectiveDate: this.parseDate(data.effectiveDate || data.coverageStartDate),
        termDate: this.parseDate(data.termDate || data.coverageEndDate),
        plan: data.plan || { ...minimalPlan },
        rawResponse: data,
        error: data.error ? {
          code: data.error.code || 'UNKNOWN_ERROR',
          message: data.error.message || 'Unknown error',
          details: data.error.details
        } : undefined
      };

      // Add coverage if it exists
      if (data.coverage) {
        result.coverage = {
          deductible: this.getNumberValue(data.coverage, 'deductible', 0) ?? 0,
          deductibleMet: this.getNumberValue(data.coverage, 'deductibleMet', 0) ?? 0,
          outOfPocketMax: this.getNumberValue(data.coverage, 'outOfPocketMax', 0) ?? 0,
          outOfPocketMet: this.getNumberValue(data.coverage, 'outOfPocketMet', 0) ?? 0
        };
        
        // Add optional fields if they exist
        const copay = this.getNumberValue(data.coverage, 'copay');
        if (copay !== undefined) {
          result.coverage.copay = copay;
        }
        
        const coinsurance = this.getNumberValue(data.coverage, 'coinsurance');
        if (coinsurance !== undefined) {
          result.coverage.coinsurance = coinsurance;
        }
      }

      return result;
    } catch (error) {
      return this.createErrorResult(
        'Failed to parse eligibility response',
        'PARSE_ERROR',
        error instanceof Error ? error.message : String(error),
        response,
        {
          type: plan.planType,
          name: plan.payerName,
          id: plan.payerId
        }
      );
    }
  }

  /**
   * Check if an object is an EligibilityResult
   */
  private isEligibilityResponse(obj: unknown): obj is EligibilityResult {
    return (
      typeof obj === 'object' && 
      obj !== null && 
      'isEligible' in obj
    );
  }

  /**
   * Safely get a boolean value from an object
   */
  private getBooleanValue(obj: any, key: string, defaultValue: boolean = false): boolean {
    if (obj && typeof obj[key] === 'boolean') {
      return obj[key];
    }
    return defaultValue;
  }

  /**
   * Safely get a number value from an object
   */
  private getNumberValue(obj: any, key: string, defaultValue?: number): number | undefined {
    if (obj && typeof obj[key] === 'number') {
      return obj[key];
    }
    return defaultValue;
  }

  /**
   * Parse a date from various formats
   */
  private parseDate(dateValue: unknown): Date | undefined {
    if (!dateValue) return undefined;
    
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? undefined : date;
    }
    
    return undefined;
  }
}

export default DefaultEligibilityParser;
