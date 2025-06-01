import { ChartDataPoint } from '@/components/charts/DynamicChart';

export const generateSampleData = (type: string, count: number = 7): ChartDataPoint[] => {
  const now = new Date();
  const data: ChartDataPoint[] = [];

  // Common data for time series
  if (['line', 'area', 'bar'].includes(type)) {
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100) + 20,
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return data;
  }

  // Data for categorical charts
  if (['pie', 'radar', 'bar'].includes(type)) {
    const categories = ['Exercise', 'Nutrition', 'Sleep', 'Stress', 'Hydration'];
    return categories.map((category, index) => ({
      name: category,
      value: Math.floor(Math.random() * 80) + 20,
      category
    }));
  }

  // Default fallback
  return Array.from({ length: count }, (_, i) => ({
    name: `Item ${i + 1}`,
    value: Math.floor(Math.random() * 100) + 1
  }));
};

export const getChartTypeFromQuery = (query: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('line')) return 'line';
  if (lowerQuery.includes('bar')) return 'bar';
  if (lowerQuery.includes('pie')) return 'pie';
  if (lowerQuery.includes('area')) return 'area';
  if (lowerQuery.includes('radar')) return 'radar';
  
  // Default to line for time-based data
  if (lowerQuery.includes('trend') || 
      lowerQuery.includes('time') || 
      lowerQuery.includes('day') || 
      lowerQuery.includes('week') || 
      lowerQuery.includes('month')) {
    return 'line';
  }
  
  // Default to bar for comparisons
  if (lowerQuery.includes('compare') || 
      lowerQuery.includes('category') || 
      lowerQuery.includes('group')) {
    return 'bar';
  }
  
  return 'line'; // Default fallback
};

export const getChartTitle = (query: string, chartType: string): string => {
  const lowerQuery = query.toLowerCase();
  
  // Extract key metrics or categories from the query
  const metrics = ['steps', 'heart rate', 'sleep', 'calories', 'weight', 'exercise'];
  const foundMetric = metrics.find(metric => lowerQuery.includes(metric));
  
  const timeFrames = ['week', 'month', 'year', 'day'];
  const foundTimeFrame = timeFrames.find(tf => lowerQuery.includes(tf)) || 'period';
  
  const chartTypeName = {
    line: 'Trend',
    bar: 'Comparison',
    pie: 'Breakdown',
    area: 'Area',
    radar: 'Radar'
  }[chartType] || 'Chart';
  
  return `${foundMetric ? foundMetric.charAt(0).toUpperCase() + foundMetric.slice(1) + ' ' : ''}${chartTypeName} - Last ${foundTimeFrame}`;
};

export const transformDataForChart = (data: any[], xField: string, yField: string): ChartDataPoint[] => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(item => ({
    name: item[xField]?.toString() || '',
    value: parseFloat(item[yField]) || 0,
    ...item
  }));
};

// Helper to generate sample dashboard metrics
export const generateSampleMetrics = (): Array<{
  name: string;
  value: number | string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'alert' | 'neutral';
  change?: number;
  changeType?: 'percent' | 'absolute';
}> => {
  const statuses: Array<'good' | 'warning' | 'alert' | 'neutral'> = ['good', 'warning', 'alert', 'neutral'];
  const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
  
  return [
    {
      name: 'Daily Steps',
      value: '8,342',
      unit: 'steps',
      trend: trends[Math.floor(Math.random() * trends.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      change: Math.floor(Math.random() * 15) - 5,
      changeType: 'percent'
    },
    {
      name: 'Heart Rate',
      value: '72',
      unit: 'bpm',
      trend: trends[Math.floor(Math.random() * trends.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      change: Math.floor(Math.random() * 8) - 4,
      changeType: 'absolute'
    },
    {
      name: 'Sleep',
      value: '7.5',
      unit: 'hrs',
      trend: trends[Math.floor(Math.random() * trends.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      change: Math.floor(Math.random() * 20) - 10,
      changeType: 'percent'
    },
    {
      name: 'Calories Burned',
      value: '2,450',
      unit: 'kcal',
      trend: trends[Math.floor(Math.random() * trends.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      change: Math.floor(Math.random() * 12) - 3,
      changeType: 'percent'
    }
  ];
};
