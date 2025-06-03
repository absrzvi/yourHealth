'use client';

import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, Cell, TooltipProps
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartVisualizationProps {
  data: {
    chartType: string;
    title: string;
    metrics: string[];
    data: any[];
    includeReferenceRanges?: boolean;
    timeRange?: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

/**
 * ChartVisualization component 
 * 
 * A wrapper component that renders different chart types (line, bar, pie, area)
 * based on the provided data.
 */
export const ChartVisualization: React.FC<ChartVisualizationProps> = ({ data }) => {
  const { chartType, title, metrics, data: chartData, includeReferenceRanges } = data;
  
  // Check if we have reference ranges for each metric
  const hasIndividualRanges = chartData.length > 0 && 
    chartData[0].referenceMin && 
    typeof chartData[0].referenceMin === 'object';
  
  // Custom tooltip to show reference ranges
  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => {
            const metricName = entry.name;
            const metricValue = entry.value;
            let status = '';
            let statusColor = 'text-gray-700';
            
            if (includeReferenceRanges) {
              let min, max;
              
              if (hasIndividualRanges) {
                min = chartData[0].referenceMin[metricName];
                max = chartData[0].referenceMax[metricName];
              } else {
                min = chartData[0].referenceMin;
                max = chartData[0].referenceMax;
              }
              
              if (min !== undefined && max !== undefined) {
                if (metricValue < min) {
                  status = 'Below range';
                  statusColor = 'text-amber-500';
                } else if (metricValue > max) {
                  status = 'Above range';
                  statusColor = 'text-red-500';
                } else {
                  status = 'Within range';
                  statusColor = 'text-green-500';
                }
              }
            }
            
            return (
              <div key={`tooltip-${index}`} className="mt-1">
                <p style={{ color: entry.color }}>
                  {metricName}: <span className="font-medium">{metricValue}</span>
                  {status && (
                    <span className={`ml-2 text-xs ${statusColor}`}>{status}</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    
    return null;
  };
  
  // Render different chart types
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
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
                  stroke={COLORS[index % COLORS.length]} 
                  activeDot={{ r: 8 }}
                />
              ))}
              
              {includeReferenceRanges && !hasIndividualRanges && chartData.length > 0 && (
                <>
                  {chartData[0].referenceMin && (
                    <ReferenceLine 
                      y={chartData[0].referenceMin} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label="Min" 
                    />
                  )}
                  
                  {chartData[0].referenceMax && (
                    <ReferenceLine 
                      y={chartData[0].referenceMax} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label="Max" 
                    />
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
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
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
              
              {includeReferenceRanges && !hasIndividualRanges && chartData.length > 0 && (
                <>
                  {chartData[0].referenceMin && (
                    <ReferenceLine 
                      y={chartData[0].referenceMin} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label="Min" 
                    />
                  )}
                  
                  {chartData[0].referenceMax && (
                    <ReferenceLine 
                      y={chartData[0].referenceMax} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label="Max" 
                    />
                  )}
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={120}
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {metrics.map((metric, index) => (
                <Area 
                  key={metric}
                  type="monotone" 
                  dataKey={metric} 
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
              
              {includeReferenceRanges && !hasIndividualRanges && chartData.length > 0 && (
                <>
                  {chartData[0].referenceMin && (
                    <ReferenceLine 
                      y={chartData[0].referenceMin} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label="Min" 
                    />
                  )}
                  
                  {chartData[0].referenceMax && (
                    <ReferenceLine 
                      y={chartData[0].referenceMax} 
                      stroke="#ff7300" 
                      strokeDasharray="3 3" 
                      label="Max" 
                    />
                  )}
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      default:
        return <div>Unsupported chart type: {chartType}</div>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ChartVisualization;
