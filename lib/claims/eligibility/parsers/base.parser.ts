import { EligibilityResult } from "../types";
import { InsurancePlan } from "./default.parser";

/**
 * Base parser interface for eligibility responses
 */
export interface IEligibilityParser {
  /**
   * Parse the raw response from the payer
   * @param response Raw response from the payer
   * @param insurancePlan The insurance plan being checked
   * @returns Parsed eligibility result
   */
  parse(response: unknown, insurancePlan: InsurancePlan): Promise<EligibilityResult>;
  
  /**
   * Check if this parser can handle the given response format
   * @param response Raw response from the payer
   * @returns Whether this parser can handle the response
   */
  canParse(response: unknown): boolean;
}

/**
 * Base parser implementation with common functionality
 */
export abstract class BaseEligibilityParser implements IEligibilityParser {
  /**
   * Parse the raw response from the payer
   * @param response Raw response from the payer
   * @param insurancePlan The insurance plan being checked
   */
  abstract parse(response: unknown, insurancePlan: InsurancePlan): Promise<EligibilityResult>;
  
  /**
   * Check if this parser can handle the given response format
   * @param response Raw response from the payer
   */
  abstract canParse(response: unknown): boolean;
  
  /**
   * Create a basic error result
   * @param message Error message
   * @param code Error code
   * @param details Additional error details
   * @returns Error result
   */
  protected createErrorResult(
    message: string,
    code: string = 'PARSE_ERROR',
    details?: unknown,
    rawResponse: any = null,
    plan?: { type: string; name: string; id: string }
  ): EligibilityResult {
    return {
      isEligible: false,
      rawResponse: rawResponse || { error: { code, message, details } },
      plan: plan || { type: 'UNKNOWN', name: 'Unknown Plan', id: 'unknown' },
      error: {
        code,
        message,
        details
      }
    };
  }
  
  /**
   * Safely parse a date from various formats
   * @param date Date string or object to parse
   * @returns Parsed date or undefined if invalid
   */
  protected safeParseDate(date: unknown): Date | undefined {
    if (!date) return undefined;
    
    try {
      // Handle string dates
      if (typeof date === 'string') {
        // Try parsing ISO format first
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return parsed;
        
        // Try other common formats if needed
        // ...
      }
      
      // Handle date objects
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date;
      }
      
      return undefined;
    } catch (error) {
      console.warn('Failed to parse date:', error);
      return undefined;
    }
  }
}

export default BaseEligibilityParser;
