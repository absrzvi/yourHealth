'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Activity, BarChart, PieChart, LineChart, TrendingUp, Award, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartVisualization } from '@/components/visualizations/ChartVisualization';
import { DashboardVisualization } from '@/components/visualizations/DashboardVisualization';
import { HealthInsightsVisualization } from '@/components/visualizations/HealthInsightsVisualization';
import RealTimeVisualization from '@/components/ai-coach/RealTimeVisualization';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DataSourceType } from '@/lib/websocket/visualizationWebSocketService';

type IntentType = 'chart' | 'dashboard' | 'insights' | 'unknown';

interface DemoIntent {
  intentType: IntentType;
  confidence: number;
  entities: {
    dataSource?: string[];
    metrics?: string[];
    chartType?: string;
    timeRange?: string;
    includeReferenceRanges?: boolean;
    title?: string;
  };
}

interface VisualizationResult {
  type: string;
  data: any;
  loading?: boolean;
  error?: string;
}

// Sample visualization results for demo purposes
const sampleResults: Record<string, VisualizationResult> = {
  "heart-rate-week": {
    type: 'chart',
    data: {
      chartType: 'line',
      title: 'Heart Rate (Last Week)',
      metrics: ['Heart Rate'],
      timeRange: 'LAST_WEEK',
      includeReferenceRanges: true,
      data: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'Heart Rate': 65 + Math.floor(Math.random() * 15),
        referenceMin: 60,
        referenceMax: 100
      }))
    }
  },
  "cholesterol-month": {
    type: 'chart',
    data: {
      chartType: 'bar',
      title: 'Cholesterol Levels (Last Month)',
      metrics: ['LDL Cholesterol', 'HDL Cholesterol', 'Total Cholesterol'],
      timeRange: 'LAST_MONTH',
      includeReferenceRanges: true,
      data: Array.from({ length: 4 }, (_, i) => ({
        date: `Week ${i + 1}`,
        'LDL Cholesterol': 100 + Math.floor(Math.random() * 30),
        'HDL Cholesterol': 50 + Math.floor(Math.random() * 15),
        'Total Cholesterol': 180 + Math.floor(Math.random() * 40),
        referenceMin: {
          'LDL Cholesterol': 0,
          'HDL Cholesterol': 40,
          'Total Cholesterol': 125
        },
        referenceMax: {
          'LDL Cholesterol': 100,
          'HDL Cholesterol': 100,
          'Total Cholesterol': 200
        }
      }))
    }
  },
  "sleep-month": {
    type: 'chart',
    data: {
      chartType: 'area',
      title: 'Sleep Duration (Last Month)',
      metrics: ['Sleep Duration'],
      timeRange: 'LAST_MONTH',
      includeReferenceRanges: true,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'Sleep Duration': 5 + Math.floor(Math.random() * 4),
        referenceMin: 7,
        referenceMax: 9
      }))
    }
  },
  "macronutrients": {
    type: 'chart',
    data: {
      chartType: 'pie',
      title: 'Macronutrient Distribution',
      metrics: ['Protein', 'Carbohydrates', 'Fat'],
      timeRange: 'LAST_WEEK',
      data: [
        { name: 'Protein', value: 25 },
        { name: 'Carbohydrates', value: 50 },
        { name: 'Fat', value: 25 }
      ]
    }
  },
  "blood-pressure-insights": {
    type: 'insights',
    data: {
      title: 'Blood Pressure Insights',
      metrics: ['Blood Pressure Systolic', 'Blood Pressure Diastolic'],
      timeRange: 'LAST_MONTH',
      insights: [
        {
          metric: 'Blood Pressure Systolic',
          trend: 'stable',
          status: 'normal',
          description: 'Your systolic blood pressure has remained stable within normal range over the past month.',
          recommendation: 'Continue with your current lifestyle habits to maintain healthy blood pressure levels.'
        },
        {
          metric: 'Blood Pressure Diastolic',
          trend: 'improving',
          status: 'normal',
          description: 'Your diastolic blood pressure has shown slight improvement over the past month.',
          recommendation: 'Your current approach to diet and exercise appears to be working well.'
        }
      ],
      summary: 'Your blood pressure measurements are within healthy ranges. Keep up the good work!'
    }
  },
  "weight-3-months": {
    type: 'chart',
    data: {
      chartType: 'line',
      title: 'Weight Trend (Last 3 Months)',
      metrics: ['Weight'],
      timeRange: 'LAST_3_MONTHS',
      includeReferenceRanges: false,
      data: Array.from({ length: 12 }, (_, i) => ({
        date: `Week ${i + 1}`,
        'Weight': 180 - (i * 0.5) + (Math.random() * 2 - 1)
      }))
    }
  },
  "health-dashboard": {
    type: 'dashboard',
    data: {
      title: 'Health Dashboard',
      timeRange: 'LAST_MONTH',
      includeReferenceRanges: true,
      charts: [
        {
          id: 'heart-rate',
          title: 'Heart Rate',
          chartType: 'line',
          metrics: ['Heart Rate'],
          data: Array.from({ length: 7 }, (_, i) => ({
            date: `Day ${i + 1}`,
            'Heart Rate': 65 + Math.floor(Math.random() * 15),
            referenceMin: 60,
            referenceMax: 100
          }))
        },
        {
          id: 'weight',
          title: 'Weight',
          chartType: 'line',
          metrics: ['Weight'],
          data: Array.from({ length: 4 }, (_, i) => ({
            date: `Week ${i + 1}`,
            'Weight': 180 - (i * 0.5) + (Math.random() * 2 - 1)
          }))
        },
        {
          id: 'sleep',
          title: 'Sleep Duration',
          chartType: 'bar',
          metrics: ['Sleep Duration'],
          data: Array.from({ length: 7 }, (_, i) => ({
            date: `Day ${i + 1}`,
            'Sleep Duration': 5 + Math.floor(Math.random() * 4),
            referenceMin: 7,
            referenceMax: 9
          }))
        },
        {
          id: 'steps',
          title: 'Daily Steps',
          chartType: 'bar',
          metrics: ['Steps'],
          data: Array.from({ length: 7 }, (_, i) => ({
            date: `Day ${i + 1}`,
            'Steps': 5000 + Math.floor(Math.random() * 5000),
            referenceMin: 7500,
            referenceMax: 10000
          }))
        }
      ]
    }
  },
  "glucose-reference": {
    type: 'chart',
    data: {
      chartType: 'line',
      title: 'Glucose Levels with Reference Ranges',
      metrics: ['Glucose'],
      timeRange: 'LAST_MONTH',
      includeReferenceRanges: true,
      data: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'Glucose': 85 + Math.floor(Math.random() * 30),
        referenceMin: 70,
        referenceMax: 100
      }))
    }
  }
};

