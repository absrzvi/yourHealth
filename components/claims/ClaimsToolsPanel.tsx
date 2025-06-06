"use client";
import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Utility types
interface EligibilityRequest {
  patientId: string;
  insurancePlanId: string;
  serviceCode: string;
}

interface EligibilityResult {
  eligible: boolean;
  details: string;
  error?: string;
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
  });
  const [eligResult, setEligResult] = useState<EligibilityResult | null>(null);
  const [eligLoading, setEligLoading] = useState(false);
  const [eligError, setEligError] = useState("");

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
    try {
      const res = await fetch("/api/claims/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eligReq),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eligibility check failed");
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
              <Input id="patientId" value={eligReq.patientId} onChange={e => setEligReq(r => ({ ...r, patientId: e.target.value }))} required />
            </div>
            <div>
              <label htmlFor="insurancePlanId" className="block text-sm font-medium mb-1">Insurance Plan ID</label>
              <Input id="insurancePlanId" value={eligReq.insurancePlanId} onChange={e => setEligReq(r => ({ ...r, insurancePlanId: e.target.value }))} required />
            </div>
            <div>
              <label htmlFor="serviceCode" className="block text-sm font-medium mb-1">Service Code</label>
              <Input id="serviceCode" value={eligReq.serviceCode} onChange={e => setEligReq(r => ({ ...r, serviceCode: e.target.value }))} required />
            </div>
            <Button type="submit" disabled={eligLoading}>
              {eligLoading ? "Checking..." : "Check Eligibility"}
            </Button>
            {eligResult && (
              <div className={`mt-4 p-4 rounded ${eligResult.eligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <strong>{eligResult.eligible ? "Eligible" : "Not Eligible"}</strong>
                <div>{eligResult.details}</div>
              </div>
            )}
            {eligError && <div className="mt-2 text-red-600">{eligError}</div>}
          </form>
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
