import { InsurancePlan } from "@prisma/client";
import { BaseEligibilityValidator } from "./base.validator";

/**
 * Default validator for insurance plans
 */
export class DefaultEligibilityValidator extends BaseEligibilityValidator {
  constructor() {
    super();
    this.initializeRules();
  }

  /**
   * Initialize validation rules
   */
  private initializeRules(): void {
    // Required fields
    this.addRule({
      id: 'REQUIRED_FIELDS',
      description: 'Required fields must be present',
      validate: async (plan: InsurancePlan) => {
        let isValid = true;
        
        if (!plan.payerId) {
          this.addError('Payer ID is required');
          isValid = false;
        }
        
        if (!plan.payerName) {
          this.addError('Payer name is required');
          isValid = false;
        }
        
        if (!plan.memberId) {
          this.addError('Member ID is required');
          isValid = false;
        }
        
        if (!plan.effectiveDate) {
          this.addError('Effective date is required');
          isValid = false;
        }
        
        return isValid;
      }
    });

    // Date validation
    this.addRule({
      id: 'DATES_VALID',
      description: 'Effective date must be before term date if provided',
      validate: async (plan: InsurancePlan) => {
        if (!plan.effectiveDate) return true; // Handled by REQUIRED_FIELDS
        
        const effectiveDate = new Date(plan.effectiveDate);
        
        if (plan.termDate) {
          const termDate = new Date(plan.termDate);
          
          if (effectiveDate >= termDate) {
            this.addError('Effective date must be before term date');
            return false;
          }
        }
        
        return true;
      }
    });

    // Member ID format
    this.addRule({
      id: 'MEMBER_ID_FORMAT',
      description: 'Member ID must be in a valid format',
      validate: async (plan: InsurancePlan) => {
        if (!plan.memberId) return true; // Handled by REQUIRED_FIELDS
        
        // Basic format check - alphanumeric with optional hyphens/underscores
        const memberIdRegex = /^[a-zA-Z0-9-_]+$/;
        if (!memberIdRegex.test(plan.memberId)) {
          this.addError('Member ID contains invalid characters');
          return false;
        }
        
        return true;
      }
    });

    // Plan type validation
    this.addRule({
      id: 'PLAN_TYPE_VALID',
      description: 'Plan type must be one of the allowed values',
      validate: async (plan: InsurancePlan) => {
        if (!plan.planType) return true; // Optional field
        
        const allowedTypes = ['PPO', 'HMO', 'EPO', 'POS', 'HDHP', 'INDEMNITY'];
        
        if (!allowedTypes.includes(plan.planType)) {
          this.addError(`Plan type must be one of: ${allowedTypes.join(', ')}`);
          return false;
        }
        
        return true;
      }
    });
  }

  /**
   * Validate an insurance plan
   * @param plan Insurance plan to validate
   * @returns True if the plan is valid
   */
  async validate(plan: InsurancePlan): Promise<boolean> {
    this.clearErrors();
    
    // Run all validation rules
    for (const rule of this.getRules()) {
      try {
        const isValid = await rule.validate(plan);
        if (!isValid) {
          // Continue validating other rules to collect all errors
          continue;
        }
      } catch (error) {
        console.error(`Error running validation rule ${rule.id}:`, error);
        this.addError(`Error validating ${rule.description}`);
      }
    }
    
    return this.getErrors().length === 0;
  }
}

export default DefaultEligibilityValidator;
