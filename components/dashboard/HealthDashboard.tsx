import * as React from 'react';
import { format } from 'date-fns';
import { 
  Activity, 
  AlertCircle, 
  ArrowUpRight, 
  Bug, 
  Droplets, 
  Dna,
  HeartPulse, 
  Moon, 
  RefreshCw 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { useHealthData } from '@/hooks/useHealthData';
import { cn } from '@/lib/utils';
import { StatCard } from './StatCard';

type HealthDashboardProps = {
  className?: string;
  onDataLoad?: (data: any) => void;
  showRefresh?: boolean;
};

export function HealthDashboard({ 
  className, 
  onDataLoad, 
  showRefresh = true 
}: HealthDashboardProps) {
  const { 
    loading, 
    error, 
    summary, 
    metrics, 
    dnaSequences, 
    microbiomeSamples, 
    refreshAll,
    lastUpdated
  } = useHealthData();

  // Calculate health score (simplified for demo)
  const healthScore = React.useMemo(() => {
    if (!metrics.length) return 0;
    const avgMetric = metrics.reduce((sum, m) => sum + Number(m.value), 0) / metrics.length;
    return Math.min(100, Math.max(0, avgMetric));
  }, [metrics]);

  // Get latest metrics (max 5)
  const latestMetrics = React.useMemo(() => {
    return [...metrics]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [metrics]);

  // Get latest microbiome sample
  const latestMicrobiome = React.useMemo(() => {
    return [...microbiomeSamples]
      .sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime())[0];
  }, [microbiomeSamples]);

  // Calculate DNA variants count
  const dnaVariants = dnaSequences.length;

  // Handle refresh with error handling
  const handleRefresh = React.useCallback(async () => {
    try {
      await refreshAll(); // Update HealthDashboard to use refreshAll
    } catch (err) {
      console.error('Failed to refresh health data:', err);
    }
  }, [refreshAll]);

  // Notify parent when data is loaded
  React.useEffect(() => {
    if (onDataLoad && !loading && !error) {
      onDataLoad({
        metrics,
        dnaSequences,
        microbiomeSamples,
        summary
      });
    }
  }, [loading, error, metrics, dnaSequences, microbiomeSamples, summary, onDataLoad]);

  // Show loading state
  if (loading && !summary) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading health data</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>We couldn't load your health data. This might be due to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Session expired - Try refreshing the page or logging in again</li>
              <li>Network issues - Check your internet connection</li>
              <li>Server error - Our services might be temporarily unavailable</li>
            </ul>
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Try Again'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with title and refresh button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Health Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {lastUpdated 
              ? `Last updated: ${format(new Date(lastUpdated), 'MMM d, yyyy h:mm a')}`
              : 'Loading...'}
          </p>
        </div>
        {showRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="flex-shrink-0"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Refresh Data
          </Button>
        )}
      </div>

      {/* Health Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Health Score" 
          value={`${Math.round(healthScore)}`} 
          icon={Activity} 
          trend={healthScore > 70 ? 'up' : healthScore < 30 ? 'down' : 'neutral'}
          loading={loading}
        />
        <StatCard 
          title="DNA Variants" 
          value={dnaVariants} 
          icon={Dna} 
          loading={loading}
        />
        <StatCard 
          title="Microbiome Samples" 
          value={microbiomeSamples.length} 
          icon={Bug} 
          loading={loading}
        />
        <StatCard 
          title="Latest Metrics" 
          value={latestMetrics.length} 
          icon={HeartPulse} 
          loading={loading}
        />
      </div>

      {/* Recent Activity and Microbiome Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Health Metrics</CardTitle>
            <CardDescription>Your latest health measurements</CardDescription>
          </CardHeader>
          <CardContent>
            {latestMetrics.length > 0 ? (
              <div className="space-y-4">
                {latestMetrics.map((metric) => (
                  <div key={metric.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.name}</span>
                      <span className="text-sm font-mono">
                        {metric.value} {metric.unit || ''}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          'h-full', 
                          parseFloat(metric.value) > 80 ? 'bg-green-500' : 
                          parseFloat(metric.value) > 50 ? 'bg-amber-500' : 'bg-red-500'
                        )} 
                        style={{ width: `${Math.min(100, parseFloat(metric.value))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{metric.type}</span>
                      <span>{format(new Date(metric.date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No health metrics recorded yet</p>
                <Button variant="ghost" size="sm" className="mt-2">
                  Add Your First Metric
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Microbiome Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Microbiome Health</CardTitle>
            <CardDescription>
              {latestMicrobiome 
                ? `Latest sample from ${format(new Date(latestMicrobiome.sampleDate), 'MMM d, yyyy')}`
                : 'No microbiome data available'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestMicrobiome ? (
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center p-4">
                    <Bug className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="text-sm font-medium">Diversity Score</p>
                    <div className="text-3xl font-bold">
                      {latestMicrobiome.diversityScore?.toFixed(1) || '--'}
                      <span className="text-sm font-normal text-muted-foreground">/10</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sample Type</span>
                    <span className="font-medium capitalize">{latestMicrobiome.sampleType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Organisms Detected</span>
                    <span className="font-medium">
                      {latestMicrobiome.organisms?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No microbiome data available</p>
                <Button variant="ghost" size="sm" className="mt-2">
                  Upload Microbiome Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* DNA Variants Section */}
      <Card>
        <CardHeader>
          <CardTitle>DNA Variants</CardTitle>
          <CardDescription>
            {dnaVariants > 0 
              ? `Showing ${Math.min(5, dnaVariants)} of ${dnaVariants} variants`
              : 'No DNA data available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dnaVariants > 0 ? (
            <div className="space-y-4">
              {dnaSequences.slice(0, 5).map((variant) => (
                <div key={variant.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{variant.rsid}</h4>
                      <p className="text-sm text-muted-foreground">
                        {variant.chromosome}:{variant.position}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {variant.genotype}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Last analyzed: {format(new Date(variant.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              ))}
              {dnaVariants > 5 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm">
                    View All Variants <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No DNA data available</p>
              <Button>
                Upload DNA Data
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Tips and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Health Recommendations</CardTitle>
          <CardDescription>Personalized tips based on your health data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: 'Improve Sleep Quality',
                description: 'Based on your recent sleep patterns, try to maintain a consistent sleep schedule.',
                icon: Moon,
                priority: 'high' as const
              },
              {
                title: 'Increase Water Intake',
                description: 'Your hydration levels are slightly low. Aim for 8-10 glasses of water daily.',
                icon: Droplets,
                priority: 'medium' as const
              },
              {
                title: 'Regular Exercise',
                description: 'Try to include at least 30 minutes of moderate exercise in your daily routine.',
                icon: Activity,
                priority: 'low' as const
              }
            ].map((tip, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className={cn(
                  'p-2 rounded-full',
                  tip.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/50' :
                  tip.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-900/50'
                )}>
                  <tip.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HealthDashboard;
