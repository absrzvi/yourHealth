"use client";

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Download, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'react-hot-toast';

interface EDIViewerProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string | null;
  claimNumber: string;
}

export function EDIViewer({ isOpen, onClose, claimId, claimNumber }: EDIViewerProps) {
  const [ediContent, setEdiContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format EDI content for display
  const formatEDIContent = (content: string): string => {
    if (!content) return '';
    // Basic formatting for display - replace segment terminators with newlines
    return content.replace(/\~/g, '~\n');
  };

  // Fetch EDI content when dialog opens or when retry is requested
  const fetchEDIContent = useCallback(async () => {
    if (!isOpen || !claimId) {
      setEdiContent('');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/claims/${claimId}/edi`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch EDI content');
      }
      
      const data = await response.json();
      setEdiContent(data.content || JSON.stringify(data, null, 2));
      toast.success('EDI content loaded successfully');
    } catch (err) {
      console.error('Error fetching EDI content:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load EDI content';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isOpen, claimId]);

  // Initial fetch when dialog opens
  useEffect(() => {
    if (isOpen && claimId) {
      fetchEDIContent();
    }
  }, [isOpen, claimId, fetchEDIContent]);

  const handleDownload = () => {
    if (!ediContent) return;
    
    try {
      const blob = new Blob([ediContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claim-${claimNumber || claimId || 'edi'}.edi`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('EDI file downloaded successfully');
    } catch (err) {
      console.error('Error downloading EDI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download EDI';
      toast.error(errorMessage);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {claimNumber ? `EDI for Claim #${claimNumber}` : 'EDI Viewer'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded-md relative">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading EDI content...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-600 p-4 text-center">
              <AlertCircle className="h-10 w-10 mb-3 text-red-500" />
              <p className="mb-4 font-medium">Failed to load EDI content</p>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={fetchEDIContent}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Retry
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : !ediContent ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <FileText className="h-10 w-10 mb-2 opacity-50" />
              <p className="mb-4">No EDI content available</p>
              <Button 
                onClick={fetchEDIContent} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload}
                  className="h-8 px-3 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm bg-white p-4 rounded border">
                {formatEDIContent(ediContent)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {claimId && `Claim ID: ${claimId}`}
            {claimNumber && claimNumber !== 'undefined' && ` • #${claimNumber}`}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Close
            </Button>
            {ediContent && (
              <Button 
                onClick={handleDownload}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download EDI
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
