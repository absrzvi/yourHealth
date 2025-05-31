/**
 * OCR Configuration
 * Define configuration options for OCR providers
 */

/**
 * Get the active OCR provider from environment variables or default to Google Vision
 * This allows for easy switching between providers via environment variables
 */
export function getActiveOcrProvider(): 'google-vision' | 'tesseract' {
  // Always prioritize Google Vision unless explicitly configured otherwise
  const provider = process.env.OCR_PROVIDER?.toLowerCase();
  
  // Only use Tesseract if explicitly configured
  if (provider === 'tesseract') {
    console.log('Using Tesseract OCR provider as configured');
    return 'tesseract';
  }
  
  // Default to Google Vision
  console.log('Using Google Vision OCR provider (default)');
  return 'google-vision';
}

/**
 * Get OCR provider options from environment variables
 * This allows for configuring OCR providers via environment variables
 */
export function getOcrProviderOptions(): Record<string, any> {
  // Get options for Tesseract if that's the active provider
  if (getActiveOcrProvider() === 'tesseract') {
    return {
      lang: process.env.TESSERACT_LANG || 'eng',
      oem: parseInt(process.env.TESSERACT_OEM || '1', 10),
      psm: parseInt(process.env.TESSERACT_PSM || '6', 10)
    };
  }
  
  // Options for Google Vision if that's the active provider
  return {
    // Add any Google Vision specific options here
  };
}
