/**
 * Service for generating chart and dashboard visualizations 
 * based on OpenAI function call arguments
 */
import { prisma } from '@/lib/db';
import { ChartType, DataSource, TimeRange } from './functions';

// Reference ranges for common health metrics
const REFERENCE_RANGES: Record<string, { min: number; max: number }> = {
  'LDL Cholesterol': { min: 0, max: 100 },
  'HDL Cholesterol': { min: 40, max: 60 },
  'Total Cholesterol': { min: 125, max: 200 },
  'Triglycerides': { min: 0, max: 150 },
  'Glucose': { min: 70, max: 100 },
  'HbA1c': { min: 4, max: 5.7 },
  'Blood Pressure Systolic': { min: 90, max: 120 },
  'Blood Pressure Diastolic': { min: 60, max: 80 },
  'Heart Rate': { min: 60, max: 100 },
  'BMI': { min: 18.5, max: 24.9 },
  'Weight': { min: 0, max: 0 }, // Personalized
  'Sleep Duration': { min: 7, max: 9 },
  'Steps': { min: 7000, max: 10000 },
};

interface ChartDataPoint {
  date: string;
  value: number;
  metric: string;
  referenceMin?: number;
  referenceMax?: number;
}

export interface GeneratedVisualization {
  type: 'chart' | 'dashboard' | 'insights';
  data: any;
  chartData?: ChartDataPoint[];
  error?: string;
}

/**
 * Process generate_chart function arguments and produce chart data
 */
