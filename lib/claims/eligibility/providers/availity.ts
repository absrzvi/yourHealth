/**
 * Availity eligibility verification provider
 * Implements the BaseEligibilityProvider for Availity API
 */

import { BaseEligibilityProvider, EligibilityRequest, ProviderConfig } from './base-provider';
import { EligibilityResult } from '../../eligibility';
import axios from 'axios';
import { logger } from '../../../logger';

export class AvailityProvider extends BaseEligibilityProvider {
  private authToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: ProviderConfig) {
    super('Availity', config);
    this.validateConfig();
  }

  /**
   * Check eligibility with Availity
   * @param request Eligibility request parameters
   * @returns Eligibility result
   */
  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResult> {
    logger.debug(`Checking eligibility with Availity for member ${request.memberId}`);
    
    try {
      return await this.withRetry(async () => {
        // Ensure we have a valid auth token
        await this.ensureAuthToken();
        
        // Prepare request payload for Availity API
        const payload = this.formatRequest(request);
        
        // Make API call
        const response = await axios({
          method: 'post',
          url: this.getApiEndpoint(),
          headers: await this.getHeaders(),
          data: payload,
          timeout: this.config.timeout
        });
        
        // Parse and return response
        return this.parseResponse(response.data);
      });
    } catch (error) {
      logger.error(`Availity eligibility check failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Eligibility check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure we have a valid authentication token
   */
  private async ensureAuthToken(): Promise<void> {
    // Check if token is still valid
    if (this.authToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }

    try {
      const response = await axios({
        method: 'post',
        url: this.getAuthEndpoint(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
          'client_id': this.config.clientId || '',
          'client_secret': this.config.clientSecret || '',
          'grant_type': 'client_credentials'
        }),
        timeout: this.config.timeout
      });

      this.authToken = response.data.access_token;
      
      // Set token expiry (usually 1 hour)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      
      logger.debug(`Obtained new Availity auth token, expires at ${this.tokenExpiry.toISOString()}`);
    } catch (error) {
      logger.error(`Failed to obtain Availity auth token: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format the request for Availity API
   */
  private formatRequest(request: EligibilityRequest): Record<string, unknown> {
    // Format according to Availity API specifications
    return {
      controlNumber: this.generateControlNumber(),
      provider: {
        npi: request.providerNpi || '1234567890', // Default NPI if not provided
        organizationName: 'For Your Health Labs',
        taxId: '123456789' // Organization tax ID
      },
      subscriber: {
        memberId: request.memberId,
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth ? this.formatDate(request.dateOfBirth) : undefined
      },
      payerId: request.payerId,
      serviceTypeCode: request.serviceType || '30', // 30 = Laboratory
      serviceDate: this.formatDate(new Date())
    };
  }

  /**
   * Parse the response from Availity API
   */
  private parseResponse(responseData: Record<string, unknown>): EligibilityResult {
    try {
      // Check for errors in response
      if (responseData.errors && responseData.errors.length > 0) {
        const errorMessage = responseData.errors.map((e: any) => e.message).join(', ');
        throw new Error(`Availity returned error: ${errorMessage}`);
      }
      
      // Extract eligibility information
      const eligibilityInfo = responseData.eligibilityResponse || {};
      
      // Extract status
      const status = this.extractStatus(eligibilityInfo);
      
      // Extract benefits
      const benefits = this.extractBenefits(eligibilityInfo);
      
      // Extract coverage details
      const coverageDetails = this.extractCoverageDetails(eligibilityInfo);
      
      return {
        status,
        ...benefits,
        coverageDetails
      };
    } catch (error) {
      logger.error(`Failed to parse Availity response: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to parse eligibility response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract eligibility status from response
   */
  private extractStatus(eligibilityInfo: Record<string, unknown>): "active" | "inactive" | "pending" {
    // Check if we have coverage information
    if (!eligibilityInfo || !eligibilityInfo.activeCoverage) {
      return "inactive";
    }
    
    // Check coverage status
    const coverageStatus = eligibilityInfo.activeCoverage.toLowerCase();
    
    if (coverageStatus === 'active' || coverageStatus === 'true' || coverageStatus === '1') {
      return "active";
    } else if (coverageStatus === 'pending' || coverageStatus === 'in process') {
      return "pending";
    } else {
      return "inactive";
    }
  }

  /**
   * Extract benefit information from response
   */
  private extractBenefits(eligibilityInfo: Record<string, unknown>): Partial<EligibilityResult> {
    const benefits: Partial<EligibilityResult> = {};
    
    if (!eligibilityInfo || !eligibilityInfo.benefits) {
      return benefits;
    }
    
    // Process benefits
    const benefitsData = eligibilityInfo.benefits;
    
    // Extract deductible information
    if (benefitsData.deductible) {
      benefits.deductible = parseFloat(benefitsData.deductible.amount || '0');
      benefits.deductibleMet = parseFloat(benefitsData.deductible.amountMet || '0');
    }
    
    // Extract out-of-pocket information
    if (benefitsData.outOfPocket) {
      benefits.outOfPocketMax = parseFloat(benefitsData.outOfPocket.amount || '0');
      benefits.outOfPocketMet = parseFloat(benefitsData.outOfPocket.amountMet || '0');
    }
    
    // Extract copay information
    if (benefitsData.copay) {
      benefits.copay = parseFloat(benefitsData.copay.amount || '0');
    }
    
    // Extract coinsurance information
    if (benefitsData.coinsurance) {
      benefits.coinsurance = parseFloat(benefitsData.coinsurance.percentage || '0') / 100;
    }
    
    return benefits;
  }

  /**
   * Extract coverage details from response
   */
  private extractCoverageDetails(eligibilityInfo: Record<string, unknown>): EligibilityResult["coverageDetails"] {
    const coverageDetails: EligibilityResult["coverageDetails"] = {
      labServices: false,
      geneticTesting: false,
      preventiveCare: false
    };
    
    if (!eligibilityInfo || !eligibilityInfo.serviceCoverage) {
      return coverageDetails;
    }
    
    const serviceCoverage = eligibilityInfo.serviceCoverage;
    
    // Check for lab services coverage
    coverageDetails.labServices = this.isServiceCovered(serviceCoverage, '30');
    
    // Check for genetic testing coverage
    coverageDetails.geneticTesting = this.isServiceCovered(serviceCoverage, 'GT');
    
    // Check for preventive care coverage
    coverageDetails.preventiveCare = this.isServiceCovered(serviceCoverage, '98');
    
    return coverageDetails;
  }

  /**
   * Check if a specific service type is covered
   */
  private isServiceCovered(serviceCoverage: Array<Record<string, unknown>>, serviceTypeCode: string): boolean {
    if (!serviceCoverage) return false;
    
    // Check if service type exists and is covered
    return serviceCoverage.some((service: any) => 
      service.serviceTypeCode === serviceTypeCode && 
      (service.covered === true || service.covered === 'true' || service.covered === '1')
    );
  }

  /**
   * Get API endpoint based on environment
   */
  private getApiEndpoint(): string {
    return this.config.environment === 'production'
      ? this.config.apiEndpoint || 'https://api.availity.com/v1/eligibility'
      : 'https://test.api.availity.com/v1/eligibility';
  }

  /**
   * Get authentication endpoint based on environment
   */
  private getAuthEndpoint(): string {
    return this.config.environment === 'production'
      ? 'https://api.availity.com/v1/oauth2/token'
      : 'https://test.api.availity.com/v1/oauth2/token';
  }

  /**
   * Get headers for API request
   */
  private async getHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      'X-Availity-Customer-ID': this.config.clientId || '',
      'User-Agent': 'ForYourHealth/1.0'
    };
  }

  /**
   * Generate a unique control number for the request
   */
  private generateControlNumber(): string {
    return `FYH${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  /**
   * Format date to YYYY-MM-DD format
   */
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  /**
   * Get required configuration fields
   */
  protected getRequiredConfigFields(): string[] {
    return ['clientId', 'clientSecret', 'environment'];
  }
}
