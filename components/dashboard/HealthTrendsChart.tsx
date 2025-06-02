import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface DataPoint {
  date: string;
  value: number;
  type: string;
}

interface HealthTrendsChartProps {
  data: DataPoint[];
  title: string;
  yAxisLabel?: string;
  referenceRange?: {
    min: number;
    max: number;
  };
}

export function HealthTrendsChart({
  data,
  title,
  yAxisLabel = 'Value',
  referenceRange,
}: HealthTrendsChartProps) {
  // Group data by type
  const dataByType: Record<string, DataPoint[]> = {};
  data.forEach((point) => {
    if (!dataByType[point.type]) {
      dataByType[point.type] = [];
    }
    dataByType[point.type].push(point);
  });

  const lineColors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
  ];

  return (
    <div className="h-[400px] w-full">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickMargin={10}
            className="text-xs"
          />
          <YAxis
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'left',
              offset: -10,
              style: { textAnchor: 'middle' },
            }}
            tick={{ fontSize: 12 }}
            width={60}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-card p-4 border border-border rounded-lg shadow-lg">
                    <p className="font-medium">{label}</p>
                    {payload.map((entry, index) => (
                      <p key={`tooltip-${index}`} style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          {referenceRange && (
            <ReferenceLine
              y={referenceRange.min}
              label={{ value: 'Min', position: 'insideBottomLeft' }}
              stroke="#ef4444"
              strokeDasharray="3 3"
            />
          )}
          {referenceRange && (
            <ReferenceLine
              y={referenceRange.max}
              label={{ value: 'Max', position: 'insideTopLeft' }}
              stroke="#ef4444"
              strokeDasharray="3 3"
            />
          )}
          {Object.entries(dataByType).map(([type, typeData], index) => (
            <Line
              key={type}
              type="monotone"
              dataKey="value"
              data={typeData}
              name={type}
              stroke={lineColors[index % lineColors.length]}
              activeDot={{ r: 6 }}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
