'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, FileRejection, DropzoneOptions } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileText, Dna, Microscope, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParserResult } from '@/lib/parsers';

type ReportType = 'DNA' | 'MICROBIOME' | 'BLOOD_TEST';

interface UploadCardProps {
  onUploadComplete?: (result: ParserResult) => void;
  onUploadError?: (errorMsg: string) => void;
  onUploadStart?: () => void;
  disableRedirect?: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ACCEPTED_MIME_TYPES: DropzoneOptions['accept'] = {
  'application/pdf': ['.pdf'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
  'application/json': ['.json'],
  'text/tab-separated-values': ['.tsv'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
};

const ALLOWED_EXTENSIONS_DISPLAY = ".pdf, .xls, .xlsx, .csv, .txt, .json, .tsv, .jpg, .jpeg, .png, .heic, .heif";

export function UploadCard({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  disableRedirect = false
}: UploadCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [reportType, setReportType] = useState<ReportType>('BLOOD_TEST');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case 'DNA': return <Dna className="w-10 h-10 text-primary" />;
      case 'MICROBIOME': return <Microscope className="w-10 h-10 text-primary" />;
      default: return <FileText className="w-10 h-10 text-primary" />;
    }
  };

  const needsOcrProcessing = useCallback((file: File): boolean => {
    if (file.type.startsWith('image/')) return true;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return true;
    return false;
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    onUploadStart?.();
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', reportType);

      const useOcr = needsOcrProcessing(file);
      const endpoint = useOcr ? '/api/ocr-upload' : '/api/upload';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      const successMsg = data.reportId ? `Report ${data.reportId} processed.` : 'File uploaded successfully.';
      setSuccessMessage(successMsg);
      setSelectedFile(null); 

      if (onUploadComplete) {
        onUploadComplete(data as ParserResult);
      } else {
        toast({
          title: 'Upload Successful',
          description: successMsg,
        });
        if (!disableRedirect) {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during upload.';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      } else {
        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsUploading(false);
    }
  }, [reportType, toast, router, onUploadComplete, onUploadError, onUploadStart, needsOcrProcessing, disableRedirect]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null);
    setSuccessMessage(null);
    setSelectedFile(null);

    if (fileRejections.length > 0) {
      const rejectionError = fileRejections[0].errors[0];
      let message = rejectionError.message;
      if (rejectionError.code === 'file-too-large') {
        message = `File is larger than ${MAX_FILE_SIZE_MB}MB`;
      } else if (rejectionError.code === 'file-invalid-type') {
        message = `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS_DISPLAY}`;
      }
      setError(message);
      if (onUploadError) onUploadError(message);
      else toast({ title: 'Invalid File', description: message, variant: 'destructive' });
      return;
    }

    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, [onUploadError, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
    noClick: true, 
    noKeyboard: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 md:p-8 bg-white rounded-xl shadow-2xl font-open-sans">
      <h2 className="text-2xl md:text-3xl font-semibold text-neutral-800 mb-2 font-montserrat text-center">Upload Your Health Report</h2>
      <p className="text-neutral-600 mb-6 md:mb-8 text-center">Securely upload your DNA, microbiome, or blood test results.</p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert variant="default" className="mb-4 bg-green-50 border-green-300 text-green-700">
           <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='h-4 w-4'><path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path><polyline points='22 4 12 14.01 9 11.01'></polyline></svg>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="reportType" className="block text-sm font-medium text-neutral-700">Select Report Type</label>
          <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)} disabled={isUploading}>
            <SelectTrigger id="reportType" className="w-full bg-neutral-50 border-neutral-300 focus:ring-primary focus:border-primary">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BLOOD_TEST">Blood Test Results</SelectItem>
              <SelectItem value="DNA">DNA Report</SelectItem>
              <SelectItem value="MICROBIOME">Microbiome Analysis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center w-full h-64 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            "border-neutral-300 hover:border-primary-dark",
            isDragActive ? "border-primary bg-primary-light/10" : "bg-neutral-50",
            isUploading ? "cursor-not-allowed opacity-70" : ""
          )}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('.remove-file-button')) {
              return; // Do nothing if the remove button or its children are clicked
            }
            if (!isUploading) open(); // Open file dialog only if not uploading
          }}
        >
          <input {...getInputProps()} disabled={isUploading} />
          {selectedFile ? (
            <div className="text-center">
              {getReportIcon(reportType)}
              <p className="mt-2 font-medium text-neutral-700">{selectedFile.name}</p>
              <p className="text-xs text-neutral-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              {!isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-100 remove-file-button" // Added class for specific targeting
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent dropzone's onClick from firing
                    setSelectedFile(null);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Remove
                </Button>
              )}
            </div>
          ) : isDragActive ? (
            <>
              {getReportIcon(reportType)}
              <p className="mt-2 text-lg font-medium text-primary">Drop it like it's hot!</p>
              <p className="text-sm text-neutral-500">Your files are safe with us.</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-neutral-400" />
              <p className="mt-2 text-lg font-medium text-neutral-700">
                Drag 'n' drop here, or <span className="text-primary font-semibold cursor-pointer" onClick={(e) => { e.stopPropagation(); if(!isUploading) open();}} >browse</span>
              </p>
              <p className="text-sm text-neutral-500">Max file size: {MAX_FILE_SIZE_MB}MB. Allowed types: {ALLOWED_EXTENSIONS_DISPLAY}</p>
            </>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors focus:ring-2 focus:ring-primary-light focus:ring-offset-2"
          disabled={isUploading || !selectedFile}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Upload className="mr-2 h-5 w-5" />
          )}
          {isUploading ? 'Uploading...' : (selectedFile ? `Upload ${selectedFile.name}` : 'Upload File')}
        </Button>
      </form>
    </div>
  );
}