export async function generateChart(args: any, userId: string): Promise<GeneratedVisualization> {
  try {
    const { 
      chartType, 
      title, 
      subtitle, 
      dataSource, 
      metrics, 
      timeRange,
      customStartDate,
      customEndDate,
      includeReferenceRanges,
    } = args;

    // Validate required arguments
    if (!chartType || !dataSource || !metrics || !timeRange) {
      return {
        type: 'chart',
        data: args,
        error: 'Missing required chart parameters',
      };
    }
    
    // Calculate date range based on timeRange
    const { startDate, endDate } = calculateDateRange(timeRange, customStartDate, customEndDate);
    
    // Fetch data based on dataSource
    const chartData = await fetchDataForSource(dataSource, metrics, startDate, endDate, userId, includeReferenceRanges);
    
    // Process the data for the specific chart type
    const formattedData = formatDataForChartType(chartType, metrics, chartData);
    
    // Add reference ranges if requested
    const referenceRanges: Record<string, { min: number; max: number }> = {};
    if (includeReferenceRanges) {
      metrics.forEach(metric => {
        if (REFERENCE_RANGES[metric]) {
          referenceRanges[metric] = REFERENCE_RANGES[metric];
        }
      });
    }
    
    // Return formatted visualization data
    return {
      type: 'chart',
      data: {
        ...args,
        data: formattedData,
        referenceRanges,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error generating chart:', error);
    return {
      type: 'chart',
      data: args,
      error: error instanceof Error ? error.message : 'Unknown error generating chart',
    };
  }
}

/**
 * Process generate_dashboard function arguments and produce dashboard data
 */
export async function generateDashboard(args: any, userId: string): Promise<GeneratedVisualization> {
  try {
    const { title, subtitle, panels, layout, refreshInterval, colorScheme } = args;

    if (!panels || !Array.isArray(panels) || panels.length === 0) {
      return {
        type: 'dashboard',
        data: args,
        error: 'Dashboard requires at least one panel',
      };
    }

    // Process each panel to generate chart data
    const panelsWithData = await Promise.all(
      panels.map(async (panel) => {
        const chartResult = await generateChart(panel, userId);
        return {
          ...panel,
          chartData: chartResult.chartData,
          error: chartResult.error,
        };
      })
    );

    return {
      type: 'dashboard',
      data: {
        ...args,
        panels: panelsWithData,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error generating dashboard:', error);
    return {
      type: 'dashboard',
      data: args,
      error: error instanceof Error ? error.message : 'Unknown error generating dashboard',
    };
  }
}

/**
 * Process generate_health_insights function arguments and produce insights
 */
export async function generateHealthInsights(args: any, userId: string): Promise<GeneratedVisualization> {
  try {
    const { 
      dataSource, 
      metrics, 
      timeRange,
      customStartDate,
      customEndDate,
      insightTypes,
      includeVisualization,
    } = args;

    // Validate required arguments
    if (!dataSource || !metrics || !timeRange) {
      return {
        type: 'insights',
        data: args,
        error: 'Missing required insight parameters',
      };
    }
    
    // Calculate date range based on timeRange
    const { startDate, endDate } = calculateDateRange(timeRange, customStartDate, customEndDate);
    
    // Fetch data based on dataSource
    const chartData = await fetchDataForSource(dataSource, metrics, startDate, endDate, userId, true);
    
    // In a real implementation, we would analyze the data here to generate insights
    // For now, we'll return placeholder data
    
    return {
      type: 'insights',
      data: {
        ...args,
        generatedAt: new Date().toISOString(),
      },
      chartData: includeVisualization ? chartData : undefined,
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      type: 'insights',
      data: args,
      error: error instanceof Error ? error.message : 'Unknown error generating insights',
    };
  }
}

/**
 * Fetch data from the specified data source for visualization
 */
async function fetchDataForSource(
  dataSource: string, 
  metrics: string[], 
  startDate: Date, 
  endDate: Date, 
  userId: string,
  includeReferenceRanges: boolean = false
): Promise<ChartDataPoint[]> {
  // In a real implementation, this would fetch actual data from the database
  // For now, we'll generate synthetic data for demonstration purposes
  
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate dates within the range
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Generate data points for each metric on each date
  const dataPoints: ChartDataPoint[] = [];
  
  for (const metric of metrics) {
    const baseValue = getBaselineValueForMetric(metric);
    const variability = baseValue * 0.2; // 20% variability
    
    for (const date of dates) {
      // Generate a value with some randomness and a slight trend
      const trend = (date.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime()) * 0.1;
      const randomFactor = Math.random() * variability - (variability / 2);
      const value = baseValue + baseValue * trend + randomFactor;
      
      const dataPoint: ChartDataPoint = {
        date: date.toISOString().split('T')[0],
        value: Number(value.toFixed(2)),
        metric,
      };
      
      // Add reference ranges if requested
      if (includeReferenceRanges && REFERENCE_RANGES[metric]) {
        dataPoint.referenceMin = REFERENCE_RANGES[metric].min;
        dataPoint.referenceMax = REFERENCE_RANGES[metric].max;
      }
      
      dataPoints.push(dataPoint);
    }
  }
  
  return dataPoints;
}

/**
 * Get a baseline value for a specific health metric
 */
function getBaselineValueForMetric(metric: string): number {
  // Provide realistic baseline values for common health metrics
  switch (metric) {
    case 'LDL Cholesterol': return 100;
    case 'HDL Cholesterol': return 50;
    case 'Total Cholesterol': return 180;
    case 'Triglycerides': return 120;
    case 'Glucose': return 85;
    case 'HbA1c': return 5.5;
    case 'Blood Pressure Systolic': return 120;
    case 'Blood Pressure Diastolic': return 80;
    case 'Heart Rate': return 75;
    case 'BMI': return 24;
    case 'Weight': return 70;
    case 'Sleep Duration': return 7.5;
    case 'Steps': return 8000;
    default: return 100;
  }
}

/**
 * Calculate start and end dates based on timeRange
 */
function calculateDateRange(
  timeRange: string, 
  customStartDate?: string, 
  customEndDate?: string
): { startDate: Date; endDate: Date } {
  let endDate = new Date();
  let startDate = new Date();
  
  switch (timeRange) {
    case TimeRange.LAST_WEEK:
      startDate.setDate(endDate.getDate() - 7);
      break;
    case TimeRange.LAST_MONTH:
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case TimeRange.LAST_3_MONTHS:
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case TimeRange.LAST_6_MONTHS:
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case TimeRange.LAST_YEAR:
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case TimeRange.CUSTOM:
      if (customStartDate) {
        startDate = new Date(customStartDate);
      } else {
        startDate.setMonth(endDate.getMonth() - 1); // Default to last month
      }
      
      if (customEndDate) {
        endDate = new Date(customEndDate);
      }
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 1); // Default to last month
  }
  
  // Reset hours to get full days
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Format data for the specific chart type
 */
export function formatDataForChartType(chartType: string, metrics: string[], chartData: ChartDataPoint[]) {
  if (!chartData || chartData.length === 0) return [];

  switch (chartType) {
    case ChartType.LINE:
    case ChartType.BAR:
    case ChartType.AREA:
      // Group by date and combine metrics
      const dateMap = new Map<string, any>();
      
      chartData.forEach(point => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }
        
        const entry = dateMap.get(point.date);
        entry[point.metric] = point.value;
      });
      
      return Array.from(dateMap.values());
    
    case ChartType.PIE:
      // For pie charts, sum up the latest values for each metric
      const latestData = metrics.map(metric => {
        const points = chartData.filter(point => point.metric === metric);
        const latestPoint = points.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
        return {
          name: metric,
          value: latestPoint ? latestPoint.value : 0,
        };
      });
      
      return latestData;
      
    case ChartType.SCATTER:
      // Just return the raw data points
      return chartData.map(point => ({
        x: point.date,
        y: point.value,
        metric: point.metric,
      }));
      
    default:
      return chartData;
  }
}

/**
 * Generate trends from time series data
 */
export function generateTrendsFromData(data: ChartDataPoint[], metrics: string[]) {
  const trends: any[] = [];
  
  // Process each metric
  metrics.forEach(metric => {
    const metricPoints = data.filter(point => point.metric === metric)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (metricPoints.length < 2) return; // Need at least 2 points for a trend
    
    const firstPoint = metricPoints[0];
    const lastPoint = metricPoints[metricPoints.length - 1];
    
    const previousValue = firstPoint.value;
    const currentValue = lastPoint.value;
    const changeValue = currentValue - previousValue;
    const changePercent = (changeValue / previousValue) * 100;
    
    // Determine if the change is positive based on the metric
    // For most metrics, increasing is good, but for some (like LDL), decreasing is good
    let isPositive = changeValue > 0;
    if (['LDL Cholesterol', 'Triglycerides', 'Blood Pressure Systolic', 'Blood Pressure Diastolic'].includes(metric)) {
      isPositive = changeValue < 0;
    }
    
    // Get reference range if available
    const referenceRange = REFERENCE_RANGES[metric] || undefined;
    
    trends.push({
      metric,
      value: currentValue,
      previousValue,
      changePercent,
      changeDirection: changeValue > 0 ? 'increase' : (changeValue < 0 ? 'decrease' : 'no-change'),
      isPositive,
      referenceRange,
    });
  });
  
  return trends;
}

/**
 * Generate insights based on trends
 */
export function generateInsightsFromTrends(trends: any[], data: ChartDataPoint[]) {
  const insights: any[] = [];
  
  // Check for out-of-range values
  const outOfRangeMetrics = trends.filter(trend => {
    if (!trend.referenceRange) return false;
    return trend.value < trend.referenceRange.min || trend.value > trend.referenceRange.max;
  });
  
  if (outOfRangeMetrics.length > 0) {
    outOfRangeMetrics.forEach(metric => {
      const isHigh = metric.value > metric.referenceRange.max;
      insights.push({
        title: `${metric.metric} is ${isHigh ? 'above' : 'below'} the recommended range`,
        description: `Your ${metric.metric} is ${isHigh ? 'higher' : 'lower'} than the recommended range of ${metric.referenceRange.min}-${metric.referenceRange.max}. ${getRecommendationForMetric(metric.metric, isHigh)}`,
        severity: isHigh ? 'warning' : 'info',
        actionable: true,
        action: `Learn more about optimizing your ${metric.metric}`,
      });
    });
  }
  
  // Check for positive trends
  const positiveChanges = trends.filter(trend => 
    Math.abs(trend.changePercent) > 5 && trend.isPositive
  );
  
  if (positiveChanges.length > 0) {
    positiveChanges.forEach(metric => {
      insights.push({
        title: `Your ${metric.metric} is improving`,
        description: `Your ${metric.metric} has improved by ${Math.abs(metric.changePercent).toFixed(1)}% since your last measurement. Keep up the good work!`,
        severity: 'success',
        actionable: false,
      });
    });
  }
  
  // Check for negative trends
  const negativeChanges = trends.filter(trend => 
    Math.abs(trend.changePercent) > 5 && !trend.isPositive
  );
  
  if (negativeChanges.length > 0) {
    negativeChanges.forEach(metric => {
      insights.push({
        title: `Your ${metric.metric} is trending in the wrong direction`,
        description: `Your ${metric.metric} has changed by ${Math.abs(metric.changePercent).toFixed(1)}% in an unfavorable direction. ${getRecommendationForMetric(metric.metric, metric.value > metric.previousValue)}`,
        severity: 'warning',
        actionable: true,
        action: `Get personalized recommendations for ${metric.metric}`,
      });
    });
  }
  
  // Add a general insight if we don't have many specific ones
  if (insights.length < 2) {
    insights.push({
      title: 'Consistent tracking leads to better insights',
      description: 'Regular monitoring of your health metrics will help us provide more personalized recommendations and identify trends earlier.',
      severity: 'info',
      actionable: true,
      action: 'Set up tracking reminders',
    });
  }
  
  return insights;
}

/**
 * Generate summary text based on insights and trends
 */
export function generateSummaryFromInsights(insights: any[], trends: any[]): string {
  const outOfRangeCount = trends.filter(t => {
    if (!t.referenceRange) return false;
    return t.value < t.referenceRange.min || t.value > t.referenceRange.max;
  }).length;
  
  const positiveChanges = trends.filter(t => t.isPositive && Math.abs(t.changePercent) > 3).length;
  const negativeChanges = trends.filter(t => !t.isPositive && Math.abs(t.changePercent) > 3).length;
  
  if (outOfRangeCount > 1) {
    return `You have ${outOfRangeCount} metrics outside their recommended ranges. Review the insights below for specific recommendations to improve these areas.`;
  } else if (outOfRangeCount === 1) {
    return `One of your metrics is outside its recommended range. Check the insights below for specific recommendations.`;
  } else if (positiveChanges > negativeChanges) {
    return `Your health metrics are showing positive trends overall. ${positiveChanges} metrics have improved since your last measurements.`;
  } else if (negativeChanges > positiveChanges) {
    return `Some of your health metrics could use attention. ${negativeChanges} metrics are trending in an unfavorable direction.`;
  } else {
    return `Your health metrics are generally within normal ranges. Continue monitoring to detect any changes early.`;
  }
}

/**
 * Get recommendation text for a specific metric
 */
export function getRecommendationForMetric(metric: string, isHigh: boolean): string {
  switch(metric) {
    case 'LDL Cholesterol':
      return isHigh ? 'Consider increasing fiber intake and reducing saturated fats.' : 'Speak with your healthcare provider about this result.';    
    case 'HDL Cholesterol':
      return isHigh ? 'This is generally positive! HDL is often considered "good" cholesterol.' : 'Consider increasing physical activity and consuming healthy fats like olive oil and fatty fish.';    
    case 'Blood Pressure Systolic':
    case 'Blood Pressure Diastolic':
      return isHigh ? 'Consider reducing sodium intake, increasing physical activity, and managing stress.' : 'Low blood pressure can cause dizziness - speak with your healthcare provider if you experience symptoms.';    
    case 'Glucose':
      return isHigh ? 'Consider reducing sugar and refined carbohydrate intake.' : "Ensure you're consuming adequate calories and not skipping meals.";    
    case 'Steps':
      return isHigh ? 'Great job staying active!' : 'Try setting a daily step goal and gradually increasing it.';    
    case 'Sleep Duration':
      return isHigh ? 'While adequate sleep is important, consistently sleeping more than 9 hours may be worth discussing with your healthcare provider.' : 'Aim for 7-9 hours of sleep. Consider establishing a regular sleep schedule and limiting screen time before bed.';    
    case 'Heart Rate':
      return isHigh ? 'Consider stress management techniques and ensure you\'re well-hydrated.' : 'Low resting heart rate can be a sign of good cardiovascular fitness.';    
    case 'Weight':
      return isHigh ? 'Focus on balanced nutrition and regular physical activity.' : "Ensure you're consuming adequate nutrition.";    
    default:
      return 'Consider discussing this result with your healthcare provider.';    
  }
}

export default {
  generateChart,
  generateDashboard,
  generateHealthInsights,
};
