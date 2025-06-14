"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import React from 'react';
import { Search, X, ChevronDown, Download, FileText, Loader2, Eye, XCircle } from 'lucide-react';
import { EDIViewer } from './EDIViewer';

// Define interfaces for our data structures
interface InsurancePlan {
  id: string;
  name: string;
  payerId: string;
  payerName: string;
  planType: string;
  createdAt: string;
  updatedAt: string;
}

interface ClaimEvent {
  id: string;
  claimId: string;
  eventType: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface EligibilityCheck {
  id: string;
  claimId: string;
  status: string;
  response: any;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface DenialPattern {
  id: string;
  code: string;
  description: string;
  reason: string;
  solution: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimLine {
  id: string;
  claimId: string;
  cptCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  diagnosisCode: string;
  lineNumber: number;
  serviceDate: string;
  charge?: number;
  units?: number;
  icd10Codes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PROCESSING' | 'PAID' | 'DENIED' | 'ADJUSTED' | 'REJECTED' | 'PENDING';
  patientName: string;
  patientFirstName: string;
  patientLastName: string;
  dateOfService: string;
  totalCharge: number;
  totalAmount: number;
  paidAmount?: number;
  insuranceProvider: string;
  insurancePlan?: InsurancePlan;
  claimLines: ClaimLine[];
  claimEvents?: ClaimEvent[];
  eligibilityCheck?: EligibilityCheck;
  denialPatterns?: DenialPattern[];
  providerId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  ediFileId?: string;
  ediFileLocation?: string | null;
}

export function ClaimsList() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [ediModalOpen, setEdiModalOpen] = useState(false);
  const [ediContent, setEdiContent] = useState('');
  const [ediError, setEdiError] = useState<string | null>(null);
  const [ediLoading, setEdiLoading] = useState(false);
  const [currentEdiClaimId, setCurrentEdiClaimId] = useState<string | null>(null);
  const [currentEdiClaimNumber, setCurrentEdiClaimNumber] = useState<string | null>(null);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Claim; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [newLine, setNewLine] = useState<{
    cptCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
    diagnosisCode: string;
    lineNumber: number;
    serviceDate: string;
  }>({
    cptCode: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    diagnosisCode: '',
    lineNumber: 1,
    serviceDate: new Date().toISOString().split('T')[0],
  });
  const [editForm, setEditForm] = useState<Partial<Claim> | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [lineLoading, setLineLoading] = useState<boolean>(false);
  const [newClaim, setNewClaim] = useState<Partial<Claim>>({
    status: 'DRAFT',
    patientFirstName: '',
    patientLastName: '',
    claimNumber: '',
    totalCharge: 0,
    dateOfService: new Date().toISOString().split('T')[0],
    claimLines: [],
  });
  const [editLineId, setEditLineId] = useState<string | null>(null);
  const [editLineForm, setEditLineForm] = useState<{
    cptCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
    diagnosisCode: string;
    lineNumber: number;
    serviceDate: string;
  } | null>(null);
  const [addLineForm, setAddLineForm] = useState<{
    lineNumber: number;
    cptCode: string;
    description: string;
    quantity: number;
    unitPrice: number;
    diagnosisCode: string;
    serviceDate: string;
  }>({
    lineNumber: 1,
    cptCode: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    diagnosisCode: '',
    serviceDate: new Date().toISOString().split('T')[0],
  });
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'DENIED', label: 'Denied' },
    { value: 'ADJUSTED', label: 'Adjusted' },
    { value: 'REJECTED', label: 'Rejected' },
  ];
  const statusColorMap: Record<string, string> = {
    'DRAFT': 'bg-gray-200',
    'SUBMITTED': 'bg-blue-200',
    'PROCESSING': 'bg-yellow-200',
    'PENDING': 'bg-yellow-100',
    'DENIED': 'bg-red-200',
    'ADJUSTED': 'bg-purple-200',
    'REJECTED': 'bg-red-300',
    'PAID': 'bg-green-300',
  };

