"use client";

export default function CorrelationsPage() {
  return (
    <div className="content-section active max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Correlations Dashboard</h2>
      <div className="mb-8">
        <p className="mb-2">This dashboard visualizes correlations discovered in your health data.</p>
        {/* TODO: Fetch correlation results from backend/database and display here */}
      </div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Top Correlations</h3>
        {/* TODO: Table of top correlations (variableA, variableB, coefficient, p-value, source reports) */}
        <div className="border rounded bg-gray-50 p-4 text-gray-500">Top correlations table will appear here.</div>
      </div>
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Scatterplots</h3>
        {/* TODO: Render scatterplots for top correlations */}
        <div className="border rounded bg-gray-50 p-4 text-gray-500">Scatterplots will appear here.</div>
      </div>
      {/* Bonus: Add network graph or other widgets here in the future */}
    </div>
  );
}