// Sample queries that demonstrate the system's capabilities
const sampleQueries = [
  "Show me my heart rate for the last week",
  "Create a bar chart of my cholesterol levels",
  "I'd like to see my sleep patterns over the past month",
  "Can you make a pie chart showing my macronutrient distribution?",
  "What insights do you have about my blood pressure?",
  "How has my weight changed over the last 3 months?",
  "Give me a dashboard of all my health metrics",
  "Show me my glucose levels with reference ranges"
];

// Mapping from queries to demo results
const queryToResultMap: Record<string, string> = {
  "Show me my heart rate for the last week": "heart-rate-week",
  "Create a bar chart of my cholesterol levels": "cholesterol-month",
  "I'd like to see my sleep patterns over the past month": "sleep-month",
  "Can you make a pie chart showing my macronutrient distribution?": "macronutrients",
  "What insights do you have about my blood pressure?": "blood-pressure-insights",
  "How has my weight changed over the last 3 months?": "weight-3-months",
  "Give me a dashboard of all my health metrics": "health-dashboard",
  "Show me my glucose levels with reference ranges": "glucose-reference"
};

// Sample intents for demonstration
const sampleIntents: Record<string, DemoIntent> = {
  "heart-rate-week": {
    intentType: 'chart',
    confidence: 0.85,
    entities: {
      dataSource: ['health_metrics'],
      metrics: ['Heart Rate'],
      chartType: 'line',
      timeRange: 'LAST_WEEK',
      includeReferenceRanges: true
    }
  },
  "cholesterol-month": {
    intentType: 'chart',
    confidence: 0.78,
    entities: {
      dataSource: ['blood_test'],
      metrics: ['LDL Cholesterol', 'HDL Cholesterol', 'Total Cholesterol'],
      chartType: 'bar',
      timeRange: 'LAST_MONTH'
    }
  },
  "sleep-month": {
    intentType: 'chart',
    confidence: 0.72,
    entities: {
      dataSource: ['sleep_data'],
      metrics: ['Sleep Duration'],
      chartType: 'area',
      timeRange: 'LAST_MONTH'
    }
  },
  "macronutrients": {
    intentType: 'chart',
    confidence: 0.81,
    entities: {
      dataSource: ['nutrition_log'],
      metrics: ['Protein', 'Carbohydrates', 'Fat'],
      chartType: 'pie',
      timeRange: 'LAST_WEEK'
    }
  },
  "blood-pressure-insights": {
    intentType: 'insights',
    confidence: 0.75,
    entities: {
      dataSource: ['health_metrics'],
      metrics: ['Blood Pressure Systolic', 'Blood Pressure Diastolic'],
      timeRange: 'LAST_MONTH'
    }
  },
  "weight-3-months": {
    intentType: 'chart',
    confidence: 0.82,
    entities: {
      dataSource: ['weight_log'],
      metrics: ['Weight'],
      chartType: 'line',
      timeRange: 'LAST_3_MONTHS'
    }
  },
  "health-dashboard": {
    intentType: 'dashboard',
    confidence: 0.79,
    entities: {
      dataSource: ['health_metrics', 'sleep_data', 'weight_log', 'exercise_log'],
      timeRange: 'LAST_MONTH',
      includeReferenceRanges: true
    }
  },
  "glucose-reference": {
    intentType: 'chart',
    confidence: 0.83,
    entities: {
      dataSource: ['health_metrics'],
      metrics: ['Glucose'],
      chartType: 'line',
      timeRange: 'LAST_MONTH',
      includeReferenceRanges: true
    }
  }
};

