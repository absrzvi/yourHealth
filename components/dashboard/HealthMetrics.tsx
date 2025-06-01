import React from 'react';

export function HealthMetrics() {
  const metrics = [
    { name: 'Sleep Score', value: '85', unit: '/100', trend: 'up', color: 'text-green-500' },
    { name: 'Readiness', value: '92', unit: '%', trend: 'up', color: 'text-green-500' },
    { name: 'HRV', value: '65', unit: 'ms', trend: 'down', color: 'text-red-500' },
    { name: 'Activity Goal', value: '75', unit: '%', trend: 'stagnant', color: 'text-yellow-500' },
  ];

  return (
    <section className="mb-8">
      <h3 className="text-2xl font-semibold mb-4 text-neutral-700 font-montserrat">Key Health Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-card p-6 rounded-lg shadow-lg border border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">{metric.name}</h4>
            <p className="text-3xl font-bold text-foreground">{metric.value}<span className="text-lg font-normal text-muted-foreground">{metric.unit}</span></p>
            {/* Trend indicator can be more sophisticated, e.g. with icons */}
            <p className={`text-xs ${metric.color}`}>
              {metric.trend === 'up' ? '▲ Trending Up' : metric.trend === 'down' ? '▼ Trending Down' : '● Stable'}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
