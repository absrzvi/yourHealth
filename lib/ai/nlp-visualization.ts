/**
 * Natural Language Processing for Visualization Requests
 * 
 * This module enhances the AI Coach's ability to understand natural language
 * requests for health data visualizations and convert them to structured function calls.
 */

import { DataSource, ChartType, TimeRange } from './functions';

/**
 * Interface for recognized visualization intent
 */
export interface VisualizationIntent {
  intentType: 'chart' | 'dashboard' | 'insights' | 'unknown';
  confidence: number;
  entities: {
    dataSource?: DataSource[];
    metrics?: string[];
    chartType?: ChartType;
    timeRange?: string;
    customStartDate?: string;
    customEndDate?: string;
    includeReferenceRanges?: boolean;
    title?: string;
  };
  originalQuery: string;
}

/**
 * Patterns for recognizing chart types from natural language
 */
const chartTypePatterns = [
  { type: ChartType.LINE, patterns: ['line chart', 'line graph', 'trend', 'over time', 'progress', 'tracking'] },
  { type: ChartType.BAR, patterns: ['bar chart', 'bar graph', 'histogram', 'compare', 'comparing', 'comparison'] },
  { type: ChartType.PIE, patterns: ['pie chart', 'distribution', 'breakdown', 'proportion', 'percentage'] },
  { type: ChartType.AREA, patterns: ['area chart', 'area graph', 'cumulative', 'stacked'] },
  { type: ChartType.SCATTER, patterns: ['scatter plot', 'scatter chart', 'correlation', 'relationship', 'versus', 'vs'] },
  { type: ChartType.RADAR, patterns: ['radar chart', 'spider chart', 'web chart', 'star chart'] },
];

/**
 * Patterns for recognizing data sources from natural language
 */
const dataSourcePatterns = [
  { source: DataSource.HEALTH_METRICS, patterns: ['health metrics', 'vitals', 'vital signs'] },
  { source: DataSource.BLOOD_TEST, patterns: ['blood test', 'blood work', 'lab results', 'laboratory', 'bloodwork'] },
  { source: DataSource.WEIGHT_LOG, patterns: ['weight', 'body weight', 'weight log', 'scale', 'pounds', 'kilograms', 'kg', 'lbs'] },
  { source: DataSource.SLEEP_DATA, patterns: ['sleep', 'sleep duration', 'sleep quality', 'rest', 'nap', 'sleeping'] },
  { source: DataSource.EXERCISE_LOG, patterns: ['exercise', 'workout', 'activity', 'fitness', 'physical activity', 'training', 'run', 'cardio'] },
  { source: DataSource.NUTRITION_LOG, patterns: ['nutrition', 'diet', 'food', 'eating', 'meal', 'calorie', 'calories', 'macros', 'protein'] },
  { source: DataSource.MICROBIOME, patterns: ['microbiome', 'gut health', 'gut', 'bacteria', 'flora'] },
];

/**
 * Patterns for recognizing common health metrics from natural language
 */
const metricPatterns = [
  { metric: 'Heart Rate', patterns: ['heart rate', 'pulse', 'bpm', 'beats per minute'] },
  { metric: 'Blood Pressure Systolic', patterns: ['systolic', 'systolic pressure', 'upper blood pressure'] },
  { metric: 'Blood Pressure Diastolic', patterns: ['diastolic', 'diastolic pressure', 'lower blood pressure'] },
  { metric: 'Blood Pressure', patterns: ['blood pressure', 'bp'] },
  { metric: 'Weight', patterns: ['weight', 'body weight', 'pounds', 'kilograms', 'kg', 'lbs'] },
  { metric: 'BMI', patterns: ['bmi', 'body mass index'] },
  { metric: 'Steps', patterns: ['steps', 'step count', 'walking', 'daily steps'] },
  { metric: 'Sleep Duration', patterns: ['sleep duration', 'sleep time', 'hours of sleep', 'sleep hours'] },
  { metric: 'Sleep Quality', patterns: ['sleep quality', 'sleep efficiency'] },
  { metric: 'Glucose', patterns: ['glucose', 'blood sugar', 'blood glucose'] },
  { metric: 'LDL Cholesterol', patterns: ['ldl', 'ldl cholesterol', 'bad cholesterol', 'low-density lipoprotein'] },
  { metric: 'HDL Cholesterol', patterns: ['hdl', 'hdl cholesterol', 'good cholesterol', 'high-density lipoprotein'] },
  { metric: 'Total Cholesterol', patterns: ['total cholesterol', 'cholesterol'] },
  { metric: 'Triglycerides', patterns: ['triglycerides', 'trigs'] },
  { metric: 'Calories', patterns: ['calories', 'caloric intake', 'energy intake'] },
  { metric: 'Protein', patterns: ['protein', 'protein intake'] },
  { metric: 'Carbohydrates', patterns: ['carbs', 'carbohydrates', 'carb intake'] },
  { metric: 'Fat', patterns: ['fat', 'fat intake', 'dietary fat'] },
];

