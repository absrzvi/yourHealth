import React from 'react';

export function PredictiveInsights() {
  const insights = [
    { id: 1, text: "Your current sleep pattern suggests a potential dip in cognitive performance tomorrow. Consider an earlier bedtime.", risk: "Medium" },
    { id: 2, text: "Based on your recent activity and HRV, your body is well-recovered and primed for a challenging workout.", risk: "Low" },
    { id: 3, text: "Elevated stress markers detected. Recommend mindfulness exercises or a short walk.", risk: "High" },
  ];

  return (
    <section className="mb-8">
      <h3 className="text-2xl font-semibold mb-4 text-neutral-700 font-montserrat">Aria's Predictive Insights</h3>
      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-card p-6 rounded-lg shadow-lg border border-border flex items-start">
            <div className={`w-3 h-3 rounded-full mr-4 mt-1.5 ${insight.risk === 'High' ? 'bg-destructive' : insight.risk === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <div>
              <p className="text-foreground">{insight.text}</p>
              <p className="text-xs text-muted-foreground mt-1">Risk Level: {insight.risk}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
