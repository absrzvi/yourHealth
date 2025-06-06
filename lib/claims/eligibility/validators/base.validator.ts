import { InsurancePlan } from "@prisma/client";
import { ValidationRule } from "../../types";

/**
 * Base validator interface for eligibility validation
 */
export interface IEligibilityValidator {
  /**
   * Validate an insurance plan
   * @param plan The insurance plan to validate
   * @returns True if the plan is valid, false otherwise
   */
  validate(plan: InsurancePlan): Promise<boolean>;
  
  /**
   * Get validation errors
   * @returns Array of validation error messages
   */
  getErrors(): string[];
  
  /**
   * Get validation rules
   */
  getRules(): ValidationRule[];
}

/**
 * Base validator implementation with common functionality
 */
export abstract class BaseEligibilityValidator implements IEligibilityValidator {
  protected errors: string[] = [];
  protected rules: ValidationRule[] = [];
  
  /**
   * Validate an insurance plan
   * @param plan The insurance plan to validate
   */
  abstract validate(plan: InsurancePlan): Promise<boolean>;
  
  /**
   * Get validation errors
   */
  getErrors(): string[] {
    return [...this.errors];
  }
  
  /**
   * Get validation rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }
  
  /**
   * Add a validation error
   * @param message Error message
   */
  protected addError(message: string): void {
    this.errors.push(message);
  }
  
  /**
   * Clear all validation errors
   */
  protected clearErrors(): void {
    this.errors = [];
  }
  
  /**
   * Add a validation rule
   * @param rule Validation rule to add
   */
  protected addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }
  
  /**
   * Validate a field against a pattern
   * @param value Field value
   * @param pattern Pattern to match
   * @param fieldName Field name for error messages
   * @returns True if the field matches the pattern
   */
  protected validatePattern(
    value: string | undefined | null,
    pattern: RegExp,
    fieldName: string
  ): boolean {
    if (!value) {
      this.addError(`${fieldName} is required`);
      return false;
    }
    
    if (!pattern.test(value)) {
      this.addError(`Invalid ${fieldName} format`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate a required field
   * @param value Field value
   * @param fieldName Field name for error messages
   * @returns True if the field has a value
   */
  protected validateRequired(
    value: unknown,
    fieldName: string
  ): boolean {
    if (!value) {
      this.addError(`${fieldName} is required`);
      return false;
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      this.addError(`${fieldName} cannot be empty`);
      return false;
    }
    
    return true;
  }
}

export default BaseEligibilityValidator;
