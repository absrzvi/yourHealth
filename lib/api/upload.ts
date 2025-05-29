import { validateImageDimensions, compressImage } from '../storage/upload-utils';

// Interface for OCR upload response
export interface OcrUploadResponse {
  success: boolean;
  reportId?: string;
  testCount?: number;
  confidence?: string | number;
  needsReview?: boolean;
  tests?: Array<{
    name: string;
    value: string | number;
    unit: string;
    flag: string | null;
  }>;
  error?: string;
}

/**
 * Uploads and processes a lab report image using OCR
 * Enhanced with image quality validation and compression
 */
export async function uploadReportImage(file: File): Promise<OcrUploadResponse> {
  try {
    // Validate image dimensions and quality
    const validationResult = await validateImageDimensions(file);
    
    if (validationResult.warnings.length > 0) {
      console.warn('Image validation warnings:', validationResult.warnings);
    }
    
    if (!validationResult.isValid) {
      return { 
        success: false, 
        error: validationResult.errors.join('. ') 
      };
    }
    
    // Compress image to optimize upload
    const optimizedFile = await compressImage(file);
    
    // Create form data with the optimized file
    const formData = new FormData();
    formData.append('file', optimizedFile);

    // Upload the file
    const response = await fetch('/api/ocr-upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.details || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OCR upload failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload file' 
    };
  }
}
