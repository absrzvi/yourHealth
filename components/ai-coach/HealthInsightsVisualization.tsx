'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Trend {
  metric: string;
  value: number;
  previousValue: number;
  changePercent: number;
  changeDirection: 'increase' | 'decrease' | 'no-change';
  isPositive: boolean;
  referenceRange?: { min: number; max: number };
}

interface Insight {
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
  actionable: boolean;
  action?: string;
}

interface HealthInsightsVisualizationProps {
  data: {
    title: string;
    subtitle?: string;
    dataSource: string;
    timeRange: string;
    trends: Trend[];
    insights: Insight[];
    summary: string;
  };
}

const HealthInsightsVisualization: React.FC<HealthInsightsVisualizationProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg p-4 border border-gray-200">
        <p className="text-gray-500">No health insights available</p>
      </div>
    );
  }

  const { title, subtitle, trends, insights, dataSource, timeRange, summary } = data;

  // Helper to render trend arrows and colors
  const renderTrendIndicator = (trend: Trend) => {
    const { changeDirection, isPositive, changePercent } = trend;
    
    let color = 'text-gray-500';
    let Icon = Minus;
    
    if (changeDirection === 'increase') {
      Icon = ArrowUp;
      color = isPositive ? 'text-green-500' : 'text-red-500';
    } else if (changeDirection === 'decrease') {
      Icon = ArrowDown;
      color = isPositive ? 'text-green-500' : 'text-red-500';
    }
    
    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span>{Math.abs(changePercent).toFixed(1)}%</span>
      </div>
    );
  };

  // Helper to check if value is in reference range
  const checkRangeStatus = (trend: Trend) => {
    if (!trend.referenceRange) return null;
    
    const { value, referenceRange } = trend;
    
    if (value < referenceRange.min) {
      return <span className="text-orange-500 text-sm">Below range</span>;
    }
    
    if (value > referenceRange.max) {
      return <span className="text-red-500 text-sm">Above range</span>;
    }
    
    return <span className="text-green-500 text-sm">Normal range</span>;
  };

  // Helper to render insight icon based on severity
  const renderInsightIcon = (severity: string) => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-xl font-semibold mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-600 mb-4">{subtitle}</p>}
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Summary</h3>
        <p className="text-gray-700">{summary}</p>
      </div>
      
      {trends.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Key Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.map((trend, index) => (
              <div key={`trend-${index}`} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{trend.metric}</h4>
                  {renderTrendIndicator(trend)}
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-xl font-semibold">{trend.value}</span>
                  {checkRangeStatus(trend)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Previous: {trend.previousValue}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {insights.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-3">Insights & Recommendations</h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={`insight-${index}`} className="flex gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                {renderInsightIcon(insight.severity)}
                <div>
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                  {insight.actionable && insight.action && (
                    <p className="text-sm font-medium text-blue-600 mt-2 cursor-pointer hover:underline">
                      {insight.action}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 flex justify-between border-t border-gray-100 pt-3">
        <span>Data source: {dataSource}</span>
        <span>Time range: {timeRange}</span>
      </div>
    </div>
  );
};

export default HealthInsightsVisualization;
