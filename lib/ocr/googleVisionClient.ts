import { ImageAnnotatorClient } from '@google-cloud/vision';
import { promises as fs } from 'fs';
import path from 'path';
import { getGoogleApiKey, isGoogleApiKeyConfigured } from './googleVisionClientKey';

/**
 * Google Cloud Vision API client for OCR processing
 * Requires authentication via Google Cloud credentials
 */
export class GoogleVisionClient {
  private client: ImageAnnotatorClient;
  private isAuthenticated: boolean = false;

  constructor() {
    try {
      // First try to use the API key if available
      if (isGoogleApiKeyConfigured()) {
        const apiKey = getGoogleApiKey();
        console.log('Initializing Google Vision API client with API key');
        
        // Validate the API key format - Google API keys typically start with 'AIza'
        if (!apiKey || !apiKey.startsWith('AIza')) {
          console.error('⚠️ WARNING: Google API key doesn\'t match expected format (should start with "AIza")');
          console.error('This may cause authentication to fail. Check your GOOGLE_AI_KEY value.');
        }
        
        if (apiKey && apiKey.length < 30) {
          console.error('⚠️ WARNING: Google API key appears to be too short. It may be truncated or invalid.');
          console.error('API keys are typically at least 30 characters long. Check your GOOGLE_AI_KEY value.');
        }
        
        // Add more detailed logging
        console.log('Google Vision API initialization details:');
        console.log('- Using API key authentication');
        console.log('- Node environment:', process.env.NODE_ENV);
        console.log('- API client version:', require('@google-cloud/vision/package.json').version);
        
        // Initialize with API key
        this.client = new ImageAnnotatorClient({ keyFilename: undefined, credentials: undefined, apiKey });
        this.isAuthenticated = true;
        console.log('Google Vision API client initialized successfully with API key');
      } else {
        // Fall back to service account credentials if API key not available
        console.log('API key not found, trying service account credentials');
        
        // Check for credentials file
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credentialsPath) {
          console.log(`Using credentials file from: ${credentialsPath}`);
          try {
            // Check if the file exists
            const fs = require('fs');
            if (fs.existsSync(credentialsPath)) {
              console.log('Credentials file exists');
            } else {
              console.warn(`Credentials file does not exist at path: ${credentialsPath}`);
            }
          } catch (fsError) {
            console.error('Error checking credentials file:', fsError);
          }
        } else {
          console.warn('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
        }
        
        // Try to initialize without explicit credentials (uses ADC)
        this.client = new ImageAnnotatorClient();
        this.isAuthenticated = true;
        console.log('Google Vision API client initialized successfully with service account');
      }
    } catch (error) {
      console.error('Failed to initialize Google Vision API client:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      this.isAuthenticated = false;
    }
  }

  /**
   * Extract text from an image file using Google Cloud Vision API
   * @param filePath Path to the image file
   * @returns Extracted text as a string
   */
  public async extractTextFromImage(filePath: string): Promise<string> {
    if (!this.isAuthenticated) {
      throw new Error('Google Vision API client not authenticated');
    }

    try {
      console.log(`Processing image with Google Vision API: ${filePath}`);
      
      // Read the file content
      const imageBuffer = await fs.readFile(filePath);
      
      // Perform text detection
      const [result] = await this.client.textDetection(imageBuffer);
      const detections = result.textAnnotations || [];
      
      if (detections.length === 0) {
        console.warn('No text detected in the image');
        return '';
      }
      
      // The first annotation contains the entire text
      const fullText = detections[0]?.description || '';
      console.log(`Extracted ${fullText.length} characters of text`);
      
      return fullText;
    } catch (error: any) {
      console.error('Error during Google Vision API text extraction:', error);
      throw new Error(`Google Vision API text extraction failed: ${error.message}`);
    }
  }

  /**
   * Check if the client is properly authenticated
   */
  public isReady(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get text annotation with layout/positioning information
   * This can be useful for more complex parsing where the
   * layout of the document matters
   * @param filePath Path to the image file
   */
  public async getDocumentTextWithLayout(filePath: string): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('Google Vision API client not authenticated');
    }

    try {
      // Read the file content
      const imageBuffer = await fs.readFile(filePath);
      
      // Perform document text detection (more detailed than basic text detection)
      const [result] = await this.client.documentTextDetection(imageBuffer);
      return result;
    } catch (error: any) {
      console.error('Error during Google Vision API document text detection:', error);
      throw new Error(`Google Vision API document text detection failed: ${error.message}`);
    }
  }
}

/**
 * Singleton instance of the GoogleVisionClient
 */
let visionClientInstance: GoogleVisionClient | null = null;

/**
 * Get the singleton instance of the GoogleVisionClient
 */
export function getVisionClient(): GoogleVisionClient {
  if (!visionClientInstance) {
    visionClientInstance = new GoogleVisionClient();
  }
  return visionClientInstance;
}
