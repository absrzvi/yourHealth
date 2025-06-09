"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { PDFUploader } from './PDFUploader';

// Define field source types
type FieldSource = 'pdf' | 'manual' | 'default' | 'database';

// Define our own PDFParseResult interface to match our component needs
interface PDFParseResult {
  patientInfo?: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    gender?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
    accountNumber?: string;
  };
  providerInfo?: {
    name?: string;
    npi?: string;
    taxId?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  specimenInfo?: {
    id?: string;
    collectionDate?: string;
    receivedDate?: string;
  };
  biomarkers?: Array<{
    id: string;
    name: string;
    value: string;
    unit: string;
    referenceRange?: string;
    status?: string;
    category?: string;
    selected?: boolean;
    abnormal?: boolean;
  }>;
  confidence?: number;
}

// Define interfaces for form data
interface InsurancePlan {
  id: string;
  payerName: string;
  memberId: string;
  planType: string;
  name?: string;
  payer?: string;
}

interface ClaimLine {
  id: string;
  cptCode: string;
  description: string;
  icd10Codes: string | string[];
  charge: string | number;
  units: number;
  serviceDate: string;
  dateOfService?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  modifier?: string;
}

interface FormData {
  claimNumber: string;
  totalCharge: string;
  status: string;
  insurancePlanId: string;
  placeOfService: string;
  priorAuthNumber: string;
  referralNumber: string;
  admissionDate: string;
  dischargeDate: string;
  patientAccountNum: string;
  acceptAssignment: boolean;
  renderingProviderNPI: string;
  referringProviderNPI: string;
  facilityNPI: string;
  medicalRecordNumber: string;
  patientFirstName: string;
  patientLastName: string;
  patientDOB: string;
  patientGender: string;
  patientAddress: string;
  patientCity: string;
  patientState: string;
  patientZip: string;
  patientPhone: string;
  providerName: string;
  providerNPI: string;
  providerTaxId: string;
  providerAddress: string;
  providerCity: string;
  providerState: string;
  providerZip: string;
  specimenId: string;
  collectionDate: string;
  receivedDate: string;
}

interface Biomarker {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: string;
  category: string;
  selected: boolean;
  abnormal: boolean;
}

interface EnhancedClaimFormProps {
  initialData?: Record<string, unknown>;
  editMode?: boolean;
  onSuccess?: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export function EnhancedClaimForm({ 
  editMode = false, 
  initialData, 
  onSuccess, 
  onCancel 
}: EnhancedClaimFormProps) {
  const router = useRouter();
  
  // Form state management
  const [activeTab, setActiveTab] = useState('upload');
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Store PDF parse results for processing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pdfParseResult, setPdfParseResult] = useState<PDFParseResult | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  // Form data with EDI 837P fields
  const [form, setForm] = useState<FormData>({
    claimNumber: '',
    totalCharge: '',
    status: 'DRAFT',
    insurancePlanId: '',
    placeOfService: '',
    priorAuthNumber: '',
    referralNumber: '',
    admissionDate: '',
    dischargeDate: '',
    patientAccountNum: '',
    acceptAssignment: true,
    renderingProviderNPI: '',
    referringProviderNPI: '',
    facilityNPI: '',
    medicalRecordNumber: '',
    patientFirstName: '',
    patientLastName: '',
    patientDOB: '',
    patientGender: '',
    patientAddress: '',
    patientCity: '',
    patientState: '',
    patientZip: '',
    patientPhone: '',
    providerName: '',
    providerNPI: '',
    providerTaxId: '',
    providerAddress: '',
    providerCity: '',
    providerState: '',
    providerZip: '',
    specimenId: '',
    collectionDate: '',
    receivedDate: '',
  });
  
  const [fieldSources, setFieldSources] = useState<Record<string, FieldSource>>({});
  
  // Form validation state
  // We'll use validationErrors in the future for form validation
  const [, setValidationErrors] = useState<Record<string, string[]>>({});
  // formCompletion is used to track progress in each section
  const [, setFormCompletion] = useState({
    patient: 0,
    provider: 0,
    service: 0,
    biomarkers: 0,
    claimLines: 0,
    overall: 0
  });
  
  // Claim lines management
  const [claimLines, setClaimLines] = useState<ClaimLine[]>([]);
  const [, setCurrentLine] = useState<ClaimLine>({
    id: '',
    cptCode: '',
    description: '',
    icd10Codes: '',
    charge: '',
    units: 1,
    serviceDate: '',
    dateOfService: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    modifier: ''
  });
  
  // Biomarkers from PDF parsing
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  
  // Auto-save timer reference
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Load insurance plans and initialize form data
  useEffect(() => {
    fetchInsurancePlans();
    
    // If in edit mode and initialData is provided, set form data
    if (editMode && initialData) {
      initializeFormFromData(initialData);
    }
  }, [editMode, initialData]);
  
