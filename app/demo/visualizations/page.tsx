'use client';

import React, { useState } from 'react';
import DynamicChart from '@/components/charts/DynamicChart';
import DynamicDashboard from '@/components/charts/DynamicDashboard';
import { generateSampleData, generateSampleMetrics } from '@/lib/chartUtils';

const VisualizationDemo = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area' | 'pie' | 'radar'>('line');
  
  // Sample data for individual charts
  const sampleData = generateSampleData(chartType);
  
  // Sample dashboard data
  const dashboardData = {
    metrics: generateSampleMetrics(),
    charts: [
      {
        chartType: 'line' as const,
        title: 'Weekly Activity',
        data: generateSampleData('line'),
        xAxis: 'name',
        yAxis: 'value',
        color: '#4F46E5'
      },
      {
        chartType: 'bar' as const,
        title: 'Category Comparison',
        data: generateSampleData('bar'),
        xAxis: 'name',
        yAxis: 'value',
        color: '#10B981'
      },
      {
        chartType: 'pie' as const,
        title: 'Health Distribution',
        data: generateSampleData('pie'),
        xAxis: 'name',
        yAxis: 'value'
      },
      {
        chartType: 'radar' as const,
        title: 'Health Radar',
        data: generateSampleData('radar'),
        xAxis: 'name',
        yAxis: 'value',
        color: '#8B5CF6'
      }
    ],
    insights: [
      {
        type: 'info' as const,
        message: 'Your activity levels have increased by 12% compared to last week.',
        icon: '📈'
      },
      {
        type: 'warning' as const,
        message: 'Sleep duration is below the recommended 7-9 hours for 3 nights this week.',
        icon: '😴'
      },
      {
        type: 'success' as const,
        message: 'Great job! You met your daily step goal 5 out of 7 days this week.',
        icon: '🎯'
      }
    ]
  };

  const chartTypes: Array<{ value: typeof chartType; label: string }> = [
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'radar', label: 'Radar Chart' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Health Data Visualizations</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
          <p className="text-gray-300 mb-6">
            Explore different visualization components for health data. Switch between dashboard view and individual chart types.
          </p>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Dashboard View
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'chart' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Individual Charts
            </button>
          </div>
          
          {activeTab === 'dashboard' ? (
            <div className="mt-6">
              <DynamicDashboard 
                title="Health & Wellness Dashboard"
                metrics={dashboardData.metrics}
                charts={dashboardData.charts}
                insights={dashboardData.insights}
              />
            </div>
          ) : (
            <div className="mt-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Chart Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {chartTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setChartType(type.value)}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        chartType === type.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-[500px] bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl font-medium text-white mb-4">
                  {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Example
                </h3>
                <div className="h-[400px]">
                  <DynamicChart
                    chartType={chartType}
                    title={`Sample ${chartType} Chart`}
                    data={sampleData}
                    xAxis={['pie', 'radar'].includes(chartType) ? 'name' : 'name'}
                    yAxis="value"
                    color={
                      {
                        line: '#4F46E5',
                        bar: '#10B981',
                        area: '#06B6D4',
                        pie: '#8B5CF6',
                        radar: '#F59E0B'
                      }[chartType] || '#4F46E5'
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Implementation Notes</h2>
          <div className="prose prose-invert max-w-none">
            <h3>Components Created:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><code>DynamicChart.tsx</code> - A reusable chart component supporting multiple chart types</li>
              <li><code>DynamicDashboard.tsx</code> - A dashboard layout component for health metrics and visualizations</li>
              <li><code>chartUtils.ts</code> - Utility functions for data generation and transformation</li>
            </ul>
            
            <h3 className="mt-6">Features:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Responsive design that works on all screen sizes</li>
              <li>Interactive elements with hover states and tooltips</li>
              <li>Sample data generation for demonstration</li>
              <li>Support for multiple chart types: Line, Bar, Area, Pie, and Radar</li>
              <li>Dashboard layout with metrics, charts, and insights</li>
            </ul>
            
            <h3 className="mt-6">Usage:</h3>
            <pre className="bg-gray-900 p-4 rounded-md overflow-x-auto">
              {`// Basic chart usage
<DynamicChart
  chartType="line"
  title="Activity Trend"
  data={sampleData}
  xAxis="date"
  yAxis="value"
  color="#4F46E5"
  height={400}
/>

// Dashboard usage
<DynamicDashboard
  title="Health Dashboard"
  metrics={metricsData}
  charts={chartsConfig}
  insights={insights}
  layout="grid"
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationDemo;
