"use client";
import React, { useEffect, useState } from 'react';

interface Claim {
  id: string;
  claimNumber: string;
  status: string;
  totalCharge: number;
  createdAt: string;
  updatedAt: string;
  claimLines?: any[];
  claimEvents?: any[];
  insurancePlan?: any;
  eligibilityCheck?: any;
  denialPatterns?: any[];
}

export function ClaimsList() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [insurancePlans, setInsurancePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [form, setForm] = useState({ 
    claimNumber: '', 
    totalCharge: '', 
    status: 'DRAFT',
    insurancePlanId: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [editClaimId, setEditClaimId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Claim>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [editLineId, setEditLineId] = useState<string | null>(null);
  const [editLineForm, setEditLineForm] = useState<any>({});
  const [addLineForm, setAddLineForm] = useState<any>({
    lineNumber: '',
    cptCode: '',
    description: '',
    icd10Codes: '',
    charge: '',
    units: 1,
    serviceDate: '',
  });
  const [lineLoading, setLineLoading] = useState(false);

  async function fetchClaims() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/claims');
      if (!res.ok) throw new Error('Failed to fetch claims');
      const data = await res.json();
      setClaims(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Fetch insurance plans for the dropdown
  const fetchInsurancePlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await fetch('/api/insurance-plans');
      if (!res.ok) throw new Error('Failed to fetch insurance plans');
      const data = await res.json();
      setInsurancePlans(data);
      
      // If we have plans, set the first one as default
      if (data.length > 0) {
        setForm(prev => ({ ...prev, insurancePlanId: data[0].id }));
      }
    } catch (err: any) {
      console.error('Error loading insurance plans:', err.message);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchClaims();
    fetchInsurancePlans();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimNumber: form.claimNumber,
          totalCharge: parseFloat(form.totalCharge),
          status: form.status,
          insurancePlanId: form.insurancePlanId,
        }),
      });
      if (!res.ok) throw new Error('Failed to create claim');
      setFormSuccess('Claim created successfully!');
      // Reset form but keep the selected insurance plan
      setForm(prev => ({ 
        claimNumber: '', 
        totalCharge: '', 
        status: 'DRAFT',
        insurancePlanId: prev.insurancePlanId 
      }));
      await fetchClaims();
    } catch (err: any) {
      setFormError(err.message || 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (claim: Claim) => {
    setEditClaimId(claim.id);
    setEditForm({ ...claim });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (claimId: string) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update claim');
      setEditClaimId(null);
      setEditForm({});
      await fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditClaimId(null);
    setEditForm({});
  };

  const deleteClaim = async (claimId: string) => {
    if (!window.confirm('Are you sure you want to delete this claim?')) return;
    setDeleteLoading(claimId);
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete claim');
      await fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    } finally {
      setDeleteLoading(null);
    }
  };

  const startEditLine = (line: any) => {
    setEditLineId(line.id);
    setEditLineForm({ ...line, serviceDate: line.serviceDate ? line.serviceDate.slice(0, 10) : '' });
  };

  const handleEditLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditLineForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const saveEditLine = async (claimId: string, lineId: string) => {
    setLineLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/lines/${lineId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editLineForm,
          charge: parseFloat(editLineForm.charge),
          units: parseInt(editLineForm.units, 10),
          icd10Codes: editLineForm.icd10Codes.split(',').map((c: string) => c.trim()),
          serviceDate: editLineForm.serviceDate ? new Date(editLineForm.serviceDate).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to update claim line');
      setEditLineId(null);
      setEditLineForm({});
      await fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    } finally {
      setLineLoading(false);
    }
  };

  const cancelEditLine = () => {
    setEditLineId(null);
    setEditLineForm({});
  };

  const deleteLine = async (claimId: string, lineId: string) => {
    if (!window.confirm('Are you sure you want to delete this claim line?')) return;
    setLineLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/lines/${lineId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete claim line');
      await fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    } finally {
      setLineLoading(false);
    }
  };

  const handleAddLineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddLineForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const addLine = async (claimId: string) => {
    setLineLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addLineForm,
          charge: parseFloat(addLineForm.charge),
          units: parseInt(addLineForm.units, 10),
          icd10Codes: addLineForm.icd10Codes.split(',').map((c: string) => c.trim()),
          serviceDate: addLineForm.serviceDate ? new Date(addLineForm.serviceDate).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to add claim line');
      setAddLineForm({
        lineNumber: '',
        cptCode: '',
        description: '',
        icd10Codes: '',
        charge: '',
        units: 1,
        serviceDate: '',
      });
      await fetchClaims();
    } catch (err: any) {
      alert(err.message || 'Unknown error');
    } finally {
      setLineLoading(false);
    }
  };

  if (loading) return <div>Loading claims...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Claims List</h2>
      <form onSubmit={handleFormSubmit} className="mb-8 p-4 border rounded bg-gray-50 flex flex-col gap-4 max-w-xl">
        <div>
          <label className="block font-medium mb-1">Claim Number</label>
          <input
            type="text"
            name="claimNumber"
            value={form.claimNumber}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded w-full"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Total Charge</label>
          <input
            type="number"
            name="totalCharge"
            value={form.totalCharge}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded w-full"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleFormChange}
            className="border px-2 py-1 rounded w-full"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="READY">READY</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="DENIED">DENIED</option>
            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
            <option value="PAID">PAID</option>
            <option value="APPEALED">APPEALED</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Insurance Plan <span className="text-red-600">*</span></label>
          {loadingPlans ? (
            <div className="text-gray-500 py-1">Loading plans...</div>
          ) : insurancePlans.length === 0 ? (
            <div className="text-red-600 py-1">No insurance plans available. Please add an insurance plan first.</div>
          ) : (
            <select
              name="insurancePlanId"
              value={form.insurancePlanId}
              onChange={handleFormChange}
              className="border px-2 py-1 rounded w-full"
              required
            >
              <option value="">-- Select Insurance Plan --</option>
              {insurancePlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.payerName} - {plan.planType} - Member ID: {plan.memberId}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={formLoading}
        >
          {formLoading ? 'Creating...' : 'Create Claim'}
        </button>
        {formError && <div className="text-red-600">{formError}</div>}
        {formSuccess && <div className="text-green-600">{formSuccess}</div>}
      </form>

      {claims.length === 0 ? (
        <div>No claims found.</div>
      ) : (
        <>
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr>
                <th className="border px-4 py-2">Claim #</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Total Charge</th>
                <th className="border px-4 py-2">Created At</th>
                <th className="border px-4 py-2">Updated At</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <React.Fragment key={claim.id}>
                  <tr>
                    {editClaimId === claim.id ? (
                      <>
                        <td className="border px-4 py-2"><input type="text" name="claimNumber" value={editForm.claimNumber as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" /></td>
                        <td className="border px-4 py-2">
                          <select name="status" value={editForm.status as string} onChange={handleEditChange} className="border px-2 py-1 rounded w-full">
                            <option value="DRAFT">DRAFT</option>
                            <option value="READY">READY</option>
                            <option value="SUBMITTED">SUBMITTED</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="REJECTED">REJECTED</option>
                            <option value="DENIED">DENIED</option>
                            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                            <option value="PAID">PAID</option>
                            <option value="APPEALED">APPEALED</option>
                          </select>
                        </td>
                        <td className="border px-4 py-2"><input type="number" name="totalCharge" value={editForm.totalCharge as number} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" /></td>
                        <td className="border px-4 py-2">{new Date(claim.createdAt).toLocaleDateString()}</td>
                        <td className="border px-4 py-2">{new Date(claim.updatedAt).toLocaleDateString()}</td>
                        <td className="border px-4 py-2 flex gap-2">
                          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => saveEdit(claim.id)} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                          <button className="bg-gray-400 text-white px-3 py-1 rounded" onClick={cancelEdit}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border px-4 py-2">{claim.claimNumber}</td>
                        <td className="border px-4 py-2">{claim.status}</td>
                        <td className="border px-4 py-2">${claim.totalCharge.toFixed(2)}</td>
                        <td className="border px-4 py-2">{new Date(claim.createdAt).toLocaleDateString()}</td>
                        <td className="border px-4 py-2">{new Date(claim.updatedAt).toLocaleDateString()}</td>
                        <td className="border px-4 py-2 flex gap-2">
                          <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => startEdit(claim)}>Edit</button>
                          <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => deleteClaim(claim.id)} disabled={deleteLoading === claim.id}>{deleteLoading === claim.id ? 'Deleting...' : 'Delete'}</button>
                        </td>
                      </>
                    )}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {selectedClaim && (
            <div className="mt-8 p-6 border rounded bg-gray-50">
              <h3 className="text-xl font-semibold mb-2">Claim Details</h3>
              <div><strong>Claim #:</strong> {selectedClaim.claimNumber}</div>
              <div><strong>Status:</strong> {selectedClaim.status}</div>
              <div><strong>Total Charge:</strong> ${selectedClaim.totalCharge.toFixed(2)}</div>
              <div><strong>Created At:</strong> {new Date(selectedClaim.createdAt).toLocaleString()}</div>
              <div><strong>Updated At:</strong> {new Date(selectedClaim.updatedAt).toLocaleString()}</div>

              {selectedClaim.claimLines && (
                <div className="mt-4">
                  <strong>Claim Lines:</strong>
                  <table className="min-w-full border mt-2">
                    <thead>
                      <tr>
                        <th className="border px-2 py-1">Line #</th>
                        <th className="border px-2 py-1">CPT Code</th>
                        <th className="border px-2 py-1">Description</th>
                        <th className="border px-2 py-1">ICD-10 Codes</th>
                        <th className="border px-2 py-1">Charge</th>
                        <th className="border px-2 py-1">Units</th>
                        <th className="border px-2 py-1">Service Date</th>
                        <th className="border px-2 py-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClaim.claimLines.map((line: any) => (
                        <React.Fragment key={line.id}>
                          <tr>
                            {editLineId === line.id ? (
                              <>
                                <td className="border px-2 py-1"><input type="number" name="lineNumber" value={editLineForm.lineNumber} onChange={handleEditLineChange} className="border px-1 py-1 rounded w-full" /></td>
                                <td className="border px-2 py-1"><input type="text" name="cptCode" value={editLineForm.cptCode} onChange={handleEditLineChange} className="border px-1 py-1 rounded w-full" /></td>
                                <td className="border px-2 py-1"><input type="text" name="description" value={editLineForm.description} onChange={handleEditLineChange} className="border px-1 py-1 rounded w-full" /></td>
                                <td className="border px-2 py-1"><input type="text" name="icd10Codes" value={editLineForm.icd10Codes} onChange={handleEditLineChange} className="border px-1 py-1 rounded w-full" placeholder="Comma separated" /></td>
                                <td className="border px-2 py-1"><input type="number" name="charge" value={editLineForm.charge} onChange={handleEditLineChange} className="border px-1 py-1 rounded w-full" /></td>
                                <td className="border px-2 py-1"><input type="number" name="units" value={editLineForm.units} onChange={handleEditLineChange} className="border px-1 py-1 rounded w-full" /></td>
                                <td className="border px-2 py-1"><input type="date" name="serviceDate" value={editLineForm.serviceDate} onChange={handleEditLineChange} className="border px-1 py-1 rounded w-full" /></td>
                                <td className="border px-2 py-1 flex gap-2">
                                  <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => saveEditLine(selectedClaim.id, line.id)} disabled={lineLoading}>{lineLoading ? 'Saving...' : 'Save'}</button>
                                  <button className="bg-gray-400 text-white px-2 py-1 rounded" onClick={cancelEditLine}>Cancel</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="border px-2 py-1">{line.lineNumber}</td>
                                <td className="border px-2 py-1">{line.cptCode}</td>
                                <td className="border px-2 py-1">{line.description}</td>
                                <td className="border px-2 py-1">{Array.isArray(line.icd10Codes) ? line.icd10Codes.join(', ') : line.icd10Codes}</td>
                                <td className="border px-2 py-1">${line.charge.toFixed(2)}</td>
                                <td className="border px-2 py-1">{line.units}</td>
                                <td className="border px-2 py-1">{line.serviceDate ? new Date(line.serviceDate).toLocaleDateString() : ''}</td>
                                <td className="border px-2 py-1 flex gap-2">
                                  <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => startEditLine(line)}>Edit</button>
                                  <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => deleteLine(selectedClaim.id, line.id)} disabled={lineLoading}>Delete</button>
                                </td>
                              </>
                            )}
                          </tr>
                        </React.Fragment>
                      ))}
                      <tr>
                        <td className="border px-2 py-1"><input type="number" name="lineNumber" value={addLineForm.lineNumber} onChange={handleAddLineChange} className="border px-1 py-1 rounded w-full" /></td>
                        <td className="border px-2 py-1"><input type="text" name="cptCode" value={addLineForm.cptCode} onChange={handleAddLineChange} className="border px-1 py-1 rounded w-full" /></td>
                        <td className="border px-2 py-1"><input type="text" name="description" value={addLineForm.description} onChange={handleAddLineChange} className="border px-1 py-1 rounded w-full" /></td>
                        <td className="border px-2 py-1"><input type="text" name="icd10Codes" value={addLineForm.icd10Codes} onChange={handleAddLineChange} className="border px-1 py-1 rounded w-full" placeholder="Comma separated" /></td>
                        <td className="border px-2 py-1"><input type="number" name="charge" value={addLineForm.charge} onChange={handleAddLineChange} className="border px-1 py-1 rounded w-full" /></td>
                        <td className="border px-2 py-1"><input type="number" name="units" value={addLineForm.units} onChange={handleAddLineChange} className="border px-1 py-1 rounded w-full" /></td>
                        <td className="border px-2 py-1"><input type="date" name="serviceDate" value={addLineForm.serviceDate} onChange={handleAddLineChange} className="border px-1 py-1 rounded w-full" /></td>
                        <td className="border px-2 py-1 flex gap-2">
                          <button className="bg-green-600 text-white px-2 py-1 rounded" onClick={() => addLine(selectedClaim.id)} disabled={lineLoading}>Add</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {selectedClaim.claimEvents && selectedClaim.claimEvents.length > 0 && (
                <div className="mt-4">
                  <strong>Claim Events:</strong>
                  <ul className="list-disc ml-6">
                    {selectedClaim.claimEvents.map((event, idx) => (
                      <li key={idx}>{JSON.stringify(event)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedClaim.insurancePlan && (
                <div className="mt-4">
                  <strong>Insurance Plan:</strong> {JSON.stringify(selectedClaim.insurancePlan)}
                </div>
              )}

              {selectedClaim.eligibilityCheck && (
                <div className="mt-4">
                  <strong>Eligibility Check:</strong>
                  <div>{JSON.stringify(selectedClaim.eligibilityCheck)}</div>
                </div>
              )}

              {selectedClaim.denialPatterns && selectedClaim.denialPatterns.length > 0 && (
                <div className="mt-4">
                  <strong>Denial Patterns:</strong>
                  <ul className="list-disc ml-6">
                    {selectedClaim.denialPatterns.map((pattern, idx) => (
                      <li key={idx}>{JSON.stringify(pattern)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 