'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import DynamicChart from '../charts/DynamicChart';
import DynamicDashboard from '../charts/DynamicDashboard';

interface VisualizationMessageProps {
  type: 'chart' | 'dashboard' | 'message' | 'error';
  data: any;
  isLoading?: boolean;
  error?: string | null;
}

export const VisualizationMessage: React.FC<VisualizationMessageProps> = ({
  type,
  data,
  isLoading = false,
  error = null,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-800/50 rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-400 mr-2" />
        <span className="text-sm text-gray-400">Generating visualization...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  switch (type) {
    case 'chart':
      return (
        <div className="w-full max-w-2xl">
          <DynamicChart
            chartType={data.chartType}
            title={data.title}
            data={data.data}
            xAxis={data.xAxis}
            yAxis={data.yAxis}
            color={data.color}
            height={300}
          />
        </div>
      );

    case 'dashboard':
      return (
        <div className="w-full">
          <DynamicDashboard
            title={data.title}
            metrics={data.metrics}
            charts={data.charts.map((chart: any) => ({
              ...chart,
              data: chart.data || [],
            }))}
            insights={data.insights}
          />
        </div>
      );

    case 'message':
      return (
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-300">{data.content}</p>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
          <p className="text-sm text-yellow-400">
            Unsupported visualization type
          </p>
        </div>
      );
  }
};

export default VisualizationMessage;