/**
 * Patterns for recognizing time ranges from natural language
 */
const timeRangePatterns = [
  { range: TimeRange.LAST_WEEK, patterns: ['last week', 'past week', 'previous week', 'week', 'weekly', '7 days'] },
  { range: TimeRange.LAST_MONTH, patterns: ['last month', 'past month', 'previous month', 'month', 'monthly', '30 days', 'four weeks'] },
  { range: TimeRange.LAST_3_MONTHS, patterns: ['last 3 months', 'past 3 months', 'last three months', 'past three months', 'quarter', 'quarterly', '90 days'] },
  { range: TimeRange.LAST_6_MONTHS, patterns: ['last 6 months', 'past 6 months', 'last six months', 'past six months', 'half year', 'biannual', '180 days'] },
  { range: TimeRange.LAST_YEAR, patterns: ['last year', 'past year', 'previous year', 'year', 'annual', 'annually', '365 days', '12 months'] },
  { range: TimeRange.CUSTOM, patterns: ['custom', 'specific dates', 'date range', 'between', 'from', 'custom range'] },
];

/**
 * Intent recognition for visualization requests
 * Parses a natural language query and extracts structured intent and entities
 */
export function recognizeVisualizationIntent(query: string): VisualizationIntent {
  query = query.toLowerCase();
  
  // Default response with unknown intent
  const intent: VisualizationIntent = {
    intentType: 'unknown',
    confidence: 0,
    entities: {},
    originalQuery: query
  };
  
  // Check for chart intent
  const chartPatterns = ['chart', 'graph', 'plot', 'visualization', 'visualize', 'show me', 'display', 'trend'];
  const hasChartIntent = chartPatterns.some(pattern => query.includes(pattern));
  
  // Check for dashboard intent
  const dashboardPatterns = ['dashboard', 'overview', 'summary', 'all metrics', 'multiple charts', 'health snapshot'];
  const hasDashboardIntent = dashboardPatterns.some(pattern => query.includes(pattern));
  
  // Check for insights intent
  const insightsPatterns = ['insight', 'analysis', 'analyze', 'interpret', 'what does this mean', 'explain', 'recommendation'];
  const hasInsightsIntent = insightsPatterns.some(pattern => query.includes(pattern));
  
  // Determine primary intent
  if (hasDashboardIntent) {
    intent.intentType = 'dashboard';
    intent.confidence = 0.8;
  } else if (hasInsightsIntent) {
    intent.intentType = 'insights';
    intent.confidence = 0.7;
  } else if (hasChartIntent) {
    intent.intentType = 'chart';
    intent.confidence = 0.6;
  }
  
  // Extract chart type
  chartTypePatterns.forEach(({ type, patterns }) => {
    if (patterns.some(pattern => query.includes(pattern))) {
      intent.entities.chartType = type;
      intent.confidence += 0.1;
    }
  });
  
  // Extract data sources
  const sources: DataSource[] = [];
  dataSourcePatterns.forEach(({ source, patterns }) => {
    if (patterns.some(pattern => query.includes(pattern))) {
      sources.push(source);
      intent.confidence += 0.05;
    }
  });
  
  if (sources.length > 0) {
    intent.entities.dataSource = sources;
  }
  
  // Extract metrics
  const metrics: string[] = [];
  metricPatterns.forEach(({ metric, patterns }) => {
    if (patterns.some(pattern => query.includes(pattern))) {
      metrics.push(metric);
      intent.confidence += 0.05;
    }
  });
  
  if (metrics.length > 0) {
    intent.entities.metrics = metrics;
  }
  
  // Extract time range
  timeRangePatterns.forEach(({ range, patterns }) => {
    if (patterns.some(pattern => query.includes(pattern))) {
      intent.entities.timeRange = range;
      intent.confidence += 0.05;
    }
  });
  
  // Extract reference range intent
  if (query.includes('reference') || query.includes('normal range') || 
      query.includes('healthy range') || query.includes('target') || 
      query.includes('benchmark')) {
    intent.entities.includeReferenceRanges = true;
    intent.confidence += 0.05;
  }
  
  // Extract dates for custom range
  if (intent.entities.timeRange === TimeRange.CUSTOM) {
    // This is a simplified date extraction - in production we would use a proper date parser
    const fromMatch = query.match(/from\s+(\w+\s+\d+(?:st|nd|rd|th)?,?\s+\d{4})/i);
    const toMatch = query.match(/to\s+(\w+\s+\d+(?:st|nd|rd|th)?,?\s+\d{4})/i);
    
    if (fromMatch && fromMatch[1]) {
      intent.entities.customStartDate = fromMatch[1];
    }
    
    if (toMatch && toMatch[1]) {
      intent.entities.customEndDate = toMatch[1];
    }
  }
  
  // Extract title if user specifies one
  const titleMatch = query.match(/title[d:]?\s+["']([^"']+)["']/i);
  if (titleMatch && titleMatch[1]) {
    intent.entities.title = titleMatch[1];
  }
  
  return intent;
}

