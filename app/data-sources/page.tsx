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
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", reportType);
    try {
      const res = await fetch("/api/reports/upload", { method: "POST", body: formData });
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
            <option value="pdf">PDF Report</option>
            <option value="image">Image (photo of report)</option>
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.txt,.json,.xml,.xlsx,.xls,.png,.jpg,.jpeg"
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
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <b>Blood Test CSV format:</b><br/>
          <pre className="bg-white border border-gray-200 rounded p-2 mt-2 overflow-x-auto">name,value,unit
HGB,13.5,g/dL
RBC,4.8,10^6/uL
</pre>
          <div className="mt-2">
            Only the following markers are recognized:
            <span className="block mt-1 text-xs text-gray-600">
              WBC, RBC, HGB, HCT, MCV, MCH, MCHC, RDW, PLT, GLUCOSE, BUN, CREATININE, eGFR, AST, ALT
            </span>
            <a href="/sample-blood-test.csv" download className="text-blue-700 underline mt-2 inline-block">Download sample CSV</a>
          </div>
        </div>
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm">
          <b>DNA Report CSV format:</b><br/>
          <pre className="bg-white border border-gray-200 rounded p-2 mt-2 overflow-x-auto">rsid,chromosome,position,genotype
rs9939609,16,53786615,AA
rs662799,11,116792662,AG
rs1801133,1,11856378,TT
rs429358,19,45411941,CC
</pre>
          <div className="mt-2">
            Only the following SNPs are recognized:
            <span className="block mt-1 text-xs text-gray-600">
              rs9939609 (FTO), rs662799 (APOA5), rs1801133 (MTHFR), rs429358 (APOE)
            </span>
            <a href="/sample-dna-report.csv" download className="text-purple-700 underline mt-2 inline-block">Download sample CSV</a>
          </div>
        </div>
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <b>Microbiome JSON format:</b><br/>
          <pre className="bg-white border border-gray-200 rounded p-2 mt-2 overflow-x-auto">{
  "sample_date": "2024-05-01",
  "bacteria": [
    { "taxon": "Bacteroides", "abundance": 0.23 },
    { "taxon": "Firmicutes", "abundance": 0.45 },
    { "taxon": "Lactobacillus", "abundance": 0.05 }
  ]
}
</pre>
          <div className="mt-2">
            Only the following taxa are recognized (example):
            <span className="block mt-1 text-xs text-gray-600">
              Bacteroides, Firmicutes, Lactobacillus
            </span>
            <a href="/sample-microbiome-report.json" download className="text-green-700 underline mt-2 inline-block">Download sample JSON</a>
          </div>
        </div>
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
        {/* Uploaded Reports List and Preview */}
        <div className="widget-card mt-8">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>📄</div>
            <div className="card-title">Uploaded Reports</div>
          </div>
          {/* TODO: Fetch the user's uploaded reports from the API/backend */}
          {/* Example static table for now, replace with dynamic data */}
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
                {/* Example row, replace with mapped data */}
                <tr>
                  <td className="px-3 py-2">report1.pdf</td>
                  <td className="px-3 py-2">PDF</td>
                  <td className="px-3 py-2 text-green-700">Completed</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-blue-600 underline">Preview</button>
                    <button className="text-red-600 underline">Delete</button>
                    <button className="text-yellow-600 underline">Re-upload</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2">blood_test.csv</td>
                  <td className="px-3 py-2">Blood</td>
                  <td className="px-3 py-2 text-yellow-700">Processing</td>
                  <td className="px-3 py-2 space-x-2">
                    <button className="text-blue-600 underline" disabled>Preview</button>
                    <button className="text-red-600 underline">Delete</button>
                    <button className="text-yellow-600 underline">Re-upload</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* Preview of Extracted Data */}
        <div className="widget-card mt-8">
          <div className="card-header">
            <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>🔬</div>
            <div className="card-title">Extracted Data Preview</div>
          </div>
          {/* TODO: Show preview table after successful upload/parse */}
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2">Biomarker</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Test Date</th>
                </tr>
              </thead>
              <tbody>
                {/* Example row, replace with mapped data */}
                <tr>
                  <td className="px-3 py-2">Hemoglobin</td>
                  <td className="px-3 py-2">13.5</td>
                  <td className="px-3 py-2">g/dL</td>
                  <td className="px-3 py-2">Blood</td>
                  <td className="px-3 py-2">2024-05-01</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Vitamin D</td>
                  <td className="px-3 py-2">32</td>
                  <td className="px-3 py-2">ng/mL</td>
                  <td className="px-3 py-2">Vitamin</td>
                  <td className="px-3 py-2">2024-05-01</td>
                </tr>
              </tbody>
            </table>
          </div>
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
