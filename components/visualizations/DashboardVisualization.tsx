'use client';

import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartConfig {
  id: string;
  title: string;
  chartType: string;
  metrics: string[];
  data: any[];
}

interface DashboardVisualizationProps {
  data: {
    title: string;
    charts: ChartConfig[];
    timeRange?: string;
    includeReferenceRanges?: boolean;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

/**
 * DashboardVisualization component
 * 
 * Renders a multi-chart dashboard layout with a grid of various chart types.
 */
export const DashboardVisualization: React.FC<DashboardVisualizationProps> = ({ data }) => {
  const { title, charts } = data;
  
  // Render a single chart based on its configuration
  const renderChart = (chart: ChartConfig) => {
    const { chartType, title, metrics, data: chartData } = chart;
    
    // Check if we have reference ranges for each metric
    const hasIndividualRanges = chartData.length > 0 && 
      chartData[0].referenceMin && 
      typeof chartData[0].referenceMin === 'object';
    
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              
              {metrics.map((metric, index) => (
                <Line 
                  key={metric}
                  type="monotone" 
                  dataKey={metric} 
                  stroke={COLORS[index % COLORS.length]} 
                  activeDot={{ r: 6 }}
                />
              ))}
              
              {chartData.length > 0 && chartData[0].referenceMin && !hasIndividualRanges && (
                <ReferenceLine 
                  y={chartData[0].referenceMin} 
                  stroke="#ff7300" 
                  strokeDasharray="3 3"
                  label={{ value: 'Min', position: 'insideBottomRight', fontSize: 12 }}
                />
              )}
              
              {chartData.length > 0 && chartData[0].referenceMax && !hasIndividualRanges && (
                <ReferenceLine 
                  y={chartData[0].referenceMax} 
                  stroke="#ff7300" 
                  strokeDasharray="3 3"
                  label={{ value: 'Max', position: 'insideTopRight', fontSize: 12 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              
              {metrics.map((metric, index) => (
                <Bar 
                  key={metric}
                  dataKey={metric} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
              
              {chartData.length > 0 && chartData[0].referenceMin && !hasIndividualRanges && (
                <ReferenceLine 
                  y={chartData[0].referenceMin} 
                  stroke="#ff7300" 
                  strokeDasharray="3 3"
                  label={{ value: 'Min', position: 'insideBottomRight', fontSize: 12 }}
                />
              )}
              
              {chartData.length > 0 && chartData[0].referenceMax && !hasIndividualRanges && (
                <ReferenceLine 
                  y={chartData[0].referenceMax} 
                  stroke="#ff7300" 
                  strokeDasharray="3 3"
                  label={{ value: 'Max', position: 'insideTopRight', fontSize: 12 }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return <div>Unsupported chart type: {chartType}</div>;
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {charts.map((chart) => (
          <Card key={chart.id} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderChart(chart)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardVisualization;
