"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";


import { AIWelcome } from "../../components/dashboard/AIWelcome";
import { HealthMetrics } from "../../components/dashboard/HealthMetrics";
import { DataVisualization } from "../../components/dashboard/DataVisualization";
import { PredictiveInsights } from "../../components/dashboard/PredictiveInsights";

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
      <AIWelcome userName={session?.user?.name} />
      <HealthMetrics />
      <DataVisualization />
      <PredictiveInsights />

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-6 text-neutral-700 font-montserrat">Your Reports</h2>
        {feedback && (
          <p className={`mb-4 p-3 rounded-md ${feedback.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {feedback}
          </p>
        )}
        {reports.length === 0 && !loading && (
          <p className="text-muted-foreground">You don't have any reports yet. Upload your blood test results to get started!</p>
        )}
        {reports.length > 0 && (
          <div className="space-y-4">
            {reports.map(report => (
              <div key={report.id} className="bg-card p-4 rounded-lg shadow-md border border-border flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{report.fileName}</h3>
                  <p className="text-sm text-muted-foreground">Type: {report.type} - Uploaded: {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDelete(report.id)}
                  disabled={deletingId === report.id}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 transition-colors ml-4"
                >
                  {deletingId === report.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
