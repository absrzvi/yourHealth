"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus } from "lucide-react";
import { BloodReportList } from "@/components/blood-reports/BloodReportList";
import { BloodTestReport, BloodBiomarker } from "@prisma/client";

interface PaginatedResponse {
  data: (BloodTestReport & {
    biomarkers: Pick<BloodBiomarker, "id" | "name" | "value" | "unit" | "isAbnormal" | "category">[];
  })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function BloodReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentStatus, setCurrentStatus] = useState("ACTIVE");

  // Fetch blood reports
  const fetchReports = async (page = 1, status = "ACTIVE") => {
    setLoading(true);
    setError(null);

    try {
      const statusParam = status === "ALL" ? "" : `&status=${status}`;
      const res = await fetch(`/api/blood-reports?page=${page}&limit=5${statusParam}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch blood reports");
      }

      const data = await res.json();
      setReports(data);
      setCurrentPage(page);
      setCurrentStatus(status);
    } catch (err) {
      console.error("Error fetching blood reports:", err);
      setError("An error occurred while fetching your blood reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load reports on initial page load
  useEffect(() => {
    fetchReports();
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchReports(page, currentStatus);
  };

  // Handle status change
  const handleStatusChange = (status: string) => {
    fetchReports(1, status);
  };

  // View a specific report
  const handleViewReport = (reportId: string) => {
    router.push(`/blood-reports/${reportId}`);
  };

  // View trends for a report's biomarkers
  const handleViewTrends = (reportId: string) => {
    router.push(`/blood-reports/${reportId}/trends`);
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blood Reports</h1>
        <Button onClick={() => router.push("/blood-reports/upload")}>
          <Plus className="h-4 w-4 mr-2" />
          Upload New Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports" className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && !reports ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <BloodReportList
              initialData={reports || undefined}
              onPageChange={handlePageChange}
              onStatusChange={handleStatusChange}
              onViewReport={handleViewReport}
              onViewTrends={handleViewTrends}
              isLoading={loading}
            />
          )}
        </TabsContent>
        
        <TabsContent value="trends" className="mt-6">
          <div className="flex flex-col items-center justify-center p-10 border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Biomarker Trends</h3>
            <p className="text-muted-foreground text-center mb-4">
              Select a blood report to view trends for specific biomarkers over time.
            </p>
            <Button variant="outline" onClick={() => setActiveTab("reports")}>
              Select a Report
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