export default function NLPVisualizationDemo() {
  const [query, setQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('query');
  const [recognizedIntent, setRecognizedIntent] = useState<DemoIntent | null>(null);
  const [visualizationResult, setVisualizationResult] = useState<VisualizationResult | null>(null);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [enableRealTime, setEnableRealTime] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15000); // 15 seconds default

  const processQuery = (inputQuery: string) => {
    setUserQuery(inputQuery);
    setProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      // Find matching example or use default
      const resultKey = queryToResultMap[inputQuery] || Object.keys(queryToResultMap)[0];
      
      // Set recognized intent
      setRecognizedIntent(sampleIntents[resultKey]);
      
      // Simulate API processing delay
      setTimeout(() => {
        // Set visualization result
        setVisualizationResult(sampleResults[resultKey]);
        setProcessing(false);
        setActiveTab('result');
      }, 1000);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      processQuery(query);
    }
  };

  const handleExampleClick = (example: string) => {
    setSelectedExample(example);
    setQuery(example);
    processQuery(example);
  };

  // Helper function to map metrics to data sources
  const mapChartTypeToDataSource = (metrics: string[]): DataSourceType => {
    if (!metrics || metrics.length === 0) return 'health_metrics';
    
    const metric = metrics[0].toLowerCase();
    
    if (metric.includes('sleep') || metric.includes('rest')) {
      return 'sleep_data';
    } else if (metric.includes('weight') || metric.includes('bmi')) {
      return 'weight_log';
    } else if (
      metric.includes('cholesterol') || 
      metric.includes('ldl') || 
      metric.includes('hdl') || 
      metric.includes('triglycerides')
    ) {
      return 'blood_test';
    } else {
      return 'health_metrics';
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Natural Language Health Visualization Demo</h1>
      <p className="text-gray-600 mb-8">
        See how our AI converts natural language queries into health visualizations
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="shadow-lg h-full">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary-dark/10">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Ask about your health data
              </CardTitle>
              <CardDescription>
                Try one of our examples or enter your own query
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex space-x-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Show me my heart rate for the last week"
                    className="flex-1"
                  />
                  <Button type="submit" disabled={processing}>
                    {processing ? (
                      <div className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                        Processing
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Send <ChevronRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </form>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Example queries:</h3>
                {sampleQueries.map((example, idx) => (
                  <Button
                    key={idx}
                    variant={selectedExample === example ? "default" : "outline"}
                    size="sm"
                    className="mr-2 mb-2 text-left justify-start"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query">User Query</TabsTrigger>
              <TabsTrigger value="intent">NLP Intent</TabsTrigger>
              <TabsTrigger value="result">Visualization</TabsTrigger>
            </TabsList>
            <TabsContent value="query" className="border rounded-lg p-4 shadow-sm">
              {userQuery ? (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Natural Language Query</h3>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-gray-800">{userQuery}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    This natural language query is analyzed to extract health metrics, time ranges, chart types, and other parameters.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Enter a query or select an example to see the NLP processing flow</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="intent" className="border rounded-lg p-4 shadow-sm">
              {recognizedIntent ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Recognized Intent</h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">Confidence:</span>
                      <div className="bg-gray-200 w-32 h-3 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            recognizedIntent.confidence > 0.7 
                              ? 'bg-green-500' 
                              : recognizedIntent.confidence > 0.5 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${recognizedIntent.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        {Math.round(recognizedIntent.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">Intent Type</p>
                      <p className="text-gray-800 flex items-center">
                        {recognizedIntent.intentType === 'chart' && <BarChart className="mr-2 h-4 w-4 text-primary" />}
                        {recognizedIntent.intentType === 'dashboard' && <Activity className="mr-2 h-4 w-4 text-primary" />}
                        {recognizedIntent.intentType === 'insights' && <Award className="mr-2 h-4 w-4 text-primary" />}
                        {recognizedIntent.intentType.charAt(0).toUpperCase() + recognizedIntent.intentType.slice(1)}
                      </p>
                    </div>
                    
                    {recognizedIntent.entities.chartType && (
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">Chart Type</p>
                        <p className="text-gray-800 flex items-center">
                          {recognizedIntent.entities.chartType === 'line' && <LineChart className="mr-2 h-4 w-4 text-primary" />}
                          {recognizedIntent.entities.chartType === 'bar' && <BarChart className="mr-2 h-4 w-4 text-primary" />}
                          {recognizedIntent.entities.chartType === 'pie' && <PieChart className="mr-2 h-4 w-4 text-primary" />}
                          {recognizedIntent.entities.chartType.charAt(0).toUpperCase() + recognizedIntent.entities.chartType.slice(1)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {recognizedIntent.entities.metrics && recognizedIntent.entities.metrics.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Metrics</p>
                        <div className="flex flex-wrap gap-2">
                          {recognizedIntent.entities.metrics.map((metric, idx) => (
                            <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {recognizedIntent.entities.dataSource && recognizedIntent.entities.dataSource.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Data Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {recognizedIntent.entities.dataSource.map((source, idx) => (
                            <span key={idx} className="px-2 py-1 bg-accent/10 text-accent rounded-full text-sm">
                              {source.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {recognizedIntent.entities.timeRange && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Time Range</p>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          {recognizedIntent.entities.timeRange.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    
                    {recognizedIntent.entities.includeReferenceRanges !== undefined && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Reference Ranges</p>
                        <span className={`px-2 py-1 ${
                          recognizedIntent.entities.includeReferenceRanges 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        } rounded-full text-sm`}>
                          {recognizedIntent.entities.includeReferenceRanges ? 'Included' : 'Not included'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Enter a query to see the recognized intent</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="result" className="border rounded-lg p-4 shadow-sm">
              {visualizationResult ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Generated Visualization</h3>
                    
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="real-time-mode"
                          checked={enableRealTime}
                          onCheckedChange={setEnableRealTime}
                        />
                        <Label htmlFor="real-time-mode" className="text-sm">Real-time updates</Label>
                      </div>
                      
                      {!enableRealTime && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            // Simulate a refresh by setting processing state
                            setProcessing(true);
                            // Then clearing it after a delay
                            setTimeout(() => setProcessing(false), 1000);
                          }}
                          className="text-sm"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Refresh
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg overflow-hidden">
                    {enableRealTime ? (
                      // Real-time visualization with WebSocket updates
                      visualizationResult.type === 'chart' ? (
                        <RealTimeVisualization
                          type="chart"
                          initialData={visualizationResult.data}
                          dataSource={mapChartTypeToDataSource(visualizationResult.data.metrics)}
                          metrics={visualizationResult.data.metrics}
                          timeRange={visualizationResult.data.timeRange}
                          refreshInterval={refreshInterval}
                          autoRefresh={true}
                          showControls={true}
                        />
                      ) : visualizationResult.type === 'dashboard' ? (
                        <RealTimeVisualization
                          type="dashboard"
                          initialData={visualizationResult.data}
                          dataSource={[
                            'health_metrics' as DataSourceType, 
                            'sleep_data' as DataSourceType, 
                            'weight_log' as DataSourceType, 
                            'blood_test' as DataSourceType
                          ]}
                          timeRange={visualizationResult.data.timeRange}
                          refreshInterval={refreshInterval}
                          autoRefresh={true}
                          showControls={true}
                        />
                      ) : (
                        <RealTimeVisualization
                          type="insights"
                          initialData={visualizationResult.data}
                          dataSource={mapChartTypeToDataSource(visualizationResult.data.metrics)}
                          metrics={visualizationResult.data.metrics}
                          timeRange={visualizationResult.data.timeRange}
                          refreshInterval={refreshInterval}
                          autoRefresh={true}
                          showControls={true}
                        />
                      )
                    ) : (
                      // Static visualization (original implementation)
                      visualizationResult.type === 'chart' ? (
                        <ChartVisualization data={visualizationResult.data} />
                      ) : visualizationResult.type === 'dashboard' ? (
                        <DashboardVisualization data={visualizationResult.data} />
                      ) : (
                        <HealthInsightsVisualization data={visualizationResult.data} />
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Enter a query to generate a visualization</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="mt-12 bg-primary/5 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <span className="font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold">Natural Language Processing</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Your query is analyzed using pattern recognition to identify relevant health metrics,
              data sources, time ranges, and visualization preferences.
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <span className="font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold">Intent Recognition</h3>
            </div>
            <p className="text-gray-600 text-sm">
              The system determines whether you want a chart, dashboard, or health insights based on your
              language and calculates a confidence score for the interpretation.
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <span className="font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold">Visualization Generation</h3>
            </div>
            <p className="text-gray-600 text-sm">
              If confidence is high, your visualization is generated directly. For complex queries,
              the system uses AI to interpret your request and create the appropriate visualization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