/**
 * Converts recognized intent to function call arguments
 */
export function intentToFunctionArgs(intent: VisualizationIntent): any {
  switch (intent.intentType) {
    case 'chart':
      return {
        dataSource: intent.entities.dataSource?.[0] || DataSource.HEALTH_METRICS,
        metrics: intent.entities.metrics || ['Heart Rate'],
        chartType: intent.entities.chartType || ChartType.LINE,
        timeRange: intent.entities.timeRange || TimeRange.LAST_MONTH,
        customStartDate: intent.entities.customStartDate,
        customEndDate: intent.entities.customEndDate,
        includeReferenceRanges: intent.entities.includeReferenceRanges || false,
        title: intent.entities.title || `${intent.entities.metrics?.[0] || 'Health Metric'} Chart`
      };
      
    case 'dashboard':
      return {
        dataSources: intent.entities.dataSource || [DataSource.HEALTH_METRICS],
        timeRange: intent.entities.timeRange || TimeRange.LAST_MONTH,
        customStartDate: intent.entities.customStartDate,
        customEndDate: intent.entities.customEndDate,
        includeReferenceRanges: intent.entities.includeReferenceRanges || true,
        title: intent.entities.title || 'Health Dashboard'
      };
      
    case 'insights':
      return {
        dataSource: intent.entities.dataSource?.[0] || DataSource.HEALTH_METRICS,
        metrics: intent.entities.metrics || undefined,
        timeRange: intent.entities.timeRange || TimeRange.LAST_MONTH,
        customStartDate: intent.entities.customStartDate,
        customEndDate: intent.entities.customEndDate,
        includeRecommendations: true,
        title: intent.entities.title || 'Health Insights'
      };
      
    default:
      return null;
  }
}

/**
 * Generates prompt templates for the AI assistant to help recognize visualization intents
 */
export function generateVisualizationPromptTemplate(userQuery: string): string {
  const intent = recognizeVisualizationIntent(userQuery);
  
  if (intent.intentType === 'unknown' || intent.confidence < 0.4) {
    return `
      Based on the user's query: "${userQuery}"
      
      If they're asking for a visualization of health data, decide which type of visualization would be most appropriate:
      - Use a CHART function when they want a single chart for one or a few metrics
      - Use a DASHBOARD function when they want a comprehensive overview with multiple charts
      - Use a HEALTH INSIGHTS function when they want analysis and recommendations
      
      If they specify metrics like blood pressure, cholesterol, weight, etc., include those in your function call.
      If they specify a time period like "last week" or "past month", include that as timeRange.
      
      If they're not asking for a visualization, respond conversationally.
    `;
  }
  
  // Specific templates based on detected intent
  switch (intent.intentType) {
    case 'chart':
      return `
        The user is asking for a CHART visualization: "${userQuery}"
        
        Use the generate_chart function with these parameters:
        - dataSource: ${intent.entities.dataSource?.[0] || 'Determine from context'}
        - metrics: ${intent.entities.metrics?.join(', ') || 'Determine from context'}
        - chartType: ${intent.entities.chartType || 'Suggest appropriate chart type'}
        - timeRange: ${intent.entities.timeRange || 'LAST_MONTH'}
        - includeReferenceRanges: ${intent.entities.includeReferenceRanges || 'false'}
        
        If the user didn't specify all parameters, use your best judgment to fill in the gaps.
      `;
      
    case 'dashboard':
      return `
        The user is asking for a DASHBOARD visualization: "${userQuery}"
        
        Use the generate_dashboard function with these parameters:
        - dataSources: ${intent.entities.dataSource?.join(', ') || 'Include relevant health data sources'}
        - timeRange: ${intent.entities.timeRange || 'LAST_MONTH'}
        - includeReferenceRanges: true
        
        A dashboard provides an overview of multiple health metrics at once.
      `;
      
    case 'insights':
      return `
        The user is asking for HEALTH INSIGHTS: "${userQuery}"
        
        Use the generate_health_insights function with these parameters:
        - dataSource: ${intent.entities.dataSource?.[0] || 'Determine from context'}
        - metrics: ${intent.entities.metrics?.join(', ') || 'All relevant metrics'}
        - timeRange: ${intent.entities.timeRange || 'LAST_MONTH'}
        - includeRecommendations: true
        
        Health insights analyze trends and provide actionable recommendations.
      `;
      
    default:
      return '';
  }
}