  // Fetch claims on component mount
  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/claims');
      if (!response.ok) {
        throw new Error('Failed to fetch claims');
      }
      const data: Claim[] = await response.json();
      setClaims(data);
    } catch (err) {
      console.error('Error fetching claims:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch claims');
      toast.error('Failed to load claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Handle sorting with proper type safety
  const handleSort = useCallback((key: keyof Claim) => {
    setSortConfig((prevConfig) => {
      // If clicking the same key, toggle direction
      if (prevConfig?.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
        } as const;
      }
      // If clicking a new key, default to ascending
      return { key, direction: 'asc' as const };
    });
  }, []);

  // Get sort indicator
  const getSortIndicator = (key: keyof Claim) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <span className="ml-1">↕️</span>;
    }
    return (
      <span className="ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Filter and sort claims
  useEffect(() => {
    let result = [...claims];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(claim => claim.status === statusFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(claim => 
        (claim.claimNumber?.toLowerCase().includes(term) ||
        claim.patientLastName?.toLowerCase().includes(term) ||
        claim.patientFirstName?.toLowerCase().includes(term) ||
        claim.insuranceProvider?.toLowerCase().includes(term)) ?? false
      );
    }
    
    // Apply sorting
    if (sortConfig) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        // Handle nested properties
        let aValue: any = a[key];
        let bValue: any = b[key];
        
        // Handle potential undefined values
        if (aValue === undefined) aValue = '';
        if (bValue === undefined) bValue = '';
        
        // Special handling for dates
        if ((key === 'createdAt' || key === 'updatedAt') && (aValue && bValue)) {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        // Handle string comparison
        if (aValue < bValue) {
          return direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredClaims(result);
  }, [claims, statusFilter, searchTerm, sortConfig]);

  // Handle EDI generation with proper error handling
  const handleGenerateEdi = useCallback(async (claimId: string) => {
    try {
      setEdiLoading(true);
      setEdiError(null);
      
      const response = await fetch(`/api/claims/${claimId}/generate-edi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate EDI');
      }
      
      const data = await response.json();
      
      // Update the claims list with the new EDI file ID and location
      setClaims(prevClaims =>
        prevClaims.map(claim =>
          claim.id === claimId
            ? {
                ...claim,
                ediFileId: data.fileId || claim.ediFileId,
                ediFileLocation: data.fileLocation || claim.ediFileLocation,
                status: data.status || claim.status,
                updatedAt: new Date().toISOString(),
              }
            : claim
        )
      );
      
      // If we have the EDI content, show it
      if (data.content) {
        setEdiContent(data.content);
        setCurrentEdiClaimId(claimId);
        setCurrentEdiClaimNumber(data.claimNumber);
        setEdiModalOpen(true);
      }
      
      toast.success('EDI file generated successfully');
    } catch (err) {
      console.error('Error generating EDI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate EDI';
      setEdiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setEdiLoading(false);
    }
  }, [setClaims]);

  // Handle claim edit
  const startEdit = (claim: Claim) => {
    setSelectedClaim(claim);
  };

  // Handle adding a new line
  const addLine = async (claimId: string) => {
    // Implementation for adding a new line
  };

  // Close EDI modal and reset state
  const closeEdiModal = useCallback(() => {
    setEdiModalOpen(false);
    setEdiContent('');
    setEdiError(null);
    setCurrentEdiClaimId(null);
    setCurrentEdiClaimNumber(null);
  }, []);

  // Handle EDI download with proper error handling
  const handleDownloadEdi = useCallback(async (claimId: string, claimNumber?: string) => {
    if (!claimNumber) {
      toast.error('Claim number is required for download');
      return;
    }
    
    try {
      const response = await fetch(`/api/claims/${claimId}/edi`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download EDI');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claim-${claimNumber}.edi`;
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
  }, []);

  // Handle viewing EDI content with proper error handling
  const handleViewEdi = useCallback(async (claimId: string, claimNumber?: string) => {
    try {
      setEdiLoading(true);
      setEdiError(null);
      setCurrentEdiClaimId(claimId);
      setCurrentEdiClaimNumber(claimNumber || null);
      
      const response = await fetch(`/api/claims/${claimId}/edi`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch EDI content');
      }
      
      const data = await response.json();
      setEdiContent(data.content || JSON.stringify(data, null, 2));
      setEdiModalOpen(true);
    } catch (err) {
      console.error('Error fetching EDI content:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load EDI content';
      setEdiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setEdiLoading(false);
    }
  }, []);

  // Render EDI actions based on claim status
  const renderEDIActions = useCallback((claim: Claim & { ediFileId?: string }) => {
    if (claim.ediFileId) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewEdi(claim.id, claim.claimNumber)}
            className="text-blue-600 hover:text-blue-800"
            title="View EDI"
            aria-label="View EDI"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDownloadEdi(claim.id, claim.claimNumber)}
            className="text-green-600 hover:text-green-800"
            title="Download EDI"
            aria-label="Download EDI"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      );
    }
    
    if (claim.status && ['DRAFT', 'PENDING'].includes(claim.status)) {
      return (
        <button
          onClick={() => handleGenerateEdi(claim.id)}
          disabled={ediLoading}
          className="text-green-600 hover:text-green-800 disabled:opacity-50"
          title="Generate EDI"
          aria-label="Generate EDI"
        >
          {ediLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </button>
      );
    }
    
    return null;
  }, [ediLoading, handleDownloadEdi, handleGenerateEdi, handleViewEdi]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Claims</h1>
        {/* ... */}
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* ... */}
        </div>
      </div>

      {/* ... */}

      {/* EDI Viewer Modal */}
      <EDIViewer 
        isOpen={ediModalOpen}
        onClose={closeEdiModal}
        claimId={currentEdiClaimId}
        claimNumber={currentEdiClaimNumber || ''}
      />
    </div>
  );
}