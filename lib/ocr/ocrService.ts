import { createOcrProvider, OcrProviderConfig } from './ocrProvider';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * OCR Service - Provides a high-level interface for OCR operations
 * Handles provider creation, file validation, and error handling
 */
export class OcrService {
  private providerConfig: OcrProviderConfig;
  
  /**
   * Create a new OCR service
   * @param config The OCR provider configuration
   */
  constructor(config: OcrProviderConfig = { provider: 'google-vision' }) {
    this.providerConfig = config;
  }
  
  /**
   * Extract text from an image file
   * @param filePath Path to the image file
   * @returns Extracted text as a string
   */
  public async extractTextFromImage(filePath: string): Promise<string> {
    // Validate the file exists
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Validate file type (based on extension)
    const extension = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.gif', '.bmp'].includes(extension)) {
      throw new Error(`Unsupported image format: ${extension}`);
    }
    
    try {
      // Create the OCR provider
      const ocrProvider = await createOcrProvider(this.providerConfig);
      
      // Check if the provider is ready
      if (!ocrProvider.isReady()) {
        throw new Error(`OCR provider ${this.providerConfig.provider} is not ready`);
      }
      
      // Extract text
      return await ocrProvider.extractTextFromImage(filePath);
    } catch (error: any) {
      console.error('Error in OCR service:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }
  
  /**
   * Extract text from a PDF file
   * @param filePath Path to the PDF file
   * @returns Extracted text as a string
   */
  public async extractTextFromPdf(filePath: string): Promise<string> {
    // Validate the file exists
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Validate file type
    const extension = path.extname(filePath).toLowerCase();
    if (extension !== '.pdf') {
      throw new Error(`File is not a PDF: ${extension}`);
    }
    
    // For now, we'll just return a placeholder message
    // In a real implementation, we would use a PDF extraction library
    // For Google Vision, we could convert PDF pages to images and then process them
    console.log('PDF processing not fully implemented yet');
    return 'PDF OCR processing is not fully implemented in this version. Please upload an image file.';
  }
  
  /**
   * Switch the OCR provider
   * @param newConfig The new OCR provider configuration
   */
  public updateProviderConfig(newConfig: OcrProviderConfig): void {
    this.providerConfig = newConfig;
  }
  
  /**
   * Get the current OCR provider configuration
   */
  public getProviderConfig(): OcrProviderConfig {
    return { ...this.providerConfig };
  }
}

/**
 * Singleton instance of the OcrService
 */
let ocrServiceInstance: OcrService | null = null;

/**
 * Get the singleton instance of the OcrService
 * @param config Optional OCR provider configuration
 */
export function getOcrService(config?: OcrProviderConfig): OcrService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OcrService(config);
  } else if (config) {
    ocrServiceInstance.updateProviderConfig(config);
  }
  return ocrServiceInstance;
}
