/**
 * Provider factory for eligibility verification
 * Manages the creation and configuration of provider-specific implementations
 */

import { BaseEligibilityProvider, ProviderConfig } from './base-provider';
import { ChangeHealthcareProvider } from './change-healthcare';
import { AvailityProvider } from './availity';
import logger from '../../../logger';

// Define provider types
export type ProviderType = 'change-healthcare' | 'availity' | 'mock';

// Provider configuration store
interface ProviderConfigurations {
  [key: string]: ProviderConfig;
}

export class EligibilityProviderFactory {
  private static instance: EligibilityProviderFactory;
  private providers: Map<string, BaseEligibilityProvider> = new Map();
  private configurations: ProviderConfigurations = {};

  private constructor() {
    // Initialize with default configurations
    this.configurations = {
      'change-healthcare': {
        environment: 'sandbox',
        apiKey: process.env.CHANGE_HEALTHCARE_API_KEY || '',
        clientId: process.env.CHANGE_HEALTHCARE_CLIENT_ID || '',
        timeout: 30000,
        maxRetries: 3
      },
      'availity': {
        environment: 'sandbox',
        clientId: process.env.AVAILITY_CLIENT_ID || '',
        clientSecret: process.env.AVAILITY_CLIENT_SECRET || '',
        timeout: 30000,
        maxRetries: 3
      }
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EligibilityProviderFactory {
    if (!EligibilityProviderFactory.instance) {
      EligibilityProviderFactory.instance = new EligibilityProviderFactory();
    }
    return EligibilityProviderFactory.instance;
  }

  /**
   * Get provider by type
   * @param type Provider type
   * @returns Provider instance
   */
  public getProvider(type: ProviderType): BaseEligibilityProvider {
    // Check if provider already exists
    if (this.providers.has(type)) {
      return this.providers.get(type)!;
    }

    // Create new provider instance
    let provider: BaseEligibilityProvider;
    
    try {
      switch (type) {
        case 'change-healthcare':
          provider = new ChangeHealthcareProvider(this.configurations[type]);
          break;
        case 'availity':
          provider = new AvailityProvider(this.configurations[type]);
          break;
        case 'mock':
          // For testing purposes, we'll use Change Healthcare with sandbox environment
          provider = new ChangeHealthcareProvider({
            ...this.configurations['change-healthcare'],
            environment: 'sandbox'
          });
          break;
        default:
          throw new Error(`Unknown provider type: ${type}`);
      }
      
      // Store provider instance
      this.providers.set(type, provider);
      return provider;
    } catch (error) {
      logger.error(`Failed to create provider ${type}: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to create provider ${type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Configure provider
   * @param type Provider type
   * @param config Provider configuration
   */
  public configureProvider(type: ProviderType, config: Partial<ProviderConfig>): void {
    // Update configuration
    this.configurations[type] = {
      ...this.configurations[type],
      ...config
    };
    
    // Remove existing provider instance to force recreation with new config
    if (this.providers.has(type)) {
      this.providers.delete(type);
    }
  }

  /**
   * Get all available provider types
   */
  public getAvailableProviders(): ProviderType[] {
    return Object.keys(this.configurations) as ProviderType[];
  }
}
