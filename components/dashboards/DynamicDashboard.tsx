'use client';

import React from 'react';
import { ChartDataPoint } from '../charts/DynamicChart';
import DynamicChart from '../charts/DynamicChart';

interface DashboardItem {
  id: string;
  title: string;
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'radar';
  data: ChartDataPoint[];
  xAxis?: string;
  yAxis?: string;
  color?: string;
  width?: string | number;
  height?: number;
  colSpan?: number;
  rowSpan?: number;
}

interface DynamicDashboardProps {
  title?: string;
  description?: string;
  layout?: 'grid' | 'rows' | 'columns' | 'custom';
  items: DashboardItem[];
  className?: string;
}

const DynamicDashboard: React.FC<DynamicDashboardProps> = ({
  title,
  description,
  layout = 'grid',
  items,
  className = '',
}) => {
  const getGridClasses = () => {
    switch (layout) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      case 'rows':
        return 'flex flex-col gap-4';
      case 'columns':
        return 'grid grid-cols-1 gap-4';
      default:
        return 'grid gap-4';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>}
          {description && <p className="text-gray-300">{description}</p>}
        </div>
      )}
      
      <div className={getGridClasses()}>
        {items.map((item) => (
          <div 
            key={item.id}
            className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden ${
              item.colSpan ? `col-span-${item.colSpan}` : ''
            } ${item.rowSpan ? `row-span-${item.rowSpan}` : ''}`}
          >
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">{item.title}</h3>
            </div>
            <div className="p-4">
              <DynamicChart
                chartType={item.chartType}
                title={item.title}
                data={item.data}
                xAxis={item.xAxis}
                yAxis={item.yAxis}
                color={item.color}
                width={item.width || '100%'}
                height={item.height || 300}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicDashboard;
