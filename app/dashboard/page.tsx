"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FileText, Upload, Loader2, Trash2, RefreshCw } from "lucide-react";
import { format, subDays } from "date-fns";

import { AIWelcome } from "@/components/dashboard/AIWelcome";
import { HealthMetrics } from "@/components/dashboard/HealthMetrics";
import { DataVisualization } from "@/components/dashboard/DataVisualization";
import { PredictiveInsights } from "@/components/dashboard/PredictiveInsights";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface Report {
  id: string;
  fileName: string;
  filePath: string;
  type: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const handleRefresh = () => {
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date()
    });
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/reports?userId=${session.user.id}`)
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
        setLoading(false);
      });
  }, [session]);

  if (status === "loading" || loading) return <div className="text-center py-12">Loading dashboard...</div>;
  if (!session || !session.user) return <div className="text-center py-12 text-red-600">You must be logged in to view your dashboard.</div>;

  const handleDelete = async (id: string) => {
    if (!session?.user?.id) return;
    if (!window.confirm("Are you sure you want to delete this report? This cannot be undone.")) return;
    setDeletingId(id);
    setFeedback("");
    try {
      const res = await fetch(`/api/reports?userId=${session.user.id}&id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setReports(r => r.filter(rep => rep.id !== id));
        setFeedback("Report deleted successfully.");
      } else {
        setFeedback(data.error || "Failed to delete report.");
      }
    } catch (e) {
      setFeedback("Failed to delete report.");
    }
    setDeletingId(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 bg-background text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <DateRangePicker
            date={dateRange}
            setDate={setDateRange}
            className="w-[300px]"
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            aria-label="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <AIWelcome userName={session?.user?.name || 'there'} />
        <HealthMetrics dateRange={dateRange} />
        <DataVisualization dateRange={dateRange} />
        <PredictiveInsights dateRange={dateRange} />
      </div>

      <section className="mt-12">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold">Your Health Reports</CardTitle>
              <Button variant="outline" size="sm" className="gap-1">
                <Upload className="h-4 w-4" />
                Upload New Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {feedback && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                feedback.includes('success') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {feedback}
              </div>
            )}
            
            {reports.length === 0 && !loading ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No reports uploaded yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload your blood test results to track your health metrics over time.
                </p>
                <Button className="mt-4" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Report
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(report => (
                  <div 
                    key={report.id} 
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{report.fileName}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>Type: {report.type}</span>
                          <span>•</span>
                          <span>Uploaded: {new Date(report.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="text-primary hover:underline cursor-pointer">View Details</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(report.id)}
                      disabled={deletingId === report.id}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      {deletingId === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
