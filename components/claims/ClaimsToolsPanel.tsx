"use client";
import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";

// Utility types
interface EligibilityRequest {
  patientId?: string;
  insurancePlanId: string;
  serviceCode?: string;
  serviceDate?: string;
  forceRefresh?: boolean;
}

interface EligibilityErrorDetail {
  code: string;
  message: string;
  details?: string;
}

interface CoverageDetail {
  planName?: string;
  networkStatus?: string;
  coinsurance?: number;
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
}

interface PlanInfo {
  payerName?: string;
  planType?: string;
  effectiveDate?: string;
  termDate?: string;
}

interface EligibilityResult {
  isEligible: boolean;
  coverage?: CoverageDetail;
  planInfo?: PlanInfo;
  serviceDate?: string;
  timestamp?: string;
  error?: EligibilityErrorDetail;
}

interface Claim {
  id: string;
  patientName: string;
  status: string;
}

export function ClaimsToolsPanel() {
  // Eligibility tab state
  const [eligReq, setEligReq] = useState<EligibilityRequest>({
    patientId: "",
    insurancePlanId: "",
    serviceCode: "",
    serviceDate: "",
    forceRefresh: false
  });
  const [eligResult, setEligResult] = useState<EligibilityResult | null>(null);
  const [eligLoading, setEligLoading] = useState(false);
  const [eligError, setEligError] = useState("");
  const [eligDialogOpen, setEligDialogOpen] = useState(false);

  // EDI tab state
  const [claims, setClaims] = useState<Claim[]>([]);
  const [ediLoading, setEdiLoading] = useState<string | null>(null);
  const [ediError, setEdiError] = useState<string | null>(null);
  const [ediDownloadFile, setEdiDownloadFile] = useState<{ [claimId: string]: string }>({});

  // Fetch eligible claims on mount for EDI tab
  React.useEffect(() => {
    fetch("/api/claims?status=READY_FOR_EDI")
      .then((r) => r.json())
      .then((data) => setClaims(data.claims || []))
      .catch(() => setClaims([]));
  }, []);

  // Handlers
  const handleEligibilityCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setEligLoading(true);
    setEligResult(null);
    setEligError("");
    setEligDialogOpen(true);
    
    // Create payload - only include properties with values
    const payload: EligibilityRequest = { insurancePlanId: eligReq.insurancePlanId };
    if (eligReq.patientId) payload.patientId = eligReq.patientId;
    if (eligReq.serviceCode) payload.serviceCode = eligReq.serviceCode;
    if (eligReq.serviceDate) payload.serviceDate = eligReq.serviceDate;
    if (eligReq.forceRefresh) payload.forceRefresh = eligReq.forceRefresh;
    
    try {
      const res = await fetch("/api/claims/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error((data.error && data.error.message) || "Eligibility check failed");
      }
      
      setEligResult(data);
    } catch (err: any) {
      setEligError(err.message || "Unknown error");
    } finally {
      setEligLoading(false);
    }
  };

  const handleEdiGenerate = async (claimId: string) => {
    setEdiLoading(claimId);
    setEdiError(null);
    try {
      const res = await fetch("/api/claims/generate-edi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate EDI");
      }
      if (!data.fileName) {
        throw new Error("No EDI file name returned");
      }
      setEdiDownloadFile((prev) => ({ ...prev, [claimId]: data.fileName }));
    } catch (err: any) {
      setEdiError(err.message || "Unknown error");
    } finally {
      setEdiLoading(null);
    }
  };

  const handleEdiDownload = async (claimId: string) => {
    const fileName = ediDownloadFile[claimId];
    if (!fileName) return;
    try {
      // Audit log
      await fetch("/api/claims/log-edi-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, fileName }),
      });
    } catch (err) {
      // Optionally show a toast or error, but don't block download
    }
    window.location.href = `/api/claims/download-edi/${encodeURIComponent(fileName)}`;
  };

  return (
    <div className="mt-10">
      <Tabs defaultValue="eligibility" className="w-full max-w-2xl mx-auto">
        <TabsList className="mb-6">
          <TabsTrigger value="eligibility">Eligibility Checker</TabsTrigger>
          <TabsTrigger value="edi">EDI Generator</TabsTrigger>
        </TabsList>
        <TabsContent value="eligibility">
          <form onSubmit={handleEligibilityCheck} className="space-y-4 bg-muted rounded-xl p-6">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium mb-1">Patient ID</label>
              <Input id="patientId" value={eligReq.patientId || ""} onChange={e => setEligReq(r => ({ ...r, patientId: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="insurancePlanId" className="block text-sm font-medium mb-1">Insurance Plan ID</label>
              <Input id="insurancePlanId" value={eligReq.insurancePlanId} onChange={e => setEligReq(r => ({ ...r, insurancePlanId: e.target.value }))} required />
            </div>
            <div>
              <label htmlFor="serviceCode" className="block text-sm font-medium mb-1">Service Code (optional)</label>
              <Input id="serviceCode" value={eligReq.serviceCode || ""} onChange={e => setEligReq(r => ({ ...r, serviceCode: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="serviceDate" className="block text-sm font-medium mb-1">Service Date (optional)</label>
              <Input id="serviceDate" type="date" value={eligReq.serviceDate || ""} onChange={e => setEligReq(r => ({ ...r, serviceDate: e.target.value }))} />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={eligReq.forceRefresh || false}
                  onChange={e => setEligReq(r => ({ ...r, forceRefresh: e.target.checked }))} 
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Force refresh (bypass cache)</span>
              </label>
            </div>
            <Button type="submit" disabled={eligLoading || !eligReq.insurancePlanId}>
              {eligLoading ? "Checking..." : "Check Eligibility"}
            </Button>
            
            {eligError && <div className="mt-2 text-red-600">{eligError}</div>}
          </form>
          
          {/* Eligibility Check Results Dialog */}
          <Dialog open={eligDialogOpen} onOpenChange={setEligDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Eligibility Check Results</DialogTitle>
              </DialogHeader>
              
              {eligLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner className="h-8 w-8" />
                  <p className="ml-2">Checking eligibility...</p>
                </div>
              ) : eligResult ? (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    <Badge variant={eligResult.isEligible ? "default" : "destructive"}
                      className={eligResult.isEligible ? "bg-green-500 hover:bg-green-500/80 text-white" : ""}
                    >
                      {eligResult.isEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                    </Badge>
                  </div>
                  
                  {/* Coverage */}
                  {eligResult.coverage && (
                    <div>
                      <h4 className="font-semibold mb-2">Coverage Details</h4>
                      <div className="space-y-2">
                        {eligResult.coverage.planName && <p><strong>Plan:</strong> {eligResult.coverage.planName}</p>}
                        {eligResult.coverage.networkStatus && <p><strong>Network:</strong> {eligResult.coverage.networkStatus}</p>}
                        {typeof eligResult.coverage.coinsurance === 'number' && <p><strong>Coinsurance:</strong> {eligResult.coverage.coinsurance}%</p>}
                        {typeof eligResult.coverage.deductible === 'number' && <p><strong>Deductible:</strong> ${eligResult.coverage.deductible.toFixed(2)}</p>}
                        {typeof eligResult.coverage.deductibleMet === 'number' && <p><strong>Deductible Met:</strong> ${eligResult.coverage.deductibleMet.toFixed(2)}</p>}
                        {typeof eligResult.coverage.outOfPocketMax === 'number' && <p><strong>Out-of-Pocket Max:</strong> ${eligResult.coverage.outOfPocketMax.toFixed(2)}</p>}
                        {typeof eligResult.coverage.outOfPocketMet === 'number' && <p><strong>Out-of-Pocket Met:</strong> ${eligResult.coverage.outOfPocketMet.toFixed(2)}</p>}
                      </div>
                    </div>
                  )}
                  
                  {/* Plan Info */}
                  {eligResult.planInfo && (
                    <div>
                      <h4 className="font-semibold mb-2">Plan Information</h4>
                      <div className="space-y-1">
                        {eligResult.planInfo.payerName && <p><strong>Payer:</strong> {eligResult.planInfo.payerName}</p>}
                        {eligResult.planInfo.planType && <p><strong>Plan Type:</strong> {eligResult.planInfo.planType}</p>}
                        {eligResult.planInfo.effectiveDate && <p><strong>Effective:</strong> {new Date(eligResult.planInfo.effectiveDate).toLocaleDateString()}</p>}
                        {eligResult.planInfo.termDate && <p><strong>Term Date:</strong> {new Date(eligResult.planInfo.termDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  )}
                  
                  {/* Service Date */}
                  {eligResult.serviceDate && (
                    <p><strong>Service Date:</strong> {new Date(eligResult.serviceDate).toLocaleDateString()}</p>
                  )}
                  
                  {/* Errors */}
                  {eligResult.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      <h4 className="font-semibold">Error: {eligResult.error.code}</h4>
                      <p>{eligResult.error.message}</p>
                      {eligResult.error.details && <p className="text-sm">{eligResult.error.details}</p>}
                    </div>
                  )}
                  
                  {/* Last Checked */}
                  {eligResult.timestamp && (
                    <p className="text-xs text-gray-500 mt-4">Last checked: {new Date(eligResult.timestamp).toLocaleString()}</p>
                  )}
                </div>
              ) : (
                <p className="text-center py-4">No eligibility data available</p>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="edi">
          <div className="space-y-6 bg-muted rounded-xl p-6">
            <h3 className="text-lg font-semibold">Claims Ready for EDI</h3>
            {claims.length === 0 && <div>No claims available for EDI generation.</div>}
            <ul className="divide-y">
              {claims.map(claim => (
                <li key={claim.id} className="py-3 flex items-center justify-between">
                  <span>
                    <span className="font-medium">{claim.patientName}</span> (ID: {claim.id})<br />
                    <span className="text-xs text-gray-500">Status: {claim.status}</span>
                  </span>
                  <span>
                    {ediDownloadFile[claim.id] ? (
                      <Button onClick={() => handleEdiDownload(claim.id)} className="btn btn-primary">
                        Download EDI
                      </Button>
                    ) : (
                      <Button disabled={ediLoading === claim.id} onClick={() => handleEdiGenerate(claim.id)}>
                        {ediLoading === claim.id ? "Generating..." : "Generate EDI"}
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {ediError && <div className="text-red-600">{ediError}</div>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
