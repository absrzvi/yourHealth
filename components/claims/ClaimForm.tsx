"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from 'next/navigation';
import { ClaimStatus } from '@prisma/client';
import { Loader2 } from 'lucide-react';

interface InsurancePlan {
  id: string;
  payerName: string;
  memberId: string;
  planType: string;
}

interface ClaimFormProps {
  editMode?: boolean;
  initialData?: any;
  onSuccess?: (claim: any) => void;
  onCancel?: () => void;
}

export function ClaimForm({ editMode = false, initialData, onSuccess, onCancel }: ClaimFormProps) {
  const router = useRouter();
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    claimNumber: '',
    totalCharge: '',
    status: 'DRAFT',
    insurancePlanId: '',
    serviceDate: new Date().toISOString().split('T')[0], // Current date as default
    patientName: '',
    providerName: '',
  });

  // Initialize claim lines management
  const [claimLines, setClaimLines] = useState<any[]>([]);
  const [currentLine, setCurrentLine] = useState({
    lineNumber: 1,
    cptCode: '',
    description: '',
    icd10Codes: '',
    charge: '',
    units: 1,
    serviceDate: new Date().toISOString().split('T')[0],
    modifier: ''
  });

  // Load insurance plans on component mount
  useEffect(() => {
    fetchInsurancePlans();
    
    // If in edit mode and initialData is provided, set form data
    if (editMode && initialData) {
      setForm({
        claimNumber: initialData.claimNumber || '',
        totalCharge: initialData.totalCharge?.toString() || '',
        status: initialData.status || 'DRAFT',
        insurancePlanId: initialData.insurancePlanId || '',
        serviceDate: initialData.serviceDate ? new Date(initialData.serviceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        patientName: initialData.patientName || '',
        providerName: initialData.providerName || '',
      });

      // If claim has lines, load them
      if (initialData.claimLines && Array.isArray(initialData.claimLines)) {
        setClaimLines(initialData.claimLines.map((line: any) => ({
          ...line,
          serviceDate: new Date(line.serviceDate).toISOString().split('T')[0],
          icd10Codes: Array.isArray(line.icd10Codes) ? line.icd10Codes.join(',') : line.icd10Codes
        })));
      }
    }
  }, [editMode, initialData]);

  // Fetch available insurance plans
  const fetchInsurancePlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch('/api/insurance-plans');
      if (!res.ok) throw new Error('Failed to fetch insurance plans');
      const data = await res.json();
      setInsurancePlans(data);
      
      // If we have plans and not in edit mode, set the first one as default
      if (data.length > 0 && !editMode) {
        setForm(prev => ({ ...prev, insurancePlanId: data[0].id }));
      }
    } catch (err: any) {
      console.error('Error loading insurance plans:', err.message);
      setError('Failed to load insurance plans. Please try again.');
    } finally {
      setLoadingPlans(false);
    }
  };

  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle claim line field changes
  const handleLineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentLine(prev => ({ ...prev, [name]: value }));
  };

  // Add a new claim line
  const addClaimLine = () => {
    // Format ICD-10 codes as array
    const formattedLine = {
      ...currentLine,
      icd10Codes: currentLine.icd10Codes.split(',').map(code => code.trim()),
      charge: parseFloat(currentLine.charge),
      units: parseInt(currentLine.units.toString(), 10),
    };
    
    setClaimLines(prev => [...prev, formattedLine]);
    
    // Reset line form for next entry with incremented line number
    setCurrentLine(prev => ({
      ...prev,
      lineNumber: prev.lineNumber + 1,
      cptCode: '',
      description: '',
      icd10Codes: '',
      charge: '',
      modifier: ''
    }));
  };

  // Remove a claim line
  const removeClaimLine = (index: number) => {
    setClaimLines(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate total charge from claim lines
  useEffect(() => {
    if (claimLines.length > 0) {
      const total = claimLines.reduce((sum, line) => {
        return sum + (parseFloat(line.charge) * parseInt(line.units.toString(), 10));
      }, 0);
      setForm(prev => ({ ...prev, totalCharge: total.toFixed(2) }));
    }
  }, [claimLines]);

  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      const requiredFields = ['claimNumber', 'totalCharge', 'insurancePlanId'];
      const missingFields = requiredFields.filter(field => !form[field as keyof typeof form]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Validate claim lines
      if (claimLines.length === 0) {
        throw new Error('At least one claim line is required');
      }
      
      // Create claim data object
      const claimData = {
        ...form,
        totalCharge: parseFloat(form.totalCharge),
        claimLines: claimLines
      };
      
      // Determine if we're creating or updating a claim
      const url = editMode 
        ? `/api/claims/${initialData.id}` 
        : '/api/claims';
      
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(claimData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save claim');
      }
      
      const savedClaim = await response.json();
      
      setSuccess(`Claim ${editMode ? 'updated' : 'created'} successfully`);
      
      // If onSuccess callback provided, call it with the saved claim
      if (onSuccess) {
        onSuccess(savedClaim);
      } else {
        // Otherwise, redirect to claims list after short delay
        setTimeout(() => {
          router.push('/claims');
          router.refresh();
        }, 1500);
      }
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Claim form error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel form submission
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/claims');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">{editMode ? 'Edit Claim' : 'Create New Claim'}</h2>
      
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Claim Number</label>
            <Input
              name="claimNumber"
              value={form.claimNumber}
              onChange={handleFormChange}
              placeholder="e.g. CLM12345"
              className="w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Insurance Plan</label>
            {loadingPlans ? (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading plans...</span>
              </div>
            ) : (
              <select
                name="insurancePlanId"
                value={form.insurancePlanId}
                onChange={handleFormChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select Insurance Plan</option>
                {insurancePlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.payerName} - {plan.planType} (ID: {plan.memberId})
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Patient Name</label>
            <Input
              name="patientName"
              value={form.patientName}
              onChange={handleFormChange}
              placeholder="Full patient name"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Provider Name</label>
            <Input
              name="providerName"
              value={form.providerName}
              onChange={handleFormChange}
              placeholder="Provider name"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Service Date</label>
            <Input
              type="date"
              name="serviceDate"
              value={form.serviceDate}
              onChange={handleFormChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleFormChange}
              className="w-full p-2 border rounded-md"
            >
              {Object.values(ClaimStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Total Charge</label>
            <Input
              type="number"
              step="0.01"
              name="totalCharge"
              value={form.totalCharge}
              onChange={handleFormChange}
              placeholder="0.00"
              className="w-full"
              readOnly={claimLines.length > 0}
              required
            />
            {claimLines.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Total calculated from claim lines
              </p>
            )}
          </div>
        </div>
        
        <hr className="my-6" />
        
        <h3 className="text-xl font-semibold mb-4">Claim Lines</h3>
        
        {claimLines.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">Line #</th>
                  <th className="p-2 border">CPT Code</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">ICD-10 Codes</th>
                  <th className="p-2 border">Charge</th>
                  <th className="p-2 border">Units</th>
                  <th className="p-2 border">Service Date</th>
                  <th className="p-2 border">Modifier</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claimLines.map((line, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2 border">{line.lineNumber}</td>
                    <td className="p-2 border">{line.cptCode}</td>
                    <td className="p-2 border">{line.description}</td>
                    <td className="p-2 border">{Array.isArray(line.icd10Codes) ? line.icd10Codes.join(', ') : line.icd10Codes}</td>
                    <td className="p-2 border">${parseFloat(line.charge).toFixed(2)}</td>
                    <td className="p-2 border">{line.units}</td>
                    <td className="p-2 border">{line.serviceDate}</td>
                    <td className="p-2 border">{line.modifier || '-'}</td>
                    <td className="p-2 border">
                      <button 
                        type="button" 
                        onClick={() => removeClaimLine(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-md font-medium mb-3">Add Claim Line</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Line Number</label>
              <Input
                type="number"
                name="lineNumber"
                value={currentLine.lineNumber}
                onChange={handleLineChange}
                className="w-full"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">CPT Code</label>
              <Input
                name="cptCode"
                value={currentLine.cptCode}
                onChange={handleLineChange}
                placeholder="e.g. 99213"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <Input
                name="description"
                value={currentLine.description}
                onChange={handleLineChange}
                placeholder="Service description"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">ICD-10 Codes (comma separated)</label>
              <Input
                name="icd10Codes"
                value={currentLine.icd10Codes}
                onChange={handleLineChange}
                placeholder="e.g. J45.909, R05"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">Charge</label>
              <Input
                type="number"
                step="0.01"
                name="charge"
                value={currentLine.charge}
                onChange={handleLineChange}
                placeholder="0.00"
                className="w-full"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">Units</label>
              <Input
                type="number"
                name="units"
                value={currentLine.units}
                onChange={handleLineChange}
                className="w-full"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">Service Date</label>
              <Input
                type="date"
                name="serviceDate"
                value={currentLine.serviceDate}
                onChange={handleLineChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1">Modifier (optional)</label>
              <Input
                name="modifier"
                value={currentLine.modifier}
                onChange={handleLineChange}
                placeholder="e.g. 25"
                className="w-full"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                type="button"
                onClick={addClaimLine}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!currentLine.cptCode || !currentLine.charge}
              >
                Add Line
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4 mt-8">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
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
      </form>
    </div>
  );
}
