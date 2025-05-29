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
    if (!session || !session.user) {
      setMessage("You must be logged in to upload a report.");
      setUploading(false);
      return;
    }

    // File type validation
    const allowedTypes: Record<string, string[]> = {
      blood: ["text/csv", "text/plain"],
      dna: ["text/plain"],
      microbiome: ["application/json"],
      hormone: ["application/json"],
      pdf: ["application/pdf"],
      image: ["image/jpeg", "image/png", "image/jpg", "image/heic", "image/heif"]
    };
    const currentAllowed = allowedTypes[reportType] || [];
    if (!currentAllowed.includes(file.type)) {
      setMessage(
        reportType === 'pdf' ? "Please upload a valid PDF file." :
        reportType === 'image' ? "Please upload a valid image file (JPG, PNG, HEIC, HEIF)." :
        reportType === 'blood' ? "Please upload a CSV or TXT file." :
        reportType === 'dna' ? "Please upload a TXT file." :
        reportType === 'microbiome' || reportType === 'hormone' ? "Please upload a JSON file." :
        "Unsupported file type."
      );
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", reportType);
    try {
      // Route to OCR endpoint for PDF/image, else to reports/upload
      const uploadUrl = (reportType === 'pdf' || reportType === 'image')
        ? "/api/ocr-upload"
        : "/api/reports/upload";
      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) setMessage("Upload successful!");
      else if (data && data.error) setMessage(data.error);
      else setMessage('Upload failed: Unknown error');
    } catch (err: any) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };


  if (status === "loading") {
    return <div className="text-center py-12">Loading session...</div>;
  }

  if (!session || !session.user) {
    return <div className="text-center py-12 text-red-600">You must be logged in to upload health reports.</div>;
  }

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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Report Type</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value)}
              className="w-full border border-blue-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
              required
            >
              <option value="" disabled>Select report type</option>
              <option value="pdf">Lab Report (PDF for OCR)</option>
              <option value="image">Lab Report (Image for OCR)</option>
            </select>
            {reportType && (
              <p className="text-xs text-blue-700 mt-1">
                {reportType === 'pdf' && 'Upload any lab report in PDF format. We use advanced AI to extract your results.'}
                {reportType === 'image' && 'Upload a photo or scan of your lab report (JPG/PNG/HEIC/HEIF).'}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-700">
              {reportType === 'pdf' ? 'Lab Report (PDF)' : 'Lab Report (Image)'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept={
                reportType === 'pdf' ? '.pdf' :
                reportType === 'image' ? '.jpg,.jpeg,.png,.heic,.heif' : ''
              }
              className="w-full border border-blue-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className={`bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-2 rounded-lg transition-all shadow-md disabled:opacity-50 ${uploading ? 'animate-pulse' : ''}`}
            disabled={uploading}
          >
            {uploading ? (
              <span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Uploading...</span>
            ) : "Upload Lab Report"}
          </button>
          {message && <div className={`text-center text-sm mt-2 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>}
        </form>
        
        
      </div>

      {/* Integration Cards */}
      <div className="content-section">
        <h2 className="text-2xl font-bold mb-4">Data Sources</h2>
        <div className="dashboard-layout">
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
        
        {/* Uploaded Reports List */}
        <div className="widget-card mt-8">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>📄</div>
            <div className="card-title">Uploaded Reports</div>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2">File Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2">Example-Report.csv</td>
                  <td className="px-3 py-2">Blood Test</td>
                  <td className="px-3 py-2"><span className="text-green-600">Processed</span></td>
                  <td className="px-3 py-2"><a href="#" className="text-blue-600 underline">View</a></td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Vitamin-D.pdf</td>
                  <td className="px-3 py-2">PDF</td>
                  <td className="px-3 py-2"><span className="text-green-600">Uploaded</span></td>
                  <td className="px-3 py-2"><a href="#" className="text-blue-600 underline">Download</a></td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Vitamin-B12.csv</td>
                  <td className="px-3 py-2">Blood Test</td>
                  <td className="px-3 py-2"><span className="text-green-600">Processed</span></td>
                  <td className="px-3 py-2"><a href="#" className="text-blue-600 underline">View</a></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Connected Sources List */}
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
