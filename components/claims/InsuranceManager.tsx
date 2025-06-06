"use client";
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Spinner } from "../ui/spinner";

interface InsurancePlan {
  id: string;
  payerName: string;
  payerId: string;
  memberId: string;
  groupNumber?: string;
  planType: string;
  isPrimary: boolean;
  isActive: boolean;
  effectiveDate: string;
  termDate?: string;
  createdAt: string;
  updatedAt: string;
  claims?: any[];
}

export function InsuranceManager() {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    payerName: '',
    payerId: '',
    memberId: '',
    groupNumber: '',
    planType: 'PPO',
    isPrimary: true,
    isActive: true,
    effectiveDate: '',
    termDate: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InsurancePlan>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [eligibilityDialogOpen, setEligibilityDialogOpen] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/insurance');
      if (!res.ok) throw new Error('Failed to fetch insurance plans');
      const data = await res.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          effectiveDate: form.effectiveDate ? new Date(form.effectiveDate).toISOString() : null,
          termDate: form.termDate ? new Date(form.termDate).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create insurance plan');
      setFormSuccess('Insurance plan created successfully!');
      setForm({
        payerName: '',
        payerId: '',
        memberId: '',
        groupNumber: '',
        planType: 'PPO',
        isPrimary: true,
        isActive: true,
        effectiveDate: '',
        termDate: '',
      });
      await fetchPlans();
    } catch (err: any) {
      setFormError(err.message || 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const checkEligibility = async (planId: string) => {
    setEligibilityLoading(true);
    setEligibilityResult(null);
    setEligibilityDialogOpen(true);
    
    try {
      const response = await fetch('/api/claims/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insurancePlanId: planId }),
      });
      const data = await response.json();
      setEligibilityResult(data);
    } catch (error: any) {
      setEligibilityResult({
        isEligible: false,
        error: {
          code: 'REQUEST_FAILED',
          message: error.message || 'An unexpected error occurred'
        }
      });
    } finally {
      setEligibilityLoading(false);
    }
  };

  const startEdit = (plan: InsurancePlan) => {
    setEditPlanId(plan.id);
    setEditForm({ ...plan, effectiveDate: plan.effectiveDate.slice(0, 10), termDate: plan.termDate ? plan.termDate.slice(0, 10) : '' });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const saveEdit = async (planId: string) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/insurance/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          effectiveDate: editForm.effectiveDate ? new Date(editForm.effectiveDate).toISOString() : null,
          termDate: editForm.termDate ? new Date(editForm.termDate).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update insurance plan');
      setEditPlanId(null);
      setEditForm({});
      await fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditPlanId(null);
    setEditForm({});
  };

  const deletePlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this insurance plan?')) return;
    setDeleteLoading(planId);
    try {
      const res = await fetch(`/api/insurance/${planId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete insurance plan');
      await fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleExpand = (planId: string) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  };

  if (loading) return <div>Loading insurance plans...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  // Format coverage information for display
  const formatCoverage = (coverage: any) => {
    if (!coverage) return 'No coverage data available';
    
    return (
      <React.Fragment>
        <div className="space-y-2">
          {coverage.planName && <p><strong>Plan:</strong> {coverage.planName}</p>}
          {coverage.networkStatus && <p><strong>Network:</strong> {coverage.networkStatus}</p>}
          {coverage.coinsurance && <p><strong>Coinsurance:</strong> {coverage.coinsurance}%</p>}
          {typeof coverage.deductible === 'number' && <p><strong>Deductible:</strong> ${coverage.deductible.toFixed(2)}</p>}
          {typeof coverage.deductibleMet === 'number' && <p><strong>Deductible Met:</strong> ${coverage.deductibleMet.toFixed(2)}</p>}
          {typeof coverage.outOfPocketMax === 'number' && <p><strong>Out-of-Pocket Max:</strong> ${coverage.outOfPocketMax.toFixed(2)}</p>}
          {typeof coverage.outOfPocketMet === 'number' && <p><strong>Out-of-Pocket Met:</strong> ${coverage.outOfPocketMet.toFixed(2)}</p>}
        </div>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Insurance Plans</h2>
        <form onSubmit={handleFormSubmit} className="mb-8 p-4 border rounded bg-gray-50 flex flex-col gap-4 max-w-xl">
          <div>
            <label className="block font-medium mb-1">Payer Name</label>
            <input
              type="text"
              name="payerName"
              value={form.payerName}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Payer ID</label>
            <input
              type="text"
              name="payerId"
              value={form.payerId}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Member ID</label>
            <input
              type="text"
              name="memberId"
              value={form.memberId}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Group Number</label>
            <input
              type="text"
              name="groupNumber"
              value={form.groupNumber}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-full"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Plan Type</label>
            <select
              name="planType"
              value={form.planType}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-full"
            >
              <option value="PPO">PPO</option>
              <option value="HMO">HMO</option>
              <option value="EPO">EPO</option>
              <option value="POS">POS</option>
            </select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isPrimary"
                checked={form.isPrimary}
                onChange={handleFormChange}
              />
              Primary
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleFormChange}
              />
              Active
            </label>
          </div>
          <div>
            <label className="block font-medium mb-1">Effective Date</label>
            <input
              type="date"
              name="effectiveDate"
              value={form.effectiveDate}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Term Date</label>
            <input
              type="date"
              name="termDate"
              value={form.termDate}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-full"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={formLoading}
          >
            {formLoading ? 'Creating...' : 'Add Insurance Plan'}
          </button>
          {formError && <div className="text-red-600">{formError}</div>}
          {formSuccess && <div className="text-green-600">{formSuccess}</div>}
        </form>
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr>
              <th className="border px-4 py-2">Payer Name</th>
              <th className="border px-4 py-2">Payer ID</th>
              <th className="border px-4 py-2">Member ID</th>
              <th className="border px-4 py-2">Group #</th>
              <th className="border px-4 py-2">Plan Type</th>
              <th className="border px-4 py-2">Primary?</th>
              <th className="border px-4 py-2">Active?</th>
              <th className="border px-4 py-2">Effective Date</th>
              <th className="border px-4 py-2">Term Date</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <React.Fragment key={plan.id}>
                <tr>
                  {editPlanId === plan.id ? (
                    <>
                      <td className="border px-4 py-2"><input type="text" name="payerName" value={editForm.payerName as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" /></td>
                      <td className="border px-4 py-2"><input type="text" name="payerId" value={editForm.payerId as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" /></td>
                      <td className="border px-4 py-2"><input type="text" name="memberId" value={editForm.memberId as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" /></td>
                      <td className="border px-4 py-2"><input type="text" name="groupNumber" value={editForm.groupNumber as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" /></td>
                      <td className="border px-4 py-2">
                        <select name="planType" value={editForm.planType as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full">
                          <option value="PPO">PPO</option>
                          <option value="HMO">HMO</option>
                          <option value="EPO">EPO</option>
                          <option value="POS">POS</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2"><input type="checkbox" name="isPrimary" checked={!!editForm.isPrimary} onChange={handleEditChange} /></td>
                      <td className="border px-4 py-2"><input type="checkbox" name="isActive" checked={!!editForm.isActive} onChange={handleEditChange} /></td>
                      <td className="border px-4 py-2"><input type="date" name="effectiveDate" value={editForm.effectiveDate as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" /></td>
                      <td className="border px-4 py-2"><input type="date" name="termDate" value={editForm.termDate as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" /></td>
                      <td className="border px-4 py-2 flex gap-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => saveEdit(plan.id)} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                        <button className="bg-gray-400 text-white px-3 py-1 rounded" onClick={cancelEdit}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="border px-4 py-2">{plan.payerName}</td>
                      <td className="border px-4 py-2">{plan.payerId}</td>
                      <td className="border px-4 py-2">{plan.memberId}</td>
                      <td className="border px-4 py-2">{plan.groupNumber || '-'}</td>
                      <td className="border px-4 py-2">{plan.planType}</td>
                      <td className="border px-4 py-2">{plan.isPrimary ? 'Yes' : 'No'}</td>
                      <td className="border px-4 py-2">{plan.isActive ? 'Yes' : 'No'}</td>
                      <td className="border px-4 py-2">{new Date(plan.effectiveDate).toLocaleDateString()}</td>
                      <td className="border px-4 py-2">{plan.termDate ? new Date(plan.termDate).toLocaleDateString() : '-'}</td>
                      <td className="border px-4 py-2 flex gap-2">
                        <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => startEdit(plan)}>Edit</button>
                        <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => deletePlan(plan.id)} disabled={deleteLoading === plan.id}>{deleteLoading === plan.id ? 'Deleting...' : 'Delete'}</button>
                        <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700" onClick={() => checkEligibility(plan.id)}>Check Eligibility</button>
                        <button
                          className="bg-blue-500 text-white px-3 py-1 rounded"
                          onClick={() => toggleExpand(plan.id)}
                        >
                          {expandedPlanId === plan.id ? 'Hide Claims' : 'Show Claims'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
                {expandedPlanId === plan.id && plan.claims && plan.claims.length > 0 && (
                  <tr>
                    <td colSpan={10} className="bg-blue-50 px-4 py-2">
                      <div>
                        <strong>Linked Claims:</strong>
                        <table className="min-w-full border mt-2">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1">Claim #</th>
                              <th className="border px-2 py-1">Status</th>
                              <th className="border px-2 py-1">Total Charge</th>
                              <th className="border px-2 py-1">Created At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {plan.claims.map((claim: any) => (
                              <tr key={claim.id}>
                                <td className="border px-2 py-1">{claim.claimNumber}</td>
                                <td className="border px-2 py-1">{claim.status}</td>
                                <td className="border px-2 py-1">${claim.totalCharge.toFixed(2)}</td>
                                <td className="border px-2 py-1">{new Date(claim.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Eligibility Check Results Dialog */}
      <Dialog open={eligibilityDialogOpen} onOpenChange={setEligibilityDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Eligibility Check Results</DialogTitle>
          <DialogDescription>
            {eligibilityLoading ? 'Checking eligibility status...' : 'Results from insurance verification'}
          </DialogDescription>
        </DialogHeader>
        
        {eligibilityLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8" />
            <p className="ml-2">Checking eligibility...</p>
          </div>
        ) : eligibilityResult ? (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              <Badge variant={eligibilityResult.isEligible ? "default" : "destructive"} 
                className={eligibilityResult.isEligible ? "bg-green-500 hover:bg-green-500/80 text-white" : ""}
              >
                {eligibilityResult.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
              </Badge>
            </div>
            
            {/* Coverage */}
            {eligibilityResult.coverage && (
              <div>
                <h4 className="font-semibold mb-2">Coverage Details</h4>
                {formatCoverage(eligibilityResult.coverage)}
              </div>
            )}
            
            {/* Plan Info */}
            {eligibilityResult.planInfo && (
              <div>
                <h4 className="font-semibold mb-2">Plan Information</h4>
                <div className="space-y-1">
                  {eligibilityResult.planInfo.payerName && <p><strong>Payer:</strong> {eligibilityResult.planInfo.payerName}</p>}
                  {eligibilityResult.planInfo.planType && <p><strong>Plan Type:</strong> {eligibilityResult.planInfo.planType}</p>}
                  {eligibilityResult.planInfo.effectiveDate && <p><strong>Effective:</strong> {new Date(eligibilityResult.planInfo.effectiveDate).toLocaleDateString()}</p>}
                  {eligibilityResult.planInfo.termDate && <p><strong>Term Date:</strong> {new Date(eligibilityResult.planInfo.termDate).toLocaleDateString()}</p>}
                </div>
              </div>
            )}
            
            {/* Service Date */}
            {eligibilityResult.serviceDate && (
              <p><strong>Service Date:</strong> {new Date(eligibilityResult.serviceDate).toLocaleDateString()}</p>
            )}
            
            {/* Errors */}
            {eligibilityResult.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <h4 className="font-semibold">Error: {eligibilityResult.error.code}</h4>
                <p>{eligibilityResult.error.message}</p>
                {eligibilityResult.error.details && <p className="text-sm">{eligibilityResult.error.details}</p>}
              </div>
            )}
            
            {/* Last Checked */}
            {eligibilityResult.timestamp && (
              <p className="text-xs text-gray-500 mt-4">Last checked: {new Date(eligibilityResult.timestamp).toLocaleString()}</p>
            )}
          </div>
        ) : (
          <p className="text-center py-4">No eligibility data available</p>
        )}
      </DialogContent>
      </Dialog>
    </React.Fragment>
  );
} 