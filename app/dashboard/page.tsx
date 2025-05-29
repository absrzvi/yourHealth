"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
    <div className="content-section active">
      <div className="dashboard-layout">
        {/* Quick Metrics Widget */}
        <div className="widget-card">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>⚡</div>
            <div className="card-title">Quick Metrics</div>
          </div>
          <div className="metric-item"><span className="metric-label">Energy</span><span className="metric-value">68</span></div>
          <div className="metric-item"><span className="metric-label">Inflammation</span><span className="metric-value">Low</span></div>
          <div className="metric-item"><span className="metric-label">Sleep</span><span className="metric-value">7.2h</span></div>
        </div>
        {/* Chart Placeholder */}
        <div className="widget-card">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>📈</div>
            <div className="card-title">Charts</div>
          </div>
          <div className="mini-chart">[Chart Placeholder]</div>
        </div>
        {/* Insights Placeholder */}
        <div className="widget-card">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>💡</div>
            <div className="card-title">Insights</div>
          </div>
          <div className="insight-list">
            <div className="insight-item">
              <div className="insight-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>🧬</div>
              <div className="insight-text">Placeholder for personalized health insights.</div>
            </div>
            <div className="insight-item">
              <div className="insight-icon" style={{ background: '#fef3c7', color: '#b45309' }}>🩸</div>
              <div className="insight-text">Another insight placeholder.</div>
            </div>
          </div>
        </div>
        {/* Uploaded Reports List */}
        <div className="widget-card mt-8">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>📄</div>
            <div className="card-title">Uploaded Reports</div>
          </div>
          {feedback && <div className="text-green-700 text-sm mb-2">{feedback}</div>}
          {reports.length === 0 ? (
            <div className="text-gray-500">No reports uploaded yet.</div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2">File Name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Uploaded</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id} className="border-b">
                      <td className="px-3 py-2">{report.fileName}</td>
                      <td className="px-3 py-2">{report.type}</td>
                      <td className="px-3 py-2">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <a href={report.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-3">Download</a>
                        <button
                          className={`text-red-600 hover:underline ${deletingId === report.id ? 'opacity-50 pointer-events-none' : ''}`}
                          onClick={() => handleDelete(report.id)}
                          disabled={deletingId === report.id}
                        >
                          {deletingId === report.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
