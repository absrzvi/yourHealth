/**
 * Google Cloud Vision API key configuration
 * This file provides a way to use a simple API key instead of full service account credentials
 */

/**
 * Get the Google API key from environment variables
 */
export function getGoogleApiKey(): string | null {
  const apiKey = process.env.GOOGLE_AI_KEY || null;
  if (apiKey) {
    // Log a masked version of the key for debugging (only show first 4 chars)
    const maskedKey = apiKey.substring(0, 4) + '***' + (apiKey.length > 8 ? apiKey.substring(apiKey.length - 4) : '');
    console.log(`Google API key found: ${maskedKey} (length: ${apiKey.length})`); 
  } else {
    console.log('No Google API key found in environment variables');
  }
  return apiKey;
}

/**
 * Check if Google API key is configured
 */
export function isGoogleApiKeyConfigured(): boolean {
  const apiKey = getGoogleApiKey();
  const isConfigured = !!apiKey && apiKey.length > 0;
  console.log(`Google API key configured: ${isConfigured}`);
  return isConfigured;
}
