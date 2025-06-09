"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { logger } from '../../lib/logger';

interface EDIFileStatusProps {
  claimId: string;
  claimNumber: string;
  ediFileLocation?: string | null;
  status: string;
  onRefresh: () => void;
}

export function EDIFileStatus({ claimId, claimNumber, ediFileLocation, status, onRefresh }: EDIFileStatusProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    fileName: string;
    createdAt: string;
    size: number;
  } | null>(null);

  useEffect(() => {
    if (ediFileLocation) {
      fetchFileDetails();
    }
  }, [ediFileLocation]);

  const fetchFileDetails = async () => {
    if (!ediFileLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/claims/${claimId}/edi?action=status`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch EDI file details');
      }
      
      const data = await res.json();
      setFileDetails(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Error fetching EDI file details: ${errorMessage}`);
      setError(`Failed to load EDI file details: ${errorMessage || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateEDI = async () => {
    if (generating) return;
    
    setGenerating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await fetch(`/api/claims/${claimId}/edi?action=generate`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate EDI file');
      }
      
      await res.json(); // We don't need to use the data here
      setSuccess('EDI file generated successfully');
      onRefresh(); // Refresh the parent component to show updated status
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Error generating EDI file: ${errorMessage}`);
      setError(`Failed to generate EDI file: ${errorMessage || 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const downloadEDI = async () => {
    if (!ediFileLocation) return;
    
    try {
      const res = await fetch(`/api/claims/${claimId}/edi?action=download`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to download EDI file');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Claim-${claimNumber}-EDI.837`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Error downloading EDI file: ${errorMessage}`);
      setError(`Failed to download EDI file: ${errorMessage || 'Unknown error'}`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = () => {
    if (!ediFileLocation) {
      return <Badge variant="outline" className="bg-gray-100">Not Generated</Badge>;
    }
    
    switch (status) {
      case 'READY':
        return <Badge className="bg-green-500">Ready to Submit</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-yellow-500">Processing</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-700">Approved</Badge>;
      case 'DENIED':
        return <Badge className="bg-red-500">Denied</Badge>;
      case 'PAID':
        return <Badge className="bg-green-600">Paid</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">EDI File Status</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Claim #{claimNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-red-500 mb-4 p-2 bg-red-50 rounded border border-red-200">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 text-green-600 mb-4 p-2 bg-green-50 rounded border border-green-200">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {!ediFileLocation ? (
          <div className="text-center py-4">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No EDI file has been generated for this claim yet.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-4">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-gray-500">Loading file details...</p>
          </div>
        ) : fileDetails ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">File Name:</span>
              <span className="font-medium">{fileDetails.fileName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Created:</span>
              <span>{formatDate(fileDetails.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Size:</span>
              <span>{formatFileSize(fileDetails.size)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">EDI file exists but details could not be loaded.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchFileDetails}
                disabled={loading || !ediFileLocation}
              >
                <RefreshCw size={16} className={loading ? "animate-spin mr-2" : "mr-2"} />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh file details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex gap-2">
          <Button 
            variant={ediFileLocation ? "outline" : "default"}
            size="sm"
            onClick={generateEDI}
            disabled={generating}
          >
            {generating && <RefreshCw size={16} className="animate-spin mr-2" />}
            {ediFileLocation ? 'Regenerate EDI' : 'Generate EDI'}
          </Button>
          
          {ediFileLocation && (
            <Button 
              variant="default" 
              size="sm"
              onClick={downloadEDI}
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
