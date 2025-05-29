'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { uploadReportImage } from '@/lib/api/upload';
import { validateImageDimensions } from '@/lib/storage/upload-utils';

// UI components
interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

// Simplified button component - replace with your UI library's button
const Button = ({ 
  children, 
  onClick, 
  disabled, 
  className = "", 
  variant = "default", 
  type = "button" 
}: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-medium 
    ${variant === 'default' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
    ${variant === 'outline' ? 'border border-gray-300 bg-transparent hover:bg-gray-50' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

// Loading spinner
const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Upload icon
const UploadIcon = () => (
  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path
      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-8m-12 0H8m12 0a4 4 0 01-4-4v-4m8 0h8m-4-4v8m0-16v4m0 0h-8m8 0h8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Camera icon
const CameraIcon = () => (
  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
      <div className="flex items-center">
        <span>{message}</span>
        <button className="ml-4 text-white" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

// Image quality indicator component
const ImageQualityIndicator = ({ quality }: { quality: 'high' | 'medium' | 'low' | 'unknown' }) => {
  const colors = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
    unknown: 'bg-gray-500'
  };
  
  const labels = {
    high: 'High quality - Good for OCR',
    medium: 'Medium quality - May affect accuracy',
    low: 'Low quality - Consider retaking',
    unknown: 'Quality unknown'
  };
  
  return (
    <div className="flex items-center mt-2">
      <div className={`h-3 w-3 rounded-full ${colors[quality]} mr-2`}></div>
      <span className="text-sm text-gray-600">{labels[quality]}</span>
    </div>
  );
};

// Main component
export function ReportImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [imageQuality, setImageQuality] = useState<'high' | 'medium' | 'low' | 'unknown'>('unknown');
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const router = useRouter();

  // Reset the toast
  const resetToast = () => setToastMessage(null);

  // Image drop handler
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Check image quality
    try {
      const { isValid, warnings } = await validateImageDimensions(file);
      setQualityWarnings(warnings);
      
      if (!isValid) {
        setImageQuality('low');
      } else if (warnings.length > 0) {
        setImageQuality('medium');
      } else {
        setImageQuality('high');
      }
    } catch (error) {
      console.error('Failed to validate image:', error);
      setImageQuality('unknown');
    }
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: status === 'uploading' || status === 'processing',
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !preview) return;

    setStatus('uploading');
    
    try {
      // Upload and process the image
      const result = await uploadReportImage(file);
      
      if (result.success) {
        setStatus('success');
        setToastType('success');
        setToastMessage(`Successfully processed ${result.testCount} test results`);
        
        // Redirect to report page after a short delay
        setTimeout(() => {
          router.push(`/reports/${result.reportId}`);
        }, 1500);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus('error');
      setToastType('error');
      setToastMessage(error instanceof Error ? error.message : 'Failed to process report');
    }
  };

  // Render retry button for failed uploads
  const handleRetry = () => {
    setStatus('idle');
    setFile(null);
    setPreview(null);
    setImageQuality('unknown');
    setQualityWarnings([]);
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${status === 'uploading' || status === 'processing' ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        
        {preview ? (
          <div className="space-y-4">
            <div className="relative h-64">
              <img 
                src={preview} 
                alt="Report Preview" 
                className="max-h-full max-w-full mx-auto object-contain"
              />
            </div>
            
            <ImageQualityIndicator quality={imageQuality} />
            
            {qualityWarnings.length > 0 && (
              <div className="mt-2 text-sm text-yellow-600">
                {qualityWarnings.map((warning, i) => (
                  <p key={i}>{warning}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <UploadIcon />
            <p className="text-lg font-medium text-gray-900">
              Upload Lab Report
            </p>
            <p className="text-sm text-gray-500">
              {isDragActive ? (
                'Drop the file here'
              ) : (
                'Drag & drop your lab report, or click to select'
              )}
            </p>
            <p className="text-xs text-gray-500">
              Supports JPG, PNG, PDF (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Mobile camera capture option */}
      {!preview && (
        <div className="mt-4">
          <Button 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.capture = 'environment';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  onDrop([file]);
                }
              };
              input.click();
            }}
            className="w-full flex items-center justify-center"
            variant="outline"
          >
            <CameraIcon />
            <span className="ml-2">Take Photo with Camera</span>
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col space-y-3">
        {status === 'error' ? (
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!preview || status === 'uploading' || status === 'processing'}
            className="w-full"
          >
            {status === 'uploading' || status === 'processing' ? (
              <>
                <LoadingSpinner />
                {status === 'uploading' ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              'Process Report'
            )}
          </Button>
        )}
        
        {imageQuality === 'low' && preview && (
          <p className="text-xs text-red-500 text-center">
            Warning: Low image quality may affect accuracy. For best results, take a photo with good lighting and make sure the report is clearly visible.
          </p>
        )}
      </div>

      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={resetToast}
        />
      )}
    </div>
  );
}
