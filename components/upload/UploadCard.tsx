'use client';

import { useState, useCallback, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Upload, X } from 'lucide-react';

type ReportType = 'DNA' | 'MICROBIOME' | 'BLOOD_TEST';

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'application/json',
  'text/tab-separated-values'
];

export function UploadCard() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportType, setReportType] = useState<ReportType>('BLOOD_TEST');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange({ target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  }, []);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        valid: false,
        error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`
      };
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type) || 
                         ['.pdf', '.xls', '.xlsx', '.csv', '.tsv', '.txt', '.json'].includes(`.${fileExtension}`);
    
    if (!isAllowedType) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a PDF, Excel, CSV, TSV, or JSON file.'
      };
    }
    
    return { valid: true };
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid file',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedFile(file);
  }, [toast, validateFile]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', reportType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      toast({
        title: 'Success!',
        description: 'Your report has been uploaded and is being processed.',
      });
      
      // Reset form
      removeFile();
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, reportType, router, toast, removeFile]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Upload Health Report</CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload your health reports to track and analyze your biomarkers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select 
              value={reportType} 
              onValueChange={(value) => setReportType(value as ReportType)}
              disabled={isUploading}
            >
              <SelectTrigger id="report-type" className="w-full">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BLOOD_TEST">Blood Test</SelectItem>
                <SelectItem value="DNA">DNA Report</SelectItem>
                <SelectItem value="MICROBIOME">Microbiome Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Report File</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-sm">
                  <label 
                    htmlFor="file-upload" 
                    className="relative cursor-pointer text-primary hover:text-primary/80 font-medium"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      ref={fileInputRef}
                      className="sr-only"
                      onChange={handleFileChange}
                      accept={ALLOWED_FILE_TYPES.join(',') + ',.pdf,.xls,.xlsx,.csv,.tsv,.txt,.json'}
                      disabled={isUploading}
                    />
                  </label>{' '}
                  or drag and drop
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF, CSV, XLS, XLSX, or TXT (max {MAX_FILE_SIZE_MB}MB)
                </p>
              </div>
            </div>
            
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md mt-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm truncate max-w-[200px]">
                    {selectedFile.name}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={removeFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
