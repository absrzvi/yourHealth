/**
 * Change Healthcare eligibility verification provider
 * Implements the BaseEligibilityProvider for Change Healthcare API
 */

import { BaseEligibilityProvider, EligibilityRequest, ProviderConfig } from './base-provider';
import { EligibilityResult } from '../../eligibility';
import axios from 'axios';
import logger from '../../../logger';

export class ChangeHealthcareProvider extends BaseEligibilityProvider {
  constructor(config: ProviderConfig) {
    super('Change Healthcare', config);
    this.validateConfig();
  }

  /**
   * Check eligibility with Change Healthcare
   * @param request Eligibility request parameters
   * @returns Eligibility result
   */
  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResult> {
    logger.debug(`Checking eligibility with Change Healthcare for member ${request.memberId}`);
    
    try {
      return await this.withRetry(async () => {
        // Prepare request payload for Change Healthcare API
        const payload = this.formatRequest(request);
        
        // Make API call
        const response = await axios({
          method: 'post',
          url: this.getApiEndpoint(),
          headers: this.getHeaders(),
          data: payload,
          timeout: this.config.timeout
        });
        
        // Parse and return response
        return this.parseResponse(response.data);
      });
    } catch (error) {
      logger.error(`Change Healthcare eligibility check failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Eligibility check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format the request for Change Healthcare API
   */
  private formatRequest(request: EligibilityRequest): any {
    // Format according to Change Healthcare API specifications
    return {
      controlNumber: this.generateControlNumber(),
      tradingPartnerServiceId: this.config.clientId,
      provider: {
        npi: request.providerNpi || '1234567890', // Default NPI if not provided
        organizationName: 'For Your Health Labs'
      },
      subscriber: {
        memberId: request.memberId,
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth ? this.formatDate(request.dateOfBirth) : undefined
      },
      dependents: [],
      payerId: request.payerId,
      serviceTypes: [request.serviceType || '30'], // 30 = Laboratory
      includeSourceData: true
    };
  }

  /**
   * Parse the response from Change Healthcare API
   */
  private parseResponse(responseData: any): EligibilityResult {
    try {
      // Extract status
      const status = this.extractStatus(responseData);
      
      // Extract benefit information
      const benefits = this.extractBenefits(responseData);
      
      // Extract coverage details
      const coverageDetails = this.extractCoverageDetails(responseData);
      
      return {
        status,
        ...benefits,
        coverageDetails
      };
    } catch (error) {
      logger.error(`Failed to parse Change Healthcare response: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to parse eligibility response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract eligibility status from response
   */
  private extractStatus(responseData: any): "active" | "inactive" | "pending" {
    // Default to inactive if we can't determine status
    if (!responseData || !responseData.benefitsInformation) {
      return "inactive";
    }
    
    // Check for active coverage
    const activeCoverage = responseData.benefitsInformation.some(
      (benefit: any) => benefit.coverageStatus === "1" || benefit.coverageStatus === "Active"
    );
    
    return activeCoverage ? "active" : "inactive";
  }

  /**
   * Extract benefit information from response
   */
  private extractBenefits(responseData: any): Partial<EligibilityResult> {
    const benefits: Partial<EligibilityResult> = {};
    
    if (!responseData || !responseData.benefitsInformation) {
      return benefits;
    }
    
    // Process each benefit information
    for (const benefit of responseData.benefitsInformation) {
      // Extract deductible information
      if (benefit.serviceTypeCodes.includes("30") && benefit.benefitType === "Deductible") {
        benefits.deductible = parseFloat(benefit.benefitAmount || "0");
        benefits.deductibleMet = parseFloat(benefit.benefitUsed || "0");
      }
      
      // Extract out-of-pocket information
      if (benefit.serviceTypeCodes.includes("30") && benefit.benefitType === "Out of Pocket") {
        benefits.outOfPocketMax = parseFloat(benefit.benefitAmount || "0");
        benefits.outOfPocketMet = parseFloat(benefit.benefitUsed || "0");
      }
      
      // Extract copay information
      if (benefit.serviceTypeCodes.includes("30") && benefit.benefitType === "Co-Payment") {
        benefits.copay = parseFloat(benefit.benefitAmount || "0");
      }
      
      // Extract coinsurance information
      if (benefit.serviceTypeCodes.includes("30") && benefit.benefitType === "Co-Insurance") {
        benefits.coinsurance = parseFloat(benefit.benefitAmount || "0") / 100; // Convert percentage to decimal
      }
    }
    
    return benefits;
  }

  /**
   * Extract coverage details from response
   */
  private extractCoverageDetails(responseData: any): EligibilityResult["coverageDetails"] {
    const coverageDetails: EligibilityResult["coverageDetails"] = {
      labServices: false,
      geneticTesting: false,
      preventiveCare: false
    };
    
    if (!responseData || !responseData.benefitsInformation) {
      return coverageDetails;
    }
    
    // Check for lab services coverage
    coverageDetails.labServices = responseData.benefitsInformation.some(
      (benefit: any) => benefit.serviceTypeCodes.includes("30") && benefit.coverageLevel === "Active"
    );
    
    // Check for genetic testing coverage
    coverageDetails.geneticTesting = responseData.benefitsInformation.some(
      (benefit: any) => benefit.serviceTypeCodes.includes("GT") && benefit.coverageLevel === "Active"
    );
    
    // Check for preventive care coverage
    coverageDetails.preventiveCare = responseData.benefitsInformation.some(
      (benefit: any) => benefit.serviceTypeCodes.includes("98") && benefit.coverageLevel === "Active"
    );
    
    return coverageDetails;
  }

  /**
   * Get API endpoint based on environment
   */
  private getApiEndpoint(): string {
    return this.config.environment === 'production'
      ? this.config.apiEndpoint || 'https://apigw.changehealthcare.com/medicalnetwork/eligibility/v3'
      : 'https://sandbox.apigw.changehealthcare.com/medicalnetwork/eligibility/v3';
  }

  /**
   * Get headers for API request
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Client-Id': this.config.clientId || '',
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
   * Format date to YYYYMMDD format
   */
  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  /**
   * Get required configuration fields
   */
  protected getRequiredConfigFields(): string[] {
    return ['apiKey', 'clientId', 'environment'];
  }
}
