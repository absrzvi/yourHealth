import { InsurancePlan } from "@prisma/client";

/**
 * Represents the result of an eligibility check
 */
export interface EligibilityResult {
  /** Whether the member is eligible for coverage */
  isEligible: boolean;
  
  /** Effective date of coverage */
  effectiveDate?: Date;
  
  /** Termination date of coverage */
  termDate?: Date;
  
  /** Coverage details */
  coverage?: {
    /** Deductible amount */
    deductible: number;
    
    /** Amount of deductible met */
    deductibleMet: number;
    
    /** Out of pocket maximum */
    outOfPocketMax: number;
    
    /** Amount of out of pocket met */
    outOfPocketMet: number;
    
    /** Copay amount */
    copay?: number;
    
    /** Coinsurance percentage (0-100) */
    coinsurance?: number;
  };
  
  /** Plan details */
  plan?: {
    /** Plan type (e.g., PPO, HMO) */
    type: string;
    
    /** Plan name */
    name: string;
    
    /** Plan ID */
    id: string;
  };
  
  /** Any additional data returned by the payer */
  rawResponse?: unknown;
  
  /** Error details if the check failed */
  error?: {
    /** Error code */
    code: string;
    
    /** Error message */
    message: string;
    
    /** Additional error details */
    details?: unknown;
  };
}

/**
 * Options for checking eligibility
 */
export interface CheckEligibilityOptions {
  /** Whether to force a fresh check (bypass cache) */
  forceRefresh?: boolean;
  
  /** Service date to check eligibility for (defaults to current date) */
  serviceDate?: Date;
  
  /** Service type code (e.g., 'LAB', 'OFFICE_VISIT') */
  serviceType?: string;
  
  /** Service procedure code */
  serviceCode?: string;
  
  /** Provider NPI number */
  providerNpi?: string;
  
  /** Cache TTL in seconds */
  cacheTtl?: number;
  
  /** Additional context for the eligibility check */
  context?: Record<string, unknown>;
}

/**
 * Payer-specific configuration
 */
export interface PayerConfig {
  /** Payer ID */
  id: string;
  
  /** Payer name */
  name: string;
  
  /** Whether real-time eligibility is supported */
  supportsRealtime: boolean;
  
  /** Default response time in milliseconds */
  defaultResponseTime: number;
  
  /** Validation rules */
  validationRules?: ValidationRule[];
}

/**
 * Validation rule for eligibility checking
 */
export interface ValidationRule {
  /** Rule ID */
  id: string;
  
  /** Rule description */
  description: string;
  
  /** Function to validate the rule */
  validate: (plan: InsurancePlan) => Promise<{
    /** Whether the rule passed validation */
    isValid: boolean;
    
    /** Error message if validation failed */
    message?: string;
    
    /** Additional error details */
    details?: unknown;
  }>;
}

/**
 * Cache options for eligibility checks
 */
export interface CacheOptions {
  /** Whether to use cache (default: true) */
  enabled?: boolean;
  
  /** Cache TTL in seconds (default: 1 hour) */
  ttl?: number;
  
  /** Cache key prefix (default: 'eligibility:') */
  keyPrefix?: string;
}
