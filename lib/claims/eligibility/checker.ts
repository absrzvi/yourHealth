import { InsurancePlan, PrismaClient } from "@prisma/client";
import { CacheFactory, ICache } from './cache';
import { IEligibilityParser } from './parsers/base.parser';
import { IEligibilityValidator } from './validators/base.validator';
import { CheckEligibilityOptions, EligibilityResult, PayerConfig } from './types';

// Default cache TTL in seconds (1 hour)
const DEFAULT_CACHE_TTL = 3600;

/**
 * Main eligibility checker service
 */
export class EligibilityChecker {
  private cache: ICache;
  private prisma: PrismaClient;
  private parsers: IEligibilityParser[] = [];
  private validators: Map<string, IEligibilityValidator> = new Map();
  private payerConfigs: Map<string, PayerConfig> = new Map();
  
  constructor(options: {
    prisma: PrismaClient;
    cacheType?: 'memory' | 'redis';
    cacheOptions?: {
      redisUrl?: string;
      ttl?: number;
    };
  }) {
    this.prisma = options.prisma;
    this.cache = CacheFactory.create(
      options.cacheType || 'memory',
      { redisUrl: options.cacheOptions?.redisUrl }
    );
  }
  
  /**
   * Register a parser for a specific response format
   * @param parser Parser to register
   */
  registerParser(parser: IEligibilityParser): void {
    this.parsers.push(parser);
  }
  
  /**
   * Register a validator for a specific payer
   * @param payerId Payer ID
   * @param validator Validator to register
   */
  registerValidator(payerId: string, validator: IEligibilityValidator): void {
    this.validators.set(payerId, validator);
  }
  
  /**
   * Configure a payer
   * @param config Payer configuration
   */
  configurePayer(config: PayerConfig): void {
    this.payerConfigs.set(config.id, config);
  }
  
  /**
   * Check eligibility for a member
   * @param memberId Member ID
   * @param options Check options
   * @returns Eligibility result
   */
  async checkEligibility(
    memberId: string,
    options: CheckEligibilityOptions = {}
  ): Promise<EligibilityResult> {
    try {
      // Get member's insurance plan
      const plan = await this.prisma.insurancePlan.findFirst({
        where: { 
          memberId,
          isActive: true 
        },
        orderBy: { isPrimary: 'desc' }
      });
      
      if (!plan) {
        return {
          isEligible: false,
          error: {
            code: 'NO_ACTIVE_PLAN',
            message: 'No active insurance plan found for member'
          }
        };
      }
      
      // Check cache first if not forcing refresh
      const cacheKey = this.getCacheKey(memberId, plan.id, options.serviceDate);
      const cachedResult = options.forceRefresh 
        ? null 
        : await this.cache.get<EligibilityResult>(cacheKey);
      
      if (cachedResult) {
        return cachedResult;
      }
      
      // Validate the plan
      const isValid = await this.validatePlan(plan);
      if (!isValid) {
        return {
          isEligible: false,
          error: {
            code: 'INVALID_PLAN',
            message: 'Insurance plan validation failed'
          }
        };
      }
      
      // Get payer configuration
      const payerConfig = this.payerConfigs.get(plan.payerId);
      
      let result: EligibilityResult;
      
      if (payerConfig?.supportsRealtime) {
        // Perform real-time eligibility check
        result = await this.checkRealtimeEligibility(plan, options);
      } else {
        // Fall back to basic eligibility check
        result = await this.checkBasicEligibility(plan, options);
      }
      
      // Cache the result
      await this.cache.set(
        cacheKey, 
        result, 
        options.cacheTtl || DEFAULT_CACHE_TTL
      );
      
      return result;
    } catch (error) {
      console.error('Eligibility check failed:', error);
      return {
        isEligible: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while checking eligibility',
          details: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Generate a cache key for eligibility results
   */
  private getCacheKey(
    memberId: string, 
    planId: string, 
    serviceDate?: Date
  ): string {
    const dateKey = serviceDate 
      ? serviceDate.toISOString().split('T')[0] 
      : 'default';
    return `eligibility:${memberId}:${planId}:${dateKey}`;
  }
  
  /**
   * Validate an insurance plan
   */
  private async validatePlan(plan: InsurancePlan): Promise<boolean> {
    const validator = this.validators.get(plan.payerId);
    if (!validator) {
      console.warn(`No validator found for payer: ${plan.payerId}`);
      return true; // Skip validation if no validator is registered
    }
    
    return validator.validate(plan);
  }
  
  /**
   * Perform a real-time eligibility check
   */
  private async checkRealtimeEligibility(
    plan: InsurancePlan,
    options: CheckEligibilityOptions
  ): Promise<EligibilityResult> {
    // This would be implemented based on the specific payer's API
    // For now, we'll simulate a successful check
    return {
      isEligible: true,
      effectiveDate: plan.effectiveDate,
      termDate: plan.termDate || null,
      coverage: {
        deductible: 1000,
        deductibleMet: 250,
        outOfPocketMax: 5000,
        outOfPocketMet: 1000,
        copay: 30,
        coinsurance: 20
      },
      plan: {
        type: plan.planType,
        name: plan.payerName,
        id: plan.payerId
      },
      rawResponse: {
        // Simulated raw response
        status: 'Active',
        message: 'Eligibility verified successfully'
      }
    };
  }
  
  /**
   * Perform a basic eligibility check
   */
  private async checkBasicEligibility(
    plan: InsurancePlan,
    options: CheckEligibilityOptions
  ): Promise<EligibilityResult> {
    const now = new Date();
    const serviceDate = options.serviceDate || now;
    
    // Check if plan is active for the service date
    const isActive = plan.effectiveDate <= serviceDate && 
                    (!plan.termDate || plan.termDate >= serviceDate);
    
    if (!isActive) {
      return {
        isEligible: false,
        error: {
          code: 'INACTIVE_PLAN',
          message: 'Insurance plan is not active for the service date'
        }
      };
    }
    
    // Return basic eligibility info
    return {
      isEligible: true,
      effectiveDate: plan.effectiveDate,
      termDate: plan.termDate || null,
      plan: {
        type: plan.planType,
        name: plan.payerName,
        id: plan.payerId
      },
      // Default coverage values - these would be overridden by real data
      coverage: {
        deductible: 1500,
        deductibleMet: 0,
        outOfPocketMax: 7000,
        outOfPocketMet: 0,
        copay: 40,
        coinsurance: 20
      }
    };
  }
  
  /**
   * Clear the eligibility cache for a member
   * @param memberId Member ID
   */
  async clearCache(memberId: string): Promise<boolean> {
    try {
      // Get all cache keys for this member
      // Note: This assumes the cache implementation supports pattern matching
      // For Redis, we would use SCAN with a pattern
      // For memory cache, we would need to track keys
      // For simplicity, we'll just clear the entire cache in this implementation
      await this.cache.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }
}

export default EligibilityChecker;
