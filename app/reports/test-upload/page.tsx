"use client";
import React, { useState } from "react";

export default function TestReportUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("BLOOD_TEST");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setResult("Please select a file.");
      return;
    }
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);
    try {
      const res = await fetch("/api/reports/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) setResult("Upload successful!");
      else setResult(`Error: ${data.error || "Unknown error"}`);
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Test Health Report Upload</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Report Type: </label>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="BLOOD_TEST">Blood Test</option>
            <option value="DNA">DNA</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <input type="file" accept=".csv,.pdf,.txt,.json" onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>
        <div style={{ marginBottom: 12, color: '#555', fontSize: 13 }}>
          <b>Accepted file types:</b> CSV (for data extraction), PDF, TXT, JSON (for storage only)
        </div>
        <button type="submit" disabled={loading} style={{ padding: "8px 24px" }}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {result && <div style={{ marginTop: 16, color: result.startsWith('Error') ? 'red' : 'green' }}>{result}</div>}
    </div>
  );
}
