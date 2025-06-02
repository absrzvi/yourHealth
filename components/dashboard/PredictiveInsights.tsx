import React, { useMemo } from 'react';
import { format } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface PredictiveInsightsProps {
  dateRange?: DateRange;
}

export function PredictiveInsights({ dateRange }: PredictiveInsightsProps) {
  const insights = useMemo(() => {
    const dateRangeText = dateRange?.from 
      ? `for ${format(dateRange.from, 'MMM d')}${dateRange.to ? ` to ${format(dateRange.to, 'MMM d')}` : ''}` 
      : '';
      
    return [
      { 
        id: 1, 
        text: `Your sleep pattern ${dateRangeText} suggests a potential dip in cognitive performance. Consider an earlier bedtime.`, 
        risk: "Medium" 
      },
      { 
        id: 2, 
        text: `Based on your activity and HRV ${dateRangeText}, your body is well-recovered and primed for a challenging workout.`, 
        risk: "Low" 
      },
      { 
        id: 3, 
        text: `Elevated stress markers detected ${dateRangeText}. Recommend mindfulness exercises or a short walk.`, 
        risk: "High" 
      },
    ];
  }, [dateRange]);

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