  // Function to initialize form from existing data
  const initializeFormFromData = (data: unknown) => {
    if (!data) return;
    
    const typedData = data as Record<string, unknown>;
    
    // Set form data from initialData
    setForm(prev => ({
      ...prev,
      claimNumber: typedData.claimNumber as string || '',
      totalCharge: typedData.totalCharge as string || '',
      status: typedData.status as string || 'DRAFT',
      insurancePlanId: typedData.insurancePlanId as string || '',
      placeOfService: typedData.placeOfService as string || '',
      priorAuthNumber: typedData.priorAuthNumber as string || '',
      referralNumber: typedData.referralNumber as string || '',
      admissionDate: typedData.admissionDate as string || '',
      dischargeDate: typedData.dischargeDate as string || '',
      patientAccountNum: typedData.patientAccountNum as string || '',
      acceptAssignment: typedData.acceptAssignment as boolean || true,
      renderingProviderNPI: typedData.renderingProviderNPI as string || '',
      referringProviderNPI: typedData.referringProviderNPI as string || '',
      facilityNPI: typedData.facilityNPI as string || '',
      medicalRecordNumber: typedData.medicalRecordNumber as string || '',
      patientFirstName: typedData.patientFirstName as string || '',
      patientLastName: typedData.patientLastName as string || '',
      patientDOB: typedData.patientDOB as string || '',
      patientGender: typedData.patientGender as string || '',
      patientAddress: typedData.patientAddress as string || '',
      patientCity: typedData.patientCity as string || '',
      patientState: typedData.patientState as string || '',
      patientZip: typedData.patientZip as string || '',
      patientPhone: typedData.patientPhone as string || '',
      providerName: typedData.providerName as string || '',
      providerNPI: typedData.providerNPI as string || '',
      providerTaxId: typedData.providerTaxId as string || '',
      providerAddress: typedData.providerAddress as string || '',
      providerCity: typedData.providerCity as string || '',
      providerState: typedData.providerState as string || '',
      providerZip: typedData.providerZip as string || '',
      specimenId: typedData.specimenId as string || '',
      collectionDate: typedData.collectionDate as string || '',
      receivedDate: typedData.receivedDate as string || '',
    }));
    
    // Set claim lines if available
    if (typedData.claimLines && Array.isArray(typedData.claimLines)) {
      setClaimLines(typedData.claimLines as ClaimLine[]);
    }
    
    // Set field sources to indicate data came from database
    const sources: Record<string, FieldSource> = {};
    Object.keys(typedData).forEach(key => {
      if (typedData[key]) {
        sources[key] = 'database';
      }
    });
    setFieldSources(sources);
    
    // Set draft ID if available
    if (typedData.id) {
      setDraftId(typedData.id as string);
    }
  };
  
  // Fetch available insurance plans
  const fetchInsurancePlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch('/api/insurance-plans');
      if (!res.ok) throw new Error('Failed to fetch insurance plans');
      const data = await res.json() as InsurancePlan[];
      setInsurancePlans(data);
      
