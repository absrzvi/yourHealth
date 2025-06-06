"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  ClipboardList,
  RefreshCcw,
  Search,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

// Interfaces for the component
interface EligibilityRequest {
  patientFirstName: string;
  patientLastName: string;
  patientDOB: string;
  patientId?: string;
  insurancePlanId?: string;
  serviceDate?: string;
  forceRefresh?: boolean;
}

interface EligibilityResult {
  status: string;
  timestamp: string;
  serviceDate?: string;
  patientInfo: {
    firstName: string;
    lastName: string;
    dob: string;
    memberId?: string;
  };
  planInfo: {
    planName: string;
    planId: string;
    payerId?: string;
    effectiveDate?: string;
    termDate?: string;
  };
  coverageInfo?: {
    active: boolean;
    coverageType?: string;
    network?: string;
    copay?: number;
    coinsurance?: number;
    deductible?: {
      individual: number;
      family: number;
      remaining: number;
    };
    outOfPocket?: {
      individual: number;
      family: number;
      remaining: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

interface Claim {
  id: string;
  claimNumber: string;
  status: string;
  totalCharge: number;
  patientName: string;
  serviceDate: string;
  insurancePlan?: {
    payerName: string;
    planType: string;
  };
  ediFileLocation?: string;
}

interface ClaimStats {
  total: number;
  draft: number;
  submitted: number;
  processing: number;
  approved: number;
  denied: number;
  paid: number;
}

export function ClaimsToolsPanel() {
  // Eligibility check state
  const [eligReq, setEligReq] = useState<EligibilityRequest>({
    patientFirstName: "",
    patientLastName: "",
    patientDOB: "",
    patientId: "",
    insurancePlanId: "",
    serviceDate: "",
    forceRefresh: false,
  });
  const [eligResult, setEligResult] = useState<EligibilityResult | null>(null);
  const [eligLoading, setEligLoading] = useState(false);
  const [eligError, setEligError] = useState<string | null>(null);
  const [showEligDialog, setShowEligDialog] = useState(false);

  // Claims state
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimStats, setClaimStats] = useState<ClaimStats>({
    total: 0,
    draft: 0,
    submitted: 0,
    processing: 0,
    approved: 0,
    denied: 0,
    paid: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // EDI generation state
  const [ediClaims, setEdiClaims] = useState<Claim[]>([]);
  const [ediLoading, setEdiLoading] = useState(false);
  const [ediError, setEdiError] = useState<string | null>(null);
  const [generatingEdi, setGeneratingEdi] = useState<string | null>(null);
  const [downloadingEdi, setDownloadingEdi] = useState<string | null>(null);

  // Effect hooks
  useEffect(() => {
    fetchClaimStats();
  }, []);

  const fetchClaimStats = async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const response = await fetch("/api/claims/stats");
      if (!response.ok) throw new Error("Failed to fetch claim statistics");
      const data = await response.json();
      setClaimStats(data);
    } catch (error) {
      console.error("Error fetching claim stats:", error);
      setStatsError("Failed to load claim statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchClaimsForEdi = async () => {
    setEdiLoading(true);
    setEdiError(null);
    try {
      const response = await fetch("/api/claims?status=READY,SUBMITTED");
      if (!response.ok) throw new Error("Failed to fetch claims");
      const data = await response.json();
      setEdiClaims(data);
    } catch (error) {
      console.error("Error fetching claims:", error);
      setEdiError("Failed to load claims for EDI generation");
    } finally {
      setEdiLoading(false);
    }
  };

  // Eligibility handlers
  const checkEligibility = async () => {
    setEligLoading(true);
    setEligError(null);
    setEligResult(null);

    try {
      const response = await fetch("/api/claims/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eligReq),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Eligibility check failed");
      }

      const result = await response.json();
      setEligResult(result);
      setShowEligDialog(true);
    } catch (error) {
      console.error("Eligibility check error:", error);
      setEligError(error instanceof Error ? error.message : "Failed to check eligibility");
    } finally {
      setEligLoading(false);
    }
  };

  const resetEligibilityForm = () => {
    setEligReq({
      patientFirstName: "",
      patientLastName: "",
      patientDOB: "",
      patientId: "",
      insurancePlanId: "",
      serviceDate: "",
      forceRefresh: false,
    });
    setEligResult(null);
    setEligError(null);
  };

  // EDI handlers
  const generateEdi = async (claimId: string) => {
    setGeneratingEdi(claimId);
    try {
      const response = await fetch("/api/claims/generate-edi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "EDI generation failed");
      }

      const result = await response.json();
      
      // Refresh claims list
      await fetchClaimsForEdi();
      
      // Show success message
      alert(`EDI file generated successfully: ${result.fileName}`);
    } catch (error) {
      console.error("EDI generation error:", error);
      alert(error instanceof Error ? error.message : "Failed to generate EDI");
    } finally {
      setGeneratingEdi(null);
    }
  };

  const downloadEdi = async (claimId: string, fileName: string) => {
    setDownloadingEdi(claimId);
    try {
      // Log the download event
      await fetch("/api/claims/log-edi-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, fileName }),
      });

      // Download the file
      const response = await fetch(`/api/claims/download-edi/${claimId}`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("EDI download error:", error);
      alert("Failed to download EDI file");
    } finally {
      setDownloadingEdi(null);
    }
  };

  // Render functions for tabs
  const renderManagementTab = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Claims Overview</h3>
          <Button
            onClick={fetchClaimStats}
            disabled={statsLoading}
            size="sm"
            variant="outline"
          >
            {statsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {statsError ? (
          <div className="text-red-600 text-sm">{statsError}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <div className="text-2xl font-bold">{claimStats.total}</div>
              <div className="text-sm text-gray-600">Total Claims</div>
            </div>
            <div className="bg-blue-50 rounded p-4">
              <div className="text-2xl font-bold text-blue-600">{claimStats.submitted}</div>
              <div className="text-sm text-gray-600">Submitted</div>
            </div>
            <div className="bg-green-50 rounded p-4">
              <div className="text-2xl font-bold text-green-600">{claimStats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="bg-red-50 rounded p-4">
              <div className="text-2xl font-bold text-red-600">{claimStats.denied}</div>
              <div className="text-sm text-gray-600">Denied</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link href="/claims/new">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Claim
            </Button>
          </Link>
          <Link href="/claims">
            <Button variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              View All Claims
            </Button>
          </Link>
          <Link href="/insurance">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Manage Insurance
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  const renderEligibilityTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Check Insurance Eligibility</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Patient First Name</label>
            <Input
              value={eligReq.patientFirstName}
              onChange={(e) => setEligReq({ ...eligReq, patientFirstName: e.target.value })}
              placeholder="John"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Patient Last Name</label>
            <Input
              value={eligReq.patientLastName}
              onChange={(e) => setEligReq({ ...eligReq, patientLastName: e.target.value })}
              placeholder="Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Date of Birth</label>
            <Input
              type="date"
              value={eligReq.patientDOB}
              onChange={(e) => setEligReq({ ...eligReq, patientDOB: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Member ID (Optional)</label>
            <Input
              value={eligReq.patientId}
              onChange={(e) => setEligReq({ ...eligReq, patientId: e.target.value })}
              placeholder="ABC123456"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Insurance Plan ID (Optional)</label>
            <Input
              value={eligReq.insurancePlanId}
              onChange={(e) => setEligReq({ ...eligReq, insurancePlanId: e.target.value })}
              placeholder="Plan ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Service Date (Optional)</label>
            <Input
              type="date"
              value={eligReq.serviceDate}
              onChange={(e) => setEligReq({ ...eligReq, serviceDate: e.target.value })}
            />
          </div>
        </div>

        {eligError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {eligError}
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <Button
            onClick={checkEligibility}
            disabled={eligLoading || !eligReq.patientFirstName || !eligReq.patientLastName || !eligReq.patientDOB}
          >
            {eligLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Checking...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Check Eligibility
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={resetEligibilityForm}>
            Reset Form
          </Button>
        </div>
      </div>

      {/* Eligibility Result Dialog */}
      <Dialog open={showEligDialog} onOpenChange={setShowEligDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Eligibility Check Results</DialogTitle>
          </DialogHeader>
          
          {eligResult && (
            <div className="space-y-4">
              {/* Patient Information */}
              <div className="bg-gray-50 rounded p-4">
                <h4 className="font-semibold mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Name: {eligResult.patientInfo.firstName} {eligResult.patientInfo.lastName}</div>
                  <div>DOB: {eligResult.patientInfo.dob}</div>
                  {eligResult.patientInfo.memberId && (
                    <div>Member ID: {eligResult.patientInfo.memberId}</div>
                  )}
                </div>
              </div>

              {/* Plan Information */}
              <div className="bg-gray-50 rounded p-4">
                <h4 className="font-semibold mb-2">Plan Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Plan: {eligResult.planInfo.planName}</div>
                  <div>Plan ID: {eligResult.planInfo.planId}</div>
                  {eligResult.planInfo.payerId && (
                    <div>Payer ID: {eligResult.planInfo.payerId}</div>
                  )}
                  {eligResult.planInfo.effectiveDate && (
                    <div>Effective: {new Date(eligResult.planInfo.effectiveDate).toLocaleDateString()}</div>
                  )}
                </div>
              </div>

              {/* Coverage Information */}
              {eligResult.coverageInfo && (
                <div className="bg-gray-50 rounded p-4">
                  <h4 className="font-semibold mb-2">Coverage Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className={`font-semibold ${eligResult.coverageInfo.active ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {eligResult.coverageInfo.active ? 'Active' : 'Inactive'}
                    </div>
                    {eligResult.coverageInfo.coverageType && (
                      <div>Coverage Type: {eligResult.coverageInfo.coverageType}</div>
                    )}
                    {eligResult.coverageInfo.network && (
                      <div>Network: {eligResult.coverageInfo.network}</div>
                    )}
                    {eligResult.coverageInfo.copay !== undefined && (
                      <div>Copay: ${eligResult.coverageInfo.copay}</div>
                    )}
                    {eligResult.coverageInfo.coinsurance !== undefined && (
                      <div>Coinsurance: {eligResult.coverageInfo.coinsurance}%</div>
                    )}
                    
                    {eligResult.coverageInfo.deductible && (
                      <div className="mt-2">
                        <div className="font-semibold">Deductible:</div>
                        <div className="ml-4">
                          Individual: ${eligResult.coverageInfo.deductible.individual} 
                          (Remaining: ${eligResult.coverageInfo.deductible.remaining})
                        </div>
                        <div className="ml-4">
                          Family: ${eligResult.coverageInfo.deductible.family}
                        </div>
                      </div>
                    )}
                    
                    {eligResult.coverageInfo.outOfPocket && (
                      <div className="mt-2">
                        <div className="font-semibold">Out of Pocket Maximum:</div>
                        <div className="ml-4">
                          Individual: ${eligResult.coverageInfo.outOfPocket.individual} 
                          (Remaining: ${eligResult.coverageInfo.outOfPocket.remaining})
                        </div>
                        <div className="ml-4">
                          Family: ${eligResult.coverageInfo.outOfPocket.family}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Information */}
              {eligResult.error && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="font-semibold text-red-700 mb-2">Error</h4>
                  <div className="text-sm text-red-600">
                    <div>Code: {eligResult.error.code}</div>
                    <div>Message: {eligResult.error.message}</div>
                    {eligResult.error.details && (
                      <div className="mt-2">Details: {eligResult.error.details}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-sm text-gray-500">
                Checked at: {new Date(eligResult.timestamp).toLocaleString()}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowEligDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderEdiTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">EDI File Generation</h3>
          <Button
            onClick={fetchClaimsForEdi}
            disabled={ediLoading}
            size="sm"
            variant="outline"
          >
            {ediLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {ediError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {ediError}
          </div>
        )}

        {ediLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : ediClaims.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No claims ready for EDI generation. Claims must be in READY or SUBMITTED status.
          </div>
        ) : (
          <div className="space-y-4">
            {ediClaims.map((claim) => (
              <div key={claim.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{claim.claimNumber}</div>
                    <div className="text-sm text-gray-600">
                      Patient: {claim.patientName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Service Date: {new Date(claim.serviceDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Amount: ${claim.totalCharge.toFixed(2)}
                    </div>
                    {claim.insurancePlan && (
                      <div className="text-sm text-gray-600">
                        Insurance: {claim.insurancePlan.payerName} ({claim.insurancePlan.planType})
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!claim.ediFileLocation ? (
                      <Button
                        size="sm"
                        onClick={() => generateEdi(claim.id)}
                        disabled={generatingEdi === claim.id}
                      >
                        {generatingEdi === claim.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate EDI
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadEdi(claim.id, claim.ediFileLocation!)}
                        disabled={downloadingEdi === claim.id}
                      >
                        {downloadingEdi === claim.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download EDI
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                
                {claim.ediFileLocation && (
                  <div className="mt-2 text-sm text-green-600">
                    EDI file generated: {claim.ediFileLocation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Main component return
  return (
    <Tabs defaultValue="management" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="management">Claims Management</TabsTrigger>
        <TabsTrigger value="eligibility">Eligibility Verification</TabsTrigger>
        <TabsTrigger value="edi">EDI Generation</TabsTrigger>
      </TabsList>
      
      <TabsContent value="management">
        {renderManagementTab()}
      </TabsContent>
      
      <TabsContent value="eligibility">
        {renderEligibilityTab()}
      </TabsContent>
      
      <TabsContent value="edi">
        {renderEdiTab()}
      </TabsContent>
    </Tabs>
  );
}
