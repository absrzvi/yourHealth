import tesseract from 'node-tesseract-ocr';
import { existsSync } from 'fs';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { OcrProvider } from './ocrProvider';

// Create promisified version of exec
const exec = promisify(execCallback);

/**
 * Tesseract OCR client implementation
 */
export class TesseractClient implements OcrProvider {
  private binaryPath: string;
  private config: Record<string, any>;
  private isAuthenticated: boolean = false;

  constructor(options?: Record<string, any>) {
    this.binaryPath = process.platform === 'win32' ? findTesseractPath() : 'tesseract';
    this.config = {
      lang: 'eng',
      oem: 1,
      psm: 6,
      binary: this.binaryPath,
      ...(options || {})
    };
    
    // Check if Tesseract is available
    this.isAuthenticated = this.binaryPath !== '';
    
    if (this.isAuthenticated) {
      console.log(`Tesseract OCR client initialized with binary: ${this.binaryPath}`);
    } else {
      console.error('Failed to initialize Tesseract OCR client: binary not found');
    }
  }

  /**
   * Extract text from an image file using Tesseract OCR
   * @param filePath Path to the image file
   * @returns Extracted text as a string
   */
  public async extractTextFromImage(filePath: string): Promise<string> {
    if (!this.isAuthenticated) {
      throw new Error('Tesseract OCR client not properly initialized');
    }

    try {
      console.log(`Processing image with Tesseract OCR: ${filePath}`);
      
      // Check if the binary path contains spaces and needs special handling
      if (this.binaryPath.includes(' ') || filePath.includes(' ')) {
        console.log('Using custom execution for paths with spaces');
        
        // Extract config values for command construction
        const { lang, oem, psm } = this.config;
        
        // Use promisified exec to handle the paths with proper quotes
        const cmd = `"${this.binaryPath}" "${filePath}" stdout -l ${lang} --oem ${oem} --psm ${psm}`;
        console.log(`Executing: ${cmd}`);
        
        try {
          const { stdout } = await exec(cmd);
          console.log('Custom OCR execution complete');
          return stdout;
        } catch (execError: any) {
          console.error('Error during custom OCR execution:', execError);
          throw new Error(`Custom OCR execution failed: ${execError.message}`);
        }
      } else {
        // Regular OCR execution for non-Windows or paths without spaces
        const text = await tesseract.recognize(filePath, this.config);
        console.log('OCR processing complete');
        return text;
      }
    } catch (error: any) {
      console.error('Error during Tesseract OCR text extraction:', error);
      throw new Error(`Tesseract OCR text extraction failed: ${error.message}`);
    }
  }

  /**
   * Check if the client is properly initialized
   */
  public isReady(): boolean {
    return this.isAuthenticated;
  }
}

/**
 * Find Tesseract executable path on Windows systems
 * Checks common installation directories
 * @returns Path to Tesseract executable or empty string if not found
 */
function findTesseractPath(): string {
  // Common installation paths on Windows
  const commonPaths = [
    'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
    'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe',
    'C:\\Tesseract-OCR\\tesseract.exe',
    'C:\\Users\\AbbasRizvi\\AppData\\Local\\Programs\\Tesseract-OCR\\tesseract.exe',
    'C:\\Users\\AbbasRizvi\\Tesseract-OCR\\tesseract.exe',
    'C:\\Tesseract\\tesseract.exe',
  ];
  
  // Find the first path that exists
  for (const binPath of commonPaths) {
    if (existsSync(binPath)) {
      console.log(`Found Tesseract at: ${binPath}`);
      return binPath;
    }
  }
  
  console.log('Tesseract not found in common locations, using default command');
  console.log('Please ensure Tesseract OCR is installed and in your PATH environment variable');
  console.log('You can download Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki');
  
  return 'tesseract'; // Default command if not found
}

/**
 * Singleton instance of the TesseractClient
 */
let tesseractClientInstance: TesseractClient | null = null;

/**
 * Get the singleton instance of the TesseractClient
 */
export function getTesseractClient(options?: Record<string, any>): TesseractClient {
  if (!tesseractClientInstance) {
    tesseractClientInstance = new TesseractClient(options);
  }
  return tesseractClientInstance;
}
