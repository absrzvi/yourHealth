'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Check, HelpCircle } from 'lucide-react';

interface HealthInsight {
  metric: string;
  trend: 'improving' | 'declining' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  description: string;
  recommendation: string;
}

interface HealthInsightsVisualizationProps {
  data: {
    title: string;
    metrics: string[];
    insights: HealthInsight[];
    summary: string;
    timeRange?: string;
    metricsData?: any[];
  };
}

/**
 * HealthInsightsVisualization component
 * 
 * Displays health insights, trends, and recommendations for health metrics.
 */
export const HealthInsightsVisualization: React.FC<HealthInsightsVisualizationProps> = ({ data }) => {
  const { title, insights, summary } = data;
  
  // Render trend icon based on the trend value
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'stable':
        return <Minus className="w-5 h-5 text-blue-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Render status icon based on the status value
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-500" />;
    }
  };
  
  // Get class name for the status badge
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary section */}
          <div className="bg-primary/10 p-4 rounded-lg mb-4">
            <p className="text-gray-700">{summary}</p>
          </div>
          
          {/* Insights list */}
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{insight.metric}</h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center mr-4">
                        {renderTrendIcon(insight.trend)}
                        <span className="ml-1 text-sm capitalize">{insight.trend}</span>
                      </div>
                      <div className="flex items-center">
                        {renderStatusIcon(insight.status)}
                        <span className="ml-1 text-sm capitalize">{insight.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(insight.status)}`}>
                    {insight.status.charAt(0).toUpperCase() + insight.status.slice(1)}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{insight.description}</p>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Recommendation:</p>
                  <p className="text-sm text-gray-700">{insight.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthInsightsVisualization;
