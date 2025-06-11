/**
 * Base provider interface for eligibility verification
 * Defines the contract that all provider-specific implementations must follow
 */

import { EligibilityResult } from "../../eligibility";

export interface EligibilityRequest {
  memberId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  payerId?: string;
  serviceType?: string;
  providerNpi?: string;
}

export interface ProviderConfig {
  apiKey?: string;
  apiEndpoint?: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  environment: 'production' | 'sandbox';
  timeout?: number;
  maxRetries?: number;
}

export abstract class BaseEligibilityProvider {
  protected config: ProviderConfig;
  protected name: string;

  constructor(name: string, config: ProviderConfig) {
    this.name = name;
    this.config = {
      ...config,
      timeout: config.timeout || 30000, // Default 30 second timeout
      maxRetries: config.maxRetries || 3, // Default 3 retries
    };
  }

  /**
   * Check eligibility with the provider
   * Each provider must implement this method with their specific API integration
   */
  abstract checkEligibility(request: EligibilityRequest): Promise<EligibilityResult>;

  /**
   * Get provider name
   */
  getProviderName(): string {
    return this.name;
  }

  /**
   * Retry mechanism for API calls
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    retries = this.config.maxRetries
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.floor(
        Math.random() * Math.min(1000 * (2 ** (this.config.maxRetries! - retries)), 10000)
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(operation, retries - 1);
    }
  }

  /**
   * Validate the configuration
   */
  protected validateConfig(): void {
    const requiredFields = this.getRequiredConfigFields();
    const missingFields = requiredFields.filter(field => !this.config[field as keyof ProviderConfig]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields for ${this.name}: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Get required configuration fields
   * Each provider should override this method to specify its required fields
   */
  protected abstract getRequiredConfigFields(): string[];
}
