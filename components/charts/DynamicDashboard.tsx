'use client';

import React from 'react';
import DynamicChart from './DynamicChart';

type MetricStatus = 'good' | 'warning' | 'alert' | 'neutral';
type MetricTrend = 'up' | 'down' | 'stable';

interface DashboardMetric {
  name: string;
  value: number | string;
  unit: string;
  trend: MetricTrend;
  status: MetricStatus;
  change?: number;
  changeType?: 'percent' | 'absolute';
}

import type { ChartDataPoint } from './DynamicChart';

interface DashboardChart {
  chartType: 'line' | 'bar' | 'area' | 'pie' | 'radar';
  title: string;
  data: Array<ChartDataPoint & Record<string, any>>;
  xAxis?: string;
  yAxis?: string;
  color?: string;
}

interface DashboardInsight {
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  icon?: string;
}

interface DynamicDashboardProps {
  title: string;
  metrics?: DashboardMetric[];
  charts?: DashboardChart[];
  insights?: DashboardInsight[];
  layout?: 'grid' | 'rows' | 'columns';
  className?: string;
}

const getStatusColor = (status: MetricStatus) => {
  switch (status) {
    case 'good':
      return 'text-green-400 border-green-400/20 bg-green-400/10';
    case 'warning':
      return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/10';
    case 'alert':
      return 'text-red-400 border-red-400/20 bg-red-400/10';
    default:
      return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
  }
};

const getTrendIcon = (trend: MetricTrend) => {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'stable':
      return '→';
    default:
      return '→';
  }
};

const getTrendColor = (trend: MetricTrend) => {
  switch (trend) {
    case 'up':
      return 'text-green-400';
    case 'down':
      return 'text-red-400';
    case 'stable':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

const getInsightColor = (type: DashboardInsight['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-500/10 border-green-500/20';
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/20';
    case 'error':
      return 'bg-red-500/10 border-red-500/20';
    case 'info':
    default:
      return 'bg-blue-500/10 border-blue-500/20';
  }
};

const DynamicDashboard: React.FC<DynamicDashboardProps> = ({
  title,
  metrics = [],
  charts = [],
  insights = [],
  layout = 'grid',
  className = '',
}) => {
  const renderMetrics = () => {
    if (metrics.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={`metric-${index}`}
            className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-300">{metric.name}</span>
              <span className={`text-sm ${getTrendColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)}
                {metric.change !== undefined && (
                  <span className="ml-1">
                    {metric.change}
                    {metric.changeType === 'percent' ? '%' : ''}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{metric.value}</span>
              <span className="text-sm text-gray-400">{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCharts = () => {
    if (charts.length === 0) return null;

    return (
      <div
        className={`grid ${
          layout === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        } gap-6`}
      >
        {charts.map((chart, index) => (
          <div key={`chart-${index}`} className="h-[400px]">
            <DynamicChart
              chartType={chart.chartType}
              title={chart.title}
              data={chart.data}
              xAxis={chart.xAxis}
              yAxis={chart.yAxis}
              color={chart.color}
              height={350}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderInsights = () => {
    if (insights.length === 0) return null;

    return (
      <div className="mt-8 space-y-3">
        <h4 className="text-lg font-medium text-gray-200">Key Insights</h4>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={`insight-${index}`}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                {insight.icon && (
                  <span className="text-lg mt-0.5">{insight.icon}</span>
                )}
                <p className="text-sm leading-relaxed text-gray-200">
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 ${className}`}>
      <h2 className="text-2xl font-semibold text-white mb-6">{title}</h2>
      
      {renderMetrics()}
      {renderCharts()}
      {renderInsights()}
    </div>
  );
};

export { DynamicDashboard as default };

export type { DashboardMetric, DashboardChart, DashboardInsight };

