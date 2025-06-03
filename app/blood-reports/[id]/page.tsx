"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Trash } from "lucide-react";
import { BloodReportDetail } from "@/components/blood-reports/BloodReportDetail";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BloodReportPageProps {
  params: {
    id: string;
  };
}

export default function BloodReportPage({ params }: BloodReportPageProps) {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch blood report data
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/blood-reports/${params.id}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Blood report not found");
          } else if (res.status === 401) {
            throw new Error("Unauthorized access");
          } else {
            throw new Error("Failed to fetch blood report");
          }
        }

        const data = await res.json();
        setReport(data.data);
      } catch (err) {
        console.error("Error fetching blood report:", err);
        setError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  // Handle report edit
  const handleEdit = (reportId: string) => {
    router.push(`/blood-reports/${reportId}/edit`);
  };

  // Handle report delete
  const handleDelete = async () => {
    setDeleting(true);
    
    try {
      const res = await fetch(`/api/blood-reports/${params.id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete blood report");
      }
      
      setDeleteDialogOpen(false);
      router.push("/blood-reports");
    } catch (err) {
      console.error("Error deleting blood report:", err);
      setError(`Failed to delete report: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeleting(false);
    }
  };

  // Handle viewing a specific version
  const handleViewVersion = (versionId: string) => {
    router.push(`/blood-reports/${versionId}`);
  };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/blood-reports")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <h1 className="text-3xl font-bold">Blood Report Details</h1>
        </div>
        
        {report && (
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Report
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <BloodReportDetail
          report={report}
          onEdit={handleEdit}
          onDelete={() => setDeleteDialogOpen(true)}
          onViewVersion={handleViewVersion}
        />
      ) : !error ? (
        <Alert>
          <AlertDescription>No report data available.</AlertDescription>
        </Alert>
      ) : null}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blood Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this blood report? This action will mark the report as deleted but will preserve the data for historical records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
