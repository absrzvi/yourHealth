"use client";
import { useRef, useState } from "react";
import { useSession } from "next-auth/react";

export default function DataSourcesPage() {
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [reportType, setReportType] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setUploading(true);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage("Please select a file");
      setUploading(false);
      return;
    }
    if (!reportType) {
      setMessage("Please select a report type");
      setUploading(false);
      return;
    }
    // Use the real userId from session
    if (!session || !session.user || !session.user.id) {
      setMessage("You must be logged in to upload a report.");
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", session.user.id);
    formData.append("type", reportType);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) setMessage("Upload successful!");
    else setMessage(`Upload failed: ${data.error}`);
    setUploading(false);
  };

  if (status === "loading") return <div className="text-center py-12">Loading session...</div>;
  if (!session || !session.user) return <div className="text-center py-12 text-red-600">You must be logged in to upload health reports.</div>;

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Data Sources</h1>
      <p className="mb-4 text-gray-700">Connect your health data. For now, you can manually upload health reports. Future: Apple Health, Oura, and more!</p>
      <div className="widget-card mb-8">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>📁</div>
          <div className="card-title">Upload Health Report</div>
        </div>
        <form onSubmit={handleUpload} className="flex flex-col space-y-4 w-full">
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          >
            <option value="" disabled>Select report type</option>
            <option value="blood">Blood test report</option>
            <option value="dna">DNA Report</option>
            <option value="microbiome">Microbiome Report</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.txt,.json,.xml,.xlsx,.xls"
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Report"}
          </button>
          {message && <div className="text-center text-sm mt-2">{message}</div>}
        </form>
      </div>
      <div className="content-section active">
        <h2 className="text-2xl font-bold mb-4">Data Sources</h2>
        <div className="dashboard-layout">
          {/* Integration Cards */}
          <div className="widget-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>🍏</div>
              <div className="card-title">Apple Health</div>
            </div>
            <div className="text-gray-500 mb-2">Integration coming soon.</div>
            <button disabled className="bg-gray-300 text-gray-600 py-1 px-3 rounded cursor-not-allowed">Connect</button>
          </div>
          <div className="widget-card">
            <div className="card-header">
              <div className="card-icon" style={{ background: '#fef3c7', color: '#b45309' }}>💍</div>
              <div className="card-title">Oura Ring</div>
            </div>
            <div className="text-gray-500 mb-2">Integration coming soon.</div>
            <button disabled className="bg-gray-300 text-gray-600 py-1 px-3 rounded cursor-not-allowed">Connect</button>
          </div>
        </div>
        {/* Upload Section Placeholder */}
        <div className="widget-card mt-8">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>📁</div>
            <div className="card-title">Upload Health Report</div>
          </div>
          <div className="text-gray-500">Placeholder for upload functionality.</div>
        </div>
        {/* Connected Sources List Placeholder */}
        <div className="widget-card mt-8">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>🔗</div>
            <div className="card-title">Connected Sources</div>
          </div>
          <div className="text-gray-500">No sources connected yet.</div>
        </div>
      </div>
    </div>
  );
}
