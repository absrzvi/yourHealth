'use client';

import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ChartVisualizationProps {
  data: {
    chartType: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    subtitle?: string;
    metrics: string[];
    data: any[];
    timeRange?: string;
    dataSource?: string;
    referenceRanges?: Record<string, { min: number; max: number }>;
    colors?: string[];
  };
}

// Default color palette for charts
const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#45B39D', '#F5B041'];

const ChartVisualization: React.FC<ChartVisualizationProps> = ({ data }) => {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg p-4 border border-gray-200">
        <p className="text-gray-500">No data available for visualization</p>
      </div>
    );
  }

  const { chartType, title, subtitle, metrics, data: chartData, colors = DEFAULT_COLORS } = data;

  // Ensure we have reference ranges
  const referenceRanges = data.referenceRanges || {};

  // Helper to determine if a value is outside reference range
  const isOutsideRange = (metric: string, value: number) => {
    if (!referenceRanges[metric]) return false;
    return value < referenceRanges[metric].min || value > referenceRanges[metric].max;
  };

  // Generate custom tooltips for better UX
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
        <p className="font-semibold">{`${label}`}</p>
        {payload.map((entry: any, index: number) => {
          const metric = entry.dataKey;
          const value = entry.value;
          const isOutside = isOutsideRange(metric, value);
          
          return (
            <p 
              key={`tooltip-${index}`} 
              style={{ color: entry.color }}
              className={isOutside ? 'font-bold' : ''}
            >
              {`${metric}: ${value}`}
              {isOutside && <span className="ml-2 text-red-500">⚠️</span>}
            </p>
          );
        })}
      </div>
    );
  };

  // Render different chart types
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {metrics.map((metric, index) => (
                <Line 
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {metrics.map((metric, index) => (
                <Bar 
                  key={metric}
                  dataKey={metric}
                  fill={colors[index % colors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        // For pie charts, we expect data in a different format
        // Each item should have a name and value property
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg p-4 border border-gray-200">
            <p className="text-gray-500">Unsupported chart type: {chartType}</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 mb-4">{subtitle}</p>}
        
        {renderChart()}
        
        {Object.keys(referenceRanges).length > 0 && (
          <div className="mt-4 text-xs text-gray-600 border-t border-gray-100 pt-2">
            <p className="font-semibold">Reference Ranges:</p>
            <ul className="mt-1">
              {Object.entries(referenceRanges).map(([metric, range]) => (
                <li key={`range-${metric}`} className="inline-block mr-4">
                  {metric}: {range.min} - {range.max}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartVisualization;
