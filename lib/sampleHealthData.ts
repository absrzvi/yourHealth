import { subDays, format } from 'date-fns';

type DataPoint = {
  date: string;
  value: number;
  type: string;
};

export const generateSampleHealthData = (days = 30): DataPoint[] => {
  const today = new Date();
  const data: DataPoint[] = [];
  
  const metrics = [
    { type: 'Heart Rate', min: 60, max: 100, variance: 5 },
    { type: 'Blood Pressure (Systolic)', min: 100, max: 140, variance: 8 },
    { type: 'Blood Pressure (Diastolic)', min: 60, max: 90, variance: 5 },
    { type: 'Blood Oxygen', min: 95, max: 100, variance: 1 },
    { type: 'Resting HR', min: 50, max: 70, variance: 3 },
  ];

  for (let i = days; i >= 0; i--) {
    const date = subDays(today, i);
    const dateStr = format(date, 'MMM dd');
    
    metrics.forEach(metric => {
      const baseValue = (metric.min + metric.max) / 2;
      const variance = (Math.random() - 0.5) * 2 * metric.variance;
      const value = Math.round(baseValue + variance);
      
      data.push({
        date: dateStr,
        value,
        type: metric.type,
      });
    });
  }

  return data;
};

export const getReferenceRanges = (type: string) => {
  const ranges: Record<string, { min: number; max: number }> = {
    'Heart Rate': { min: 60, max: 100 },
    'Blood Pressure (Systolic)': { min: 90, max: 120 },
    'Blood Pressure (Diastolic)': { min: 60, max: 80 },
    'Blood Oxygen': { min: 95, max: 100 },
    'Resting HR': { min: 50, max: 70 },
  };

  return ranges[type] || { min: 0, max: 100 };
};

export const getHealthSummary = () => ({
  overallScore: 87,
  lastUpdated: new Date(),
  trends: {
    improving: ['Heart Health', 'Sleep Quality'],
    declining: ['Stress Levels'],
    stable: ['Blood Pressure', 'Oxygen Levels'],
  },
  recommendations: [
    'Consider increasing your daily step count',
    'Your stress levels have been elevated this week',
    'Great job maintaining consistent sleep patterns',
  ],
});
