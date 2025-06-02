import React, { useState, useMemo, useEffect } from 'react';
import { generateSampleHealthData, getReferenceRanges } from '@/lib/sampleHealthData';
import { HealthTrendsChart } from './HealthTrendsChart';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface DataVisualizationProps {
  dateRange?: DateRange;
}

type TimeRange = '7d' | '30d' | '90d' | '1y';

const timeRangeLabels: Record<TimeRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '1y': 'Last year',
};

const metricTypes = [
  'Heart Rate',
  'Blood Pressure (Systolic)',
  'Blood Pressure (Diastolic)',
  'Blood Oxygen',
  'Resting HR',
];

export function DataVisualization({ dateRange }: DataVisualizationProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['Heart Rate', 'Blood Oxygen']);
  const [allData, setAllData] = useState<ReturnType<typeof generateSampleHealthData>>([]);

  // Generate sample data based on selected time range
  useEffect(() => {
    if (!dateRange?.from) return;
    
    // Calculate days between dates if both are set, otherwise use the timeRange
    let days = 30; // default
    if (dateRange.to) {
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (timeRange) {
      days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    }
    
    setAllData(generateSampleHealthData(days));
  }, [dateRange, timeRange]);

  // Filter data based on selected metrics and date range
  const filteredData = useMemo(() => {
    return allData.filter(point => {
      const pointDate = new Date(point.date);
      const isInDateRange = dateRange?.from && 
        (!dateRange.to || pointDate <= dateRange.to) && 
        pointDate >= dateRange.from;
      
      return selectedMetrics.includes(point.type) && isInDateRange;
    });
  }, [allData, selectedMetrics, dateRange]);

  // Get unique dates for x-axis
  const dates = useMemo(() => {
    const dateSet = new Set<string>();
    allData.forEach(item => dateSet.add(item.date));
    return Array.from(dateSet).sort();
  }, [allData]);

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-2xl font-semibold text-neutral-700 font-montserrat">Your Health Trends</h3>
        <div className="flex items-center space-x-2 mt-2 md:mt-0">
          <Select
            value={timeRange}
            onValueChange={(value: TimeRange) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(timeRangeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
        <div className="flex flex-wrap gap-2 mb-6">
          {metricTypes.map(metric => (
            <Button
              key={metric}
              variant={selectedMetrics.includes(metric) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleMetric(metric)}
              className="text-xs"
            >
              {metric}
            </Button>
          ))}
        </div>

        <div className="h-[400px] w-full">
          <HealthTrendsChart
            data={filteredData}
            title=""
            yAxisLabel="Value"
            referenceRange={selectedMetrics.length === 1 ? getReferenceRanges(selectedMetrics[0]) : undefined}
          />
        </div>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>💡 Tip: Click on the metric buttons above to show/hide different health metrics.</p>
          {selectedMetrics.length === 1 && (
            <p className="mt-2">
              <span className="font-medium">Reference Range:</span> {getReferenceRanges(selectedMetrics[0]).min} - {getReferenceRanges(selectedMetrics[0]).max}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
