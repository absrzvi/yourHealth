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
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      <h2 className="text-xl font-semibold mb-4">Uploaded Reports</h2>
      {feedback && <div className="mb-2 text-center text-sm text-blue-700">{feedback}</div>}
      {reports.length === 0 ? (
        <div className="text-gray-500">No reports uploaded yet.</div>
      ) : (
        <ul className="space-y-4">
          {reports.map(report => (
            <li key={report.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <div>
                <div className="font-medium">{report.fileName}</div>
                <div className="text-xs text-gray-500">Type: {report.type} | Uploaded: {new Date(report.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-4 items-center">
                <a href={report.filePath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                <button
                  className={`text-red-600 hover:underline disabled:opacity-50`}
                  disabled={deletingId === report.id}
                  onClick={() => handleDelete(report.id)}
                >
                  {deletingId === report.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
