/**
 * Abstract interface for OCR providers
 * This allows us to easily switch between different OCR implementations
 */
export interface OcrProvider {
  /**
   * Extract text from an image file
   * @param filePath Path to the image file
   * @returns Extracted text as a string
   */
  extractTextFromImage(filePath: string): Promise<string>;
  
  /**
   * Check if the OCR provider is properly configured and ready to use
   */
  isReady(): boolean;
}

/**
 * Configuration options for OCR providers
 */
export interface OcrProviderConfig {
  /**
   * The type of OCR provider to use
   */
  provider: 'google-vision' | 'tesseract';
  
  /**
   * Optional additional configuration options
   */
  options?: Record<string, any>;
}

/**
 * Factory function to create an OCR provider instance
 * @param config Configuration options for the OCR provider
 * @returns An instance of the specified OCR provider
 */
export async function createOcrProvider(
  config: OcrProviderConfig
): Promise<OcrProvider> {
  switch (config.provider) {
    case 'google-vision': {
      try {
        const { getVisionClient } = await import('./googleVisionClient');
        return getVisionClient();
      } catch (error) {
        console.error('Failed to load Google Vision client:', error);
        throw new Error('Google Vision OCR provider unavailable. Please ensure @google-cloud/vision is installed.');
      }
    }
    case 'tesseract': {
      // Create a fallback implementation that will be used if Tesseract is not available
      const fallbackProvider: OcrProvider = {
        async extractTextFromImage(_filePath: string): Promise<string> {
          throw new Error('Tesseract OCR provider not available');
        },
        isReady(): boolean {
          return false;
        }
      };
      
      try {
        // Attempt to dynamically import the tesseractClient module
        // Note: This import may fail if the module doesn't exist yet,
        // which is expected during development
        const tesseractModule = await import('./tesseractClient')
          .catch(err => {
            console.warn('Tesseract client module not found:', err.message);
            return null;
          });
        
        if (tesseractModule && tesseractModule.getTesseractClient) {
          return tesseractModule.getTesseractClient(config.options);
        } else {
          console.warn('Using fallback Tesseract implementation');
          return fallbackProvider;
        }
      } catch (error) {
        console.error('Failed to initialize Tesseract client:', error);
        return fallbackProvider;
      }
    }
    default:
      throw new Error(`Unsupported OCR provider: ${(config as any).provider}`);
  }
}
