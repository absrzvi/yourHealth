"use client";

import React, { useState } from 'react';
import { Loader2, FileDown, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';

interface EDIViewerProps {
  isOpen: boolean;
  onClose: () => void;
  claimId: string | null;
  claimNumber: string | null;
}

export function EDIViewer({ isOpen, onClose, claimId, claimNumber }: EDIViewerProps) {
  const [ediContent, setEdiContent] = useState<string | null>(null);
  const [formattedEdiContent, setFormattedEdiContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch EDI content when dialog opens
  React.useEffect(() => {
    if (isOpen && claimId) {
      fetchEDIContent();
    } else {
      // Reset state when dialog closes
      setEdiContent(null);
      setFormattedEdiContent(null);
      setError(null);
    }
  }, [isOpen, claimId]);

  const fetchEDIContent = async () => {
    if (!claimId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/claims/${claimId}/edi`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch EDI content');
      }
      
      const data = await res.json();
      setEdiContent(data.ediContent);
      
      // Format EDI content for better readability
      if (data.ediContent) {
        const formatted = data.ediContent
          .replace(/~/g, '~\n')  // Add newline after each segment
          .replace(/\*/g, '*  '); // Add spaces after each element separator for readability
        setFormattedEdiContent(formatted);
      }
    } catch (err: any) {
      console.error('Error fetching EDI content:', err);
      setError(`Failed to load EDI content: ${err.message || 'Unknown error'}. Please try generating a new EDI file.`);
    } finally {
      setLoading(false);
    }
  };
  
  const generateEDI = async () => {
    if (!claimId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/claims/${claimId}/generate-edi`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate EDI');
      }
      
      const data = await res.json();
      setEdiContent(data.ediContent);
      
      // Format EDI content for better readability
      if (data.ediContent) {
        const formatted = data.ediContent
          .replace(/~/g, '~\n')  // Add newline after each segment
          .replace(/\*/g, '*  '); // Add spaces after each element separator for readability
        setFormattedEdiContent(formatted);
      }
    } catch (err: any) {
      console.error('Error generating EDI:', err);
      setError(`Failed to generate EDI content: ${err.message || 'Unknown error'}. Please check if the claim has all required data including a valid insurance plan.`);
    } finally {
      setLoading(false);
    }
  };

  const downloadEDI = () => {
    if (!ediContent || !claimNumber) return;
    
    const blob = new Blob([ediContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `Claim-${claimNumber}-EDI.837`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            EDI 837 Healthcare Claim File {claimNumber && `- Claim #${claimNumber}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading EDI content...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={generateEDI} variant="outline">
                Generate EDI
              </Button>
            </div>
          ) : !ediContent ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="mb-4">No EDI content found for this claim.</p>
              <Button onClick={generateEDI} className="bg-blue-600 hover:bg-blue-700">
                Generate EDI
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="formatted" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="justify-start">
                <TabsTrigger value="formatted">Formatted</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>
              
              <TabsContent value="formatted" className="flex-1 overflow-hidden flex flex-col mt-2">
                <div className="border rounded p-4 bg-gray-50 overflow-auto flex-1 font-mono text-sm whitespace-pre">
                  {formattedEdiContent}
                </div>
              </TabsContent>
              
              <TabsContent value="raw" className="flex-1 overflow-hidden flex flex-col mt-2">
                <div className="border rounded p-4 bg-gray-50 overflow-auto flex-1 font-mono text-sm">
                  {ediContent}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {ediContent && `${ediContent.split('~').length - 1} segments`}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            {ediContent && (
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(ediContent)}`}
                download={`claim-edi-${claimNumber || claimId}.txt`}
              >
                <Button className="flex gap-2 items-center">
                  <FileDown size={16} /> Download EDI File
                </Button>
              </a>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