      // If we have plans and not in edit mode, set the first one as default
      if (data.length > 0 && !editMode) {
        setForm(prev => ({ ...prev, insurancePlanId: data[0].id }));
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error loading insurance plans:', error.message);
      setError('Failed to load insurance plans. Please try again.');
    } finally {
      setLoadingPlans(false);
    }
  };

  // Add claim line function
  const addClaimLine = () => {
    const newLine: ClaimLine = {
      id: `line-${Date.now()}`,
      cptCode: '',
      description: '',
      icd10Codes: '',
      charge: '',
      units: 1,
      serviceDate: '',
      dateOfService: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      modifier: ''
    };
    
    setClaimLines(prev => [...prev, newLine]);
    setCurrentLine(newLine);
    
    // Update form completion after adding a line
    setTimeout(() => calculateFormCompletion(), 100);
  };
  
  // Remove claim line function
  const removeClaimLine = (index: number) => {
    setClaimLines(prev => prev.filter((_, i) => i !== index));
    
    // Update form completion after removing a line
    setTimeout(() => calculateFormCompletion(), 100);
  };
  
  // Define interface for external PDF parse result
  interface ExternalPDFParseResult {
    patient?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      gender?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      phone?: string;
      accountNumber?: string;
    };
    provider?: {
      name?: string;
      npi?: string;
      taxId?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
    specimen?: {
      id?: string;
      collectionDate?: string;
      receivedDate?: string;
    };
    biomarkers?: Array<{
      id?: string;
      name?: string;
      value?: string | number;
      unit?: string;
      referenceRange?: string;
      status?: string;
      category?: string;
      selected?: boolean;
      abnormal?: boolean;
    }>;
    confidence?: number;
  }

  // Handle PDF parse completion from the PDFUploader component
  const handlePdfParseComplete = (result: ExternalPDFParseResult) => {
    // Convert the external PDFParseResult to our internal format
    const parsedResult: PDFParseResult = {
      patientInfo: result.patient ? {
        firstName: result.patient.firstName || '',
        lastName: result.patient.lastName || '',
        dob: result.patient.dateOfBirth || '',
        gender: result.patient.gender || '',
        address: result.patient.address || '',
        city: result.patient.city || '',
        state: result.patient.state || '',
        zip: result.patient.zip || '',
        phone: result.patient.phone || '',
        accountNumber: result.patient.accountNumber || ''
      } : undefined,
      providerInfo: result.provider ? {
        name: result.provider.name || '',
        npi: result.provider.npi || '',
        taxId: result.provider.taxId || '',
        address: result.provider.address || '',
        city: result.provider.city || '',
        state: result.provider.state || '',
        zip: result.provider.zip || ''
      } : undefined,
      specimenInfo: result.specimen ? {
        id: result.specimen.id || '',
        collectionDate: result.specimen.collectionDate || '',
        receivedDate: result.specimen.receivedDate || ''
      } : undefined,
      biomarkers: Array.isArray(result.biomarkers) ? result.biomarkers.map((bm) => ({
        id: bm.id || `biomarker-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: bm.name || '',
        value: String(bm.value || ''),
        unit: bm.unit || '',
        referenceRange: bm.referenceRange || '',
        status: bm.status || 'normal',
        category: bm.category || 'general',
        selected: bm.selected !== undefined ? bm.selected : true,
        abnormal: bm.abnormal !== undefined ? bm.abnormal : false
      })) : [],
      confidence: result.confidence
    };
    
    // Store the parse result
    setPdfParseResult(parsedResult);
    
    // Update form with parsed data
    const newForm = { ...form };
    const newSources: Record<string, FieldSource> = { ...fieldSources };
    
    // Update patient information if available
    if (parsedResult.patientInfo) {
      if (parsedResult.patientInfo.firstName) {
        newForm.patientFirstName = parsedResult.patientInfo.firstName;
        newSources.patientFirstName = 'pdf';
      }
      if (parsedResult.patientInfo.lastName) {
        newForm.patientLastName = parsedResult.patientInfo.lastName;
        newSources.patientLastName = 'pdf';
      }
      if (parsedResult.patientInfo.dob) {
        newForm.patientDOB = parsedResult.patientInfo.dob;
        newSources.patientDOB = 'pdf';
      }
      if (parsedResult.patientInfo.gender) {
        newForm.patientGender = parsedResult.patientInfo.gender;
        newSources.patientGender = 'pdf';
      }
      if (parsedResult.patientInfo.address) {
        newForm.patientAddress = parsedResult.patientInfo.address;
        newSources.patientAddress = 'pdf';
      }
      if (parsedResult.patientInfo.city) {
        newForm.patientCity = parsedResult.patientInfo.city;
        newSources.patientCity = 'pdf';
      }
      if (parsedResult.patientInfo.state) {
        newForm.patientState = parsedResult.patientInfo.state;
        newSources.patientState = 'pdf';
      }
      if (parsedResult.patientInfo.zip) {
        newForm.patientZip = parsedResult.patientInfo.zip;
        newSources.patientZip = 'pdf';
      }
      if (parsedResult.patientInfo.phone) {
        newForm.patientPhone = parsedResult.patientInfo.phone;
        newSources.patientPhone = 'pdf';
      }
      if (parsedResult.patientInfo.accountNumber) {
        newForm.patientAccountNum = parsedResult.patientInfo.accountNumber;
        newSources.patientAccountNum = 'pdf';
      }
    }
    
    // Update provider information if available
    if (parsedResult.providerInfo) {
      if (parsedResult.providerInfo.name) {
        newForm.providerName = parsedResult.providerInfo.name;
        newSources.providerName = 'pdf';
      }
      if (parsedResult.providerInfo.npi) {
        newForm.providerNPI = parsedResult.providerInfo.npi;
        newSources.providerNPI = 'pdf';
      }
      if (parsedResult.providerInfo.taxId) {
        newForm.providerTaxId = parsedResult.providerInfo.taxId;
        newSources.providerTaxId = 'pdf';
      }
      if (parsedResult.providerInfo.address) {
        newForm.providerAddress = parsedResult.providerInfo.address;
        newSources.providerAddress = 'pdf';
      }
      if (parsedResult.providerInfo.city) {
        newForm.providerCity = parsedResult.providerInfo.city;
        newSources.providerCity = 'pdf';
      }
      if (parsedResult.providerInfo.state) {
        newForm.providerState = parsedResult.providerInfo.state;
        newSources.providerState = 'pdf';
      }
      if (parsedResult.providerInfo.zip) {
        newForm.providerZip = parsedResult.providerInfo.zip;
        newSources.providerZip = 'pdf';
      }
    }
    
    // Update specimen information if available
    if (parsedResult.specimenInfo) {
      if (parsedResult.specimenInfo.id) {
        newForm.specimenId = parsedResult.specimenInfo.id;
        newSources.specimenId = 'pdf';
      }
      if (parsedResult.specimenInfo.collectionDate) {
        newForm.collectionDate = parsedResult.specimenInfo.collectionDate;
        newSources.collectionDate = 'pdf';
      }
      if (parsedResult.specimenInfo.receivedDate) {
        newForm.receivedDate = parsedResult.specimenInfo.receivedDate;
        newSources.receivedDate = 'pdf';
      }
    }
    
    // Update form and sources
    setForm(newForm);
    setFieldSources(newSources);
    
    // Extract biomarkers if available
    if (parsedResult.biomarkers && Array.isArray(parsedResult.biomarkers)) {
      const extractedBiomarkers = parsedResult.biomarkers.map((bm) => ({
        id: bm.id || `biomarker-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: bm.name || '',
        value: bm.value || '',
        unit: bm.unit || '',
        referenceRange: bm.referenceRange || '',
        status: bm.status || 'normal',
        category: bm.category || 'general',
        abnormal: bm.abnormal === true,
        selected: bm.selected !== undefined ? bm.selected : true
      }));
      
      setBiomarkers(extractedBiomarkers);
    }
    
    // Auto-advance to patient info tab after successful parse
    setActiveTab('patient');
    
    // Show success message
    setSuccess('PDF parsed successfully! Form fields have been populated.');
  };
  
  // Handle form field changes
  const handleFormChange = (name: string, value: unknown, source: FieldSource = 'manual') => {
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldSources(prev => ({ ...prev, [name]: source }));
    
    // Update form completion percentages
    setTimeout(() => calculateFormCompletion(), 100);
    
    // Auto-save draft after a delay
    if (!editMode) {
      // Clear any existing auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set a new timer to save the draft after 2 seconds of inactivity
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft();
      }, 2000);
    }
  };
  
  // Auto-save draft
  const saveDraft = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    
    setAutoSaving(true);
    
    try {
      // Prepare form data for submission
      const formData = {
        ...form,
        claimLines,
        biomarkers: biomarkers.filter(bm => bm.selected === true),
        status: 'DRAFT',
        id: draftId || undefined
      };
      
      // Send to API
      const res = await fetch('/api/claims/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to save draft');
      
      const data = await res.json();
      
      // Update draft ID if this is a new draft
      if (!draftId && data.id) {
        setDraftId(data.id);
      }
      
      setLastSaved(new Date());
    } catch (err: unknown) {
      console.error('Error saving draft:', err);
      // We don't show errors for auto-save to avoid disrupting the user
      // But we log detailed error information for debugging
      
      let errorDetails = 'Unknown error';
      if (err instanceof Error) {
        errorDetails = err.message;
      } else if (typeof err === 'string') {
        errorDetails = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorDetails = String(err.message);
      }
      
      console.debug('Draft save error details:', errorDetails);
    } finally {
      setAutoSaving(false);
    }
  };
  
  // Handle form cancellation
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Navigate to the claims list
      router.push('/claims');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setActiveTab('upload'); // Switch to first tab to show errors
      setError('Please fix the errors before submitting');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate total charge
      const totalCharge = claimLines.reduce((sum, line) => {
        const lineCharge = typeof line.charge === 'string' ? parseFloat(line.charge) : 
                          typeof line.charge === 'number' ? line.charge : 0;
        return sum + (isNaN(lineCharge) ? 0 : lineCharge);
      }, 0).toFixed(2);
      
      // Prepare form data for submission
      const formData = {
        ...form,
        claimLines,
        biomarkers: biomarkers.filter(bm => bm.selected === true),
        status: 'SUBMITTED',
        totalCharge,
        id: draftId || undefined
      };
      
      // Send to API
      const res = await fetch('/api/claims', {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Failed to submit claim');
      
      const result = await res.json();
      
      setSuccess('Claim submitted successfully!');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);
      } else {
        // Navigate to the claims list
        router.push('/claims');
      }
    } catch (err: unknown) {
      console.error('Error saving claim:', err);
      let errorMessage = 'Failed to save claim. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Object to track validation errors
  const validateForm = () => {
    const errors: Record<string, string[]> = {};
    
    // Validate patient information
    if (!form.patientFirstName) errors.patientFirstName = ['Patient first name is required'];
    if (!form.patientLastName) errors.patientLastName = ['Patient last name is required'];
    if (!form.patientDOB) errors.patientDOB = ['Patient date of birth is required'];
    
    // Validate provider information
    if (!form.providerName) errors.providerName = ['Provider name is required'];
    if (!form.providerNPI) errors.providerNPI = ['Provider NPI is required'];
    
    // Validate insurance information
    if (!form.insurancePlanId) errors.insurancePlanId = ['Insurance plan is required'];
    
    // Validate service information
    if (claimLines.length === 0) errors.claimLines = ['At least one service line is required'];
    
    // Check if there are any errors
    const hasErrors = Object.keys(errors).length > 0;
    
    if (hasErrors) {
      setValidationErrors(errors);
      return false;
    }
    
    return true;
  };
  
// Calculate form completion percentages
const calculateFormCompletion = () => {
  // Count filled fields in each section
  const patientFields = ['patientFirstName', 'patientLastName', 'patientDOB', 'patientGender', 'patientAddress', 'patientCity', 'patientState', 'patientZip'] as const;
  const providerFields = ['providerName', 'providerNPI', 'providerTaxId', 'providerAddress', 'providerCity', 'providerState', 'providerZip'] as const;
  const serviceFields = ['placeOfService', 'insurancePlanId', 'specimenId', 'collectionDate'] as const;
  
  // Calculate completion for each section
  const patientComplete = patientFields.filter(field => {
    const value = form[field as keyof FormData];
    return value !== undefined && value !== null && value !== '';
  }).length / patientFields.length;
  
  const providerComplete = providerFields.filter(field => {
    const value = form[field as keyof FormData];
    return value !== undefined && value !== null && value !== '';
  }).length / providerFields.length;
  
  const serviceComplete = serviceFields.filter(field => {
    const value = form[field as keyof FormData];
    return value !== undefined && value !== null && value !== '';
  }).length / serviceFields.length;
  const biomarkersComplete = biomarkers.length > 0 ? biomarkers.filter(bm => bm.selected === true).length / biomarkers.length : 0;
  const claimLinesComplete = claimLines.length > 0 ? 1 : 0;
  
  // Update completion percentages
  setFormCompletion({
    patient: Math.round(patientComplete * 100),
    provider: Math.round(providerComplete * 100),
    service: Math.round(serviceComplete * 100),
    biomarkers: Math.round(biomarkersComplete * 100),
    claimLines: Math.round(claimLinesComplete * 100),
    overall: Math.round((patientComplete + providerComplete + serviceComplete + biomarkersComplete + claimLinesComplete) / 5 * 100)
  });
};
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="upload" className="text-center">
            1. Upload PDF
          </TabsTrigger>
          <TabsTrigger value="patient" className="text-center">
            2. Patient Info
          </TabsTrigger>
          <TabsTrigger value="provider" className="text-center">
            3. Provider Info
          </TabsTrigger>
          <TabsTrigger value="service" className="text-center">
            4. Service Info
          </TabsTrigger>
          <TabsTrigger value="biomarkers" className="text-center">
            5. Biomarkers
          </TabsTrigger>
          <TabsTrigger value="review" className="text-center">
            6. Review
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* PDF Upload Section */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Lab Report PDF</CardTitle>
                <CardDescription>
                  Upload a lab report PDF to automatically extract patient, provider, and test information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PDFUploader 
                  onParseComplete={(result: ExternalPDFParseResult) => handlePdfParseComplete(result)} 
                  className="mt-4" 
                />
                
                <div className="flex justify-end mt-8">
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab('patient')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Continue Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Additional tab content sections will be added in subsequent steps */}
          <TabsContent value="patient">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>
                  Enter the patient&apos;s personal and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <Input
                        value={form.patientFirstName}
                        onChange={(e) => handleFormChange('patientFirstName', e.target.value)}
                        className={fieldSources.patientFirstName === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.patientFirstName === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <Input
                        value={form.patientLastName}
                        onChange={(e) => handleFormChange('patientLastName', e.target.value)}
                        className={fieldSources.patientLastName === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.patientLastName === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Birth</label>
                      <Input
                        type="date"
                        value={form.patientDOB}
                        onChange={(e) => handleFormChange('patientDOB', e.target.value)}
                        className={fieldSources.patientDOB === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.patientDOB === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Gender</label>
                      <Select 
                        value={form.patientGender} 
                        onValueChange={(value) => handleFormChange('patientGender', value)}
                      >
                        <SelectTrigger className={fieldSources.patientGender === 'pdf' ? 'border-green-500' : ''}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                          <SelectItem value="U">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldSources.patientGender === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <Input
                        value={form.patientAddress}
                        onChange={(e) => handleFormChange('patientAddress', e.target.value)}
                        className={fieldSources.patientAddress === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.patientAddress === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <Input
                          value={form.patientCity}
                          onChange={(e) => handleFormChange('patientCity', e.target.value)}
                          className={fieldSources.patientCity === 'pdf' ? 'border-green-500' : ''}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">State</label>
                        <Input
                          value={form.patientState}
                          onChange={(e) => handleFormChange('patientState', e.target.value)}
                          className={fieldSources.patientState === 'pdf' ? 'border-green-500' : ''}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">ZIP Code</label>
                        <Input
                          value={form.patientZip}
                          onChange={(e) => handleFormChange('patientZip', e.target.value)}
                          className={fieldSources.patientZip === 'pdf' ? 'border-green-500' : ''}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <Input
                          value={form.patientPhone}
                          onChange={(e) => handleFormChange('patientPhone', e.target.value)}
                          className={fieldSources.patientPhone === 'pdf' ? 'border-green-500' : ''}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Account Number</label>
                      <Input
                        value={form.patientAccountNum}
                        onChange={(e) => handleFormChange('patientAccountNum', e.target.value)}
                        className={fieldSources.patientAccountNum === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.patientAccountNum === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab('upload')}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab('provider')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next: Provider Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="provider">
            <Card>
              <CardHeader>
                <CardTitle>Provider Information</CardTitle>
                <CardDescription>
                  Enter the provider&apos;s information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Provider Name</label>
                      <Input
                        value={form.providerName}
                        onChange={(e) => handleFormChange('providerName', e.target.value)}
                        className={fieldSources.providerName === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.providerName === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">NPI</label>
                      <Input
                        value={form.providerNPI}
                        onChange={(e) => handleFormChange('providerNPI', e.target.value)}
                        className={fieldSources.providerNPI === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.providerNPI === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Tax ID</label>
                      <Input
                        value={form.providerTaxId}
                        onChange={(e) => handleFormChange('providerTaxId', e.target.value)}
                        className={fieldSources.providerTaxId === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.providerTaxId === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Rendering Provider NPI</label>
                      <Input
                        value={form.renderingProviderNPI}
                        onChange={(e) => handleFormChange('renderingProviderNPI', e.target.value)}
                        className={fieldSources.renderingProviderNPI === 'pdf' ? 'border-green-500' : ''}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Referring Provider NPI</label>
                      <Input
                        value={form.referringProviderNPI}
                        onChange={(e) => handleFormChange('referringProviderNPI', e.target.value)}
                        className={fieldSources.referringProviderNPI === 'pdf' ? 'border-green-500' : ''}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <Input
                        value={form.providerAddress}
                        onChange={(e) => handleFormChange('providerAddress', e.target.value)}
                        className={fieldSources.providerAddress === 'pdf' ? 'border-green-500' : ''}
                      />
                      {fieldSources.providerAddress === 'pdf' && (
                        <p className="text-xs text-green-600 mt-1">Auto-populated from PDF</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <Input
                          value={form.providerCity}
                          onChange={(e) => handleFormChange('providerCity', e.target.value)}
                          className={fieldSources.providerCity === 'pdf' ? 'border-green-500' : ''}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">State</label>
                        <Input
                          value={form.providerState}
                          onChange={(e) => handleFormChange('providerState', e.target.value)}
                          className={fieldSources.providerState === 'pdf' ? 'border-green-500' : ''}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">ZIP Code</label>
                      <Input
                        value={form.providerZip}
                        onChange={(e) => handleFormChange('providerZip', e.target.value)}
                        className={fieldSources.providerZip === 'pdf' ? 'border-green-500' : ''}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Facility NPI</label>
                      <Input
                        value={form.facilityNPI}
                        onChange={(e) => handleFormChange('facilityNPI', e.target.value)}
                        className={fieldSources.facilityNPI === 'pdf' ? 'border-green-500' : ''}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Medical Record Number</label>
                      <Input
                        value={form.medicalRecordNumber}
                        onChange={(e) => handleFormChange('medicalRecordNumber', e.target.value)}
                        className={fieldSources.medicalRecordNumber === 'pdf' ? 'border-green-500' : ''}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab('patient')}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab('service')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next: Service Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="service">
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
                <CardDescription>
                  Enter details about the healthcare services provided
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Place of Service</label>
                        <Select 
                          value={form.placeOfService} 
                          onValueChange={(value) => handleFormChange('placeOfService', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select place of service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="11">Office</SelectItem>
                            <SelectItem value="12">Home</SelectItem>
                            <SelectItem value="21">Inpatient Hospital</SelectItem>
                            <SelectItem value="22">Outpatient Hospital</SelectItem>
                            <SelectItem value="81">Independent Laboratory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Prior Authorization Number</label>
                        <Input
                          value={form.priorAuthNumber}
                          onChange={(e) => handleFormChange('priorAuthNumber', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Referral Number</label>
                        <Input
                          value={form.referralNumber}
                          onChange={(e) => handleFormChange('referralNumber', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Insurance Plan</label>
                        <Select 
                          value={form.insurancePlanId} 
                          onValueChange={(value) => handleFormChange('insurancePlanId', value)}
                          disabled={loadingPlans}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingPlans ? "Loading plans..." : "Select insurance plan"} />
                          </SelectTrigger>
                          <SelectContent>
                            {insurancePlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} ({plan.payer})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Accept Assignment</label>
                        <Select 
                          value={form.acceptAssignment === true ? "true" : "false"} 
                          onValueChange={(value) => handleFormChange('acceptAssignment', value === "true" ? true : false)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Specimen ID</label>
                          <Input
                            value={form.specimenId}
                            onChange={(e) => handleFormChange('specimenId', e.target.value)}
                            className={fieldSources.specimenId === 'pdf' ? 'border-green-500' : ''}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Collection Date</label>
                          <Input
                            type="date"
                            value={form.collectionDate}
                            onChange={(e) => handleFormChange('collectionDate', e.target.value)}
                            className={fieldSources.collectionDate === 'pdf' ? 'border-green-500' : ''}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Claim Lines</h3>
                      <Button 
                        type="button" 
                        onClick={addClaimLine}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="mr-1 h-4 w-4" /> Add Service Line
                      </Button>
                    </div>
                    
                    {claimLines.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-md">
                        <p className="text-muted-foreground">No service lines added yet. Click &quot;Add Service Line&quot; to begin.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {claimLines.map((line, index) => (
                          <div key={line.id} className="border p-4 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium">Line {index + 1}</h4>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeClaimLine(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div>
                                <label className="block text-sm font-medium mb-1">CPT Code</label>
                                <Input
                                  value={line.cptCode}
                                  onChange={(e) => {
                                    const newLines = [...claimLines];
                                    newLines[index].cptCode = e.target.value;
                                    setClaimLines(newLines);
                                  }}
                                />
                              </div>
                              <div className="mt-2">
                                <label className="block text-sm font-medium mb-1">ICD-10 Diagnosis Codes</label>
                                <Input
                                  value={Array.isArray(line.icd10Codes) ? line.icd10Codes.join(', ') : line.icd10Codes || ''}
                                  onChange={(e) => {
                                    const newLines = [...claimLines];
                                    newLines[index].icd10Codes = e.target.value;
                                    setClaimLines(newLines);
                                  }}
                                  placeholder="E.g. Z00.00, R73.03 (comma separated)"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Enter comma-separated diagnosis codes</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab('provider')}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab('biomarkers')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next: Biomarkers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="biomarkers">
            <Card>
              <CardHeader>
                <CardTitle>Biomarkers</CardTitle>
                <CardDescription>
                  Select the biomarkers to include in this claim
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {biomarkers.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-md">
                      <p className="text-muted-foreground">
                        No biomarkers detected. Upload a lab report PDF or add biomarkers manually.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab('upload')}
                        className="mt-4"
                      >
                        Return to PDF Upload
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Available Biomarkers</h3>
                        <div className="space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Explicitly set selected to true for all biomarkers
                              const newBiomarkers = biomarkers.map(bm => ({
                                ...bm,
                                selected: true
                              }));
                              setBiomarkers(newBiomarkers);
                            }}
                          >
                            Select All
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Explicitly set selected to false for all biomarkers
                              const newBiomarkers = biomarkers.map(bm => ({
                                ...bm,
                                selected: false
                              }));
                              setBiomarkers(newBiomarkers);
                            }}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left font-medium text-sm">Include</th>
                              <th className="p-2 text-left font-medium text-sm">Biomarker</th>
                              <th className="p-2 text-left font-medium text-sm">Value</th>
                              <th className="p-2 text-left font-medium text-sm">Unit</th>
                              <th className="p-2 text-left font-medium text-sm">Reference Range</th>
                              <th className="p-2 text-left font-medium text-sm">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {biomarkers.map((biomarker, index) => (
                              <tr key={biomarker.id} className={biomarker.abnormal === true ? "bg-red-50" : ""}>
                                <td className="p-2">
                                  <input
                                    type="checkbox"
                                    checked={biomarker.selected === true}
                                    onChange={() => {
                                      const newBiomarkers = [...biomarkers];
                                      newBiomarkers[index].selected = !newBiomarkers[index].selected;
                                      setBiomarkers(newBiomarkers);
                                    }}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                </td>
                                <td className="p-2">{biomarker.name}</td>
                                <td className="p-2">{typeof biomarker.value === 'number' || biomarker.value ? biomarker.value : 'N/A'}</td>
                                <td className="p-2">{biomarker.unit}</td>
                                <td className="p-2">{biomarker.referenceRange}</td>
                                <td className="p-2">
                                  {biomarker.abnormal === true ? (
                                    <span className="text-red-600 font-medium">{biomarker.status}</span>
                                  ) : (
                                    <span className="text-green-600">{biomarker.status}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">
                          Selected biomarkers will be used to generate appropriate CPT codes for billing.
                          The system will automatically map biomarkers to relevant diagnosis codes.
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveTab('service')}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={() => setActiveTab('review')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next: Review & Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>Review and Submit</CardTitle>
                <CardDescription>
                  Review claim information before submission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Patient Information</h3>
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm">{form.patientFirstName || ''} {form.patientLastName || ''}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date of Birth</p>
                        <p className="text-sm">{form.patientDOB || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Gender</p>
                        <p className="text-sm">{form.patientGender || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm">{form.patientPhone || 'Not provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm">{form.patientAddress || ''}{form.patientAddress ? ', ' : ''}{form.patientCity || ''}{form.patientCity ? ', ' : ''}{form.patientState || ''} {form.patientZip || ''}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Provider Information</h3>
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm">{form.providerName || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">NPI</p>
                        <p className="text-sm">{form.providerNPI || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Tax ID</p>
                        <p className="text-sm">{form.providerTaxId || 'Not provided'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm">{form.providerAddress || ''}{form.providerAddress ? ', ' : ''}{form.providerCity || ''}{form.providerCity ? ', ' : ''}{form.providerState || ''} {form.providerZip || ''}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Insurance Information</h3>
                    <div className="p-4 border rounded-md">
                      {/* Get selected insurance plan */}
                      {(() => {
                        const selectedPlan = insurancePlans.find(plan => plan.id === form.insurancePlanId);
                        if (!selectedPlan) {
                          return <p className="text-sm text-muted-foreground">No insurance plan selected</p>;
                        }
                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Payer</p>
                              <p className="text-sm">{selectedPlan.payerName || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Plan Type</p>
                              <p className="text-sm">{selectedPlan.planType || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Member ID</p>
                              <p className="text-sm">{selectedPlan.memberId || 'Not provided'}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Service Lines ({claimLines.length})</h3>
                    {claimLines.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left font-medium text-sm">CPT Code</th>
                              <th className="p-2 text-left font-medium text-sm">Description</th>
                              <th className="p-2 text-left font-medium text-sm">Date</th>
                              <th className="p-2 text-left font-medium text-sm">Qty</th>
                              <th className="p-2 text-left font-medium text-sm">Charge</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {claimLines.map((line) => (
                              <tr key={line.id}>
                                <td className="p-2">{line.cptCode || 'N/A'}</td>
                                <td className="p-2">{line.description || 'No description'}</td>
                                <td className="p-2">{line.dateOfService || line.serviceDate || 'Not specified'}</td>
                                <td className="p-2">{line.quantity || line.units || '1'}</td>
                                <td className="p-2">
                                  {line.charge !== undefined && line.charge !== null ? (
                                    `$${typeof line.charge === 'number' ? line.charge.toFixed(2) : line.charge}`
                                  ) : (
                                    'Not specified'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed rounded-md">
                        <p className="text-sm text-muted-foreground">No service lines added</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Selected Biomarkers ({biomarkers.filter(b => b.selected === true).length}/{biomarkers.length})</h3>
                    {biomarkers.filter(b => b.selected === true).length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted">
                            <tr>
                              <th className="p-2 text-left font-medium text-sm">Biomarker</th>
                              <th className="p-2 text-left font-medium text-sm">Value</th>
                              <th className="p-2 text-left font-medium text-sm">Unit</th>
                              <th className="p-2 text-left font-medium text-sm">Reference Range</th>
                              <th className="p-2 text-left font-medium text-sm">Category</th>
                              <th className="p-2 text-left font-medium text-sm">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {biomarkers.filter(b => b.selected === true).map((biomarker) => (
                              <tr key={biomarker.id} className={biomarker.abnormal === true ? "bg-red-50" : ""}>
                                <td className="p-2">{biomarker.name}</td>
                                <td className="p-2">{typeof biomarker.value === 'number' || biomarker.value ? biomarker.value : 'N/A'}</td>
                                <td className="p-2">{biomarker.unit}</td>
                                <td className="p-2">{biomarker.referenceRange}</td>
                                <td className="p-2">{biomarker.category}</td>
                                <td className="p-2">
                                  {biomarker.abnormal === true ? (
                                    <span className="text-red-600 font-medium">Abnormal</span>
                                  ) : (
                                    <span className="text-green-600">{biomarker.status}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 border border-dashed rounded-md">
                        <p className="text-sm text-muted-foreground">No biomarkers selected</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  
                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={saveDraft}
                      disabled={loading || autoSaving}
                    >
                      {autoSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Draft'
                      )}
                    </Button>
                    
                    <Button 
                      type="submit" 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {editMode ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editMode ? 'Update Claim' : 'Create Claim'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
      
      {/* Error and success messages */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="default" className="mt-4 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="text-xs text-gray-500 text-right mt-2">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
