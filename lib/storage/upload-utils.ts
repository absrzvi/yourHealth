import { storageConfig } from './config';

export class UploadError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'UploadError';
  }
}

// Define a simplified file type for server-side validation that matches Multer's file structure
interface ServerFile {
  size: number;
  mimetype: string;
  originalname: string;
  path?: string;
  buffer?: Buffer;
}

export function validateFile(file: ServerFile): void {
  // Check file size
  if (file.size > storageConfig.maxFileSize) {
    throw new UploadError(413, `File too large. Max size: ${storageConfig.maxFileSize / (1024 * 1024)}MB`);
  }

  // Check MIME type
  if (!storageConfig.allowedMimeTypes.includes(file.mimetype)) {
    throw new UploadError(400, `Unsupported file type: ${file.mimetype}. Supported types: ${storageConfig.allowedMimeTypes.join(', ')}`);
  }
}

// Client-side validation for image dimensions and quality
export async function validateImageDimensions(file: File): Promise<{ 
  isValid: boolean; 
  warnings: string[]; 
  errors: string[];
}> {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    console.warn('Image validation skipped: not in browser environment');
    return { isValid: true, warnings: [], errors: [] };
  }
  
  // Skip validation for PDFs
  if (file.type === 'application/pdf') {
    return { isValid: true, warnings: [], errors: [] };
  }
  
  if (!file.type.startsWith('image/')) {
    errors.push('File is not an image');
    return { isValid: false, warnings, errors };
  }
  
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        
        if (img.width < storageConfig.minImageWidth || img.height < storageConfig.minImageHeight) {
          warnings.push(`Image resolution (${img.width}x${img.height}) is below recommended minimum (${storageConfig.minImageWidth}x${storageConfig.minImageHeight}). This may affect OCR accuracy.`);
        }
        
        // Check if image is too small for reliable OCR
        if (img.width < 400 || img.height < 400) {
          errors.push('Image resolution is too low for accurate processing');
          resolve({ isValid: false, warnings, errors });
        } else {
          resolve({ isValid: true, warnings, errors });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        errors.push('Failed to load image for validation');
        resolve({ isValid: false, warnings, errors });
      };
      
      img.src = objectUrl;
    } catch (error) {
      console.warn('Image validation error:', error);
      resolve({ isValid: true, warnings, errors: [] }); // Proceed anyway in case of errors
    }
  });
}

// Client-side image compression
export async function compressImage(file: File, maxSizeMB = 1): Promise<File> {
  // Make sure we're in a browser environment
  if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
    console.warn('Image compression skipped: not in browser environment');
    return file;
  }
  
  // Skip compression for non-images
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  try {
    // Import dynamically to avoid server-side issues
    const imageCompression = (await import('browser-image-compression')).default;
    
    const options = {
      maxSizeMB,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
    };
    
    const compressedBlob = await imageCompression(file, options);
    
    // Only use compressed version if it's actually smaller
    if (compressedBlob.size < file.size) {
      return new File([compressedBlob], file.name, { type: compressedBlob.type });
    }
  } catch (error) {
    console.warn('Image compression failed:', error);
  }
  
  return file;
}
