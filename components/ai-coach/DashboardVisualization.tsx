'use client';

import React from 'react';
import ChartVisualization from './ChartVisualization';

interface PanelData {
  chartType: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  subtitle?: string;
  metrics: string[];
  data: any[];
  timeRange?: string;
  dataSource?: string;
  referenceRanges?: Record<string, { min: number; max: number }>;
  colors?: string[];
}

interface DashboardVisualizationProps {
  data: {
    title: string;
    subtitle?: string;
    panels: PanelData[];
    timeRange?: string;
    dataSource?: string;
  };
}

const DashboardVisualization: React.FC<DashboardVisualizationProps> = ({ data }) => {
  if (!data || !data.panels || data.panels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg p-4 border border-gray-200">
        <p className="text-gray-500">No data available for dashboard visualization</p>
      </div>
    );
  }

  const { title, subtitle, panels } = data;

  // Determine grid layout based on number of panels
  const getGridClasses = () => {
    const count = panels.length;
    
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-xl font-semibold mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-600 mb-4">{subtitle}</p>}
      
      <div className={`grid ${getGridClasses()} gap-4 mt-4`}>
        {panels.map((panel, index) => (
          <div key={`panel-${index}`} className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
            <ChartVisualization data={panel} />
          </div>
        ))}
      </div>
      
      {data.timeRange && (
        <div className="mt-4 text-xs text-gray-500 text-right">
          <p>Time range: {data.timeRange}</p>
        </div>
      )}
      
      {data.dataSource && (
        <div className="mt-1 text-xs text-gray-500 text-right">
          <p>Data source: {data.dataSource}</p>
        </div>
      )}
    </div>
  );
};

export default DashboardVisualization;
