"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDFParseResult } from '@/src/lib/claims/types/claims.types';

interface PDFUploaderProps {
  onParseComplete: (result: PDFParseResult) => void;
  className?: string;
}

export function PDFUploader({ onParseComplete, className = '' }: PDFUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [parseConfidence, setParseConfidence] = useState<number | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'blood_test'); // Default to blood test type

      const response = await fetch('/api/ocr-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to parse PDF');
      }

      const ocrResult = await response.json();
      setUploadSuccess(true);
      
      // Define the test result type from OCR response
      interface TestResult {
        name?: string | null;
        value?: number | string | null;
        unit?: string | null;
        referenceRange?: string | null;
        flag?: string | null;
        category?: string | null;
      }
      
      // Map the OCR response to the expected PDFParseResult format
      const result: PDFParseResult = {
        confidence: ocrResult.confidence || 0.8,
        patient: {
          firstName: ocrResult.patientInfo?.name?.split(' ')[0],
          lastName: ocrResult.patientInfo?.name?.split(' ').slice(1).join(' '),
          dateOfBirth: ocrResult.patientInfo?.dob,
          gender: ocrResult.patientInfo?.gender,
          address: ocrResult.patientInfo?.address,
          city: ocrResult.patientInfo?.city,
          state: ocrResult.patientInfo?.state,
          zip: ocrResult.patientInfo?.zip,
          phone: ocrResult.patientInfo?.phone,
        },
        provider: {
          name: ocrResult.providerInfo?.name,
          npi: ocrResult.providerInfo?.npi,
          taxId: ocrResult.providerInfo?.taxId,
          address: ocrResult.providerInfo?.address,
          city: ocrResult.providerInfo?.city,
          state: ocrResult.providerInfo?.state,
          zip: ocrResult.providerInfo?.zip,
        },
        specimen: {
          id: ocrResult.specimenInfo?.id,
          collectionDate: ocrResult.specimenInfo?.collectionDate,
          receivedDate: ocrResult.specimenInfo?.receivedDate
        },
        biomarkers: (ocrResult.tests || []).map((test: TestResult) => {
          // Ensure required fields have defaults
          const name = test.name || 'Unknown Test';
          const value = test.value?.toString() || '';
          
          return {
            name,
            value,
            unit: test.unit || '',
            referenceRange: test.referenceRange || '',
            status: test.flag || '',
            category: test.category || 'General'
          };
        }),
        rawText: JSON.stringify(ocrResult, null, 2),
        extractedSections: {}
      };
      
      setParseConfidence(result.confidence * 100); // Convert to percentage for display
      
      // Pass the parsed data to the parent component
      onParseComplete(result);
    } catch (error: any) {
      console.error('PDF parsing error:', error);
      setUploadError(error.message || 'Failed to parse PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onParseComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className={className}>
      <Card className={`p-6 ${isDragActive ? 'bg-blue-50 border-blue-300' : ''}`}>
        <div 
          {...getRootProps()} 
          className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Parsing PDF content...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              {uploadSuccess ? (
                <>
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-green-600">PDF successfully parsed!</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Parse confidence: {Math.round(parseConfidence || 0)}%
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm font-medium">Drag & drop a lab report PDF here</p>
                  <p className="text-xs text-gray-500 mt-1">
                    or click to select a file
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {!isUploading && !uploadSuccess && (
          <div className="mt-4 flex justify-center">
            <Button 
              type="button"
              className="flex items-center gap-2"
              {...getRootProps()}
            >
              <FileText className="h-4 w-4" />
              Select PDF
            </Button>
          </div>
        )}

        {uploadError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {uploadSuccess && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {parseConfidence && parseConfidence > 80 
                ? 'High confidence extraction! Most fields have been auto-populated.' 
                : 'PDF parsed with moderate confidence. Please verify the extracted information.'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
