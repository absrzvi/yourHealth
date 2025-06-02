import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface HealthMetricsProps {
  dateRange?: DateRange;
}

type Metric = {
  id: number;
  name: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  change: string;
  color: string;
  description: string;
  lastUpdated: string;
};

export function HealthMetrics({ dateRange }: HealthMetricsProps) {
  // Calculate metrics based on date range
  const metrics = useMemo<Metric[]>(() => {
    const now = new Date();
    const timeAgo = dateRange?.from 
      ? formatDistanceToNow(dateRange.from, { addSuffix: true })
      : 'recently';

    return [
    { 
      id: 1, 
      name: 'Sleep Score', 
      value: '87%', 
      trend: 'up', 
      change: '2%', 
      color: 'text-green-500',
      description: 'Overall sleep quality score based on duration, deep sleep, and restfulness',
      lastUpdated: timeAgo
    },
    { 
      id: 2, 
      name: 'Readiness', 
      value: '92%', 
      trend: 'stable', 
      change: '0%', 
      color: 'text-blue-500',
      description: 'Your body\'s readiness for physical activity based on recovery metrics',
      lastUpdated: timeAgo
    },
    { 
      id: 3, 
      name: 'HRV', 
      value: '42ms', 
      trend: 'down', 
      change: '5ms', 
      color: 'text-amber-500',
      description: 'Heart Rate Variability - A measure of your autonomic nervous system function',
      lastUpdated: timeAgo
    },
    { 
      id: 4, 
      name: 'Activity Goal', 
      value: '78%', 
      trend: 'up', 
      change: '12%', 
      color: 'text-green-500',
      description: 'Progress towards your daily activity and movement goals',
      lastUpdated: timeAgo
    },
  ];

  }, [dateRange]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-semibold text-neutral-700 font-montserrat">Your Health Metrics</h3>
        <span className="text-sm text-muted-foreground">Updated recently</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div 
            key={metric.id} 
            className="bg-card p-6 rounded-lg shadow-lg border border-border hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Info className="h-3.5 w-3.5" />
                          <span className="sr-only">Info</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px] text-sm">
                        <p className="font-medium mb-1">{metric.name}</p>
                        <p className="text-muted-foreground">{metric.description}</p>
                        <p className="text-xs mt-2 text-muted-foreground">Last updated: {metric.lastUpdated}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-medium ${metric.color} flex items-center`}>
                  {getTrendIcon(metric.trend)} {metric.change}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  vs. yesterday
                </span>
              </div>
            </div>
            
            {/* Progress bar for the activity goal */}
            {metric.name === 'Activity Goal' && (
              <div className="mt-4">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: metric.value }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {metric.value} of daily goal
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
