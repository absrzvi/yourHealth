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
      <form onSubmit={handleUpload} className="flex flex-col space-y-4 bg-white p-6 rounded shadow">
        <select
          value={reportType}
          onChange={e => setReportType(e.target.value)}
          className="border p-2 rounded"
          required
        >
          <option value="" disabled>Select report type</option>
          <option value="blood">Blood test report</option>
          <option value="dna">DNA Report</option>
          <option value="microbiome">Microbiome Report</option>
        </select>
        <input ref={fileInputRef} type="file" accept=".pdf,.csv,.txt,.json,.xml,.xlsx,.xls" className="border p-2 rounded" required />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded disabled:opacity-50" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Report"}
        </button>
        {message && <div className="text-center text-sm mt-2">{message}</div>}
      </form>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Integrations</h2>
        <div className="flex gap-4">
          <div className="flex-1 bg-gray-100 rounded p-4 flex flex-col items-center border border-gray-200">
            <span className="text-2xl mb-2">🍏</span>
            <div className="font-semibold mb-1">Apple Health</div>
            <div className="text-xs text-gray-500 mb-2">Coming Soon</div>
            <button disabled className="bg-gray-300 text-gray-600 py-1 px-3 rounded cursor-not-allowed">Connect</button>
          </div>
          <div className="flex-1 bg-gray-100 rounded p-4 flex flex-col items-center border border-gray-200">
            <span className="text-2xl mb-2">💍</span>
            <div className="font-semibold mb-1">Oura Ring</div>
            <div className="text-xs text-gray-500 mb-2">Coming Soon</div>
            <button disabled className="bg-gray-300 text-gray-600 py-1 px-3 rounded cursor-not-allowed">Connect</button>
          </div>
        </div>
      </div>
    </div>
  );
}
