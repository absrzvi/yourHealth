'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw, WifiOff, AlertTriangle, Database, Wifi } from 'lucide-react';
import ChartVisualization from '../visualizations/ChartVisualization';
import DashboardVisualization from '../visualizations/DashboardVisualization';
import HealthInsightsVisualization from '../visualizations/HealthInsightsVisualization';
import { useVisualizationWebSocket, DataSourceType } from '@/lib/websocket/visualizationWebSocketService';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface RealTimeVisualizationProps {
  type: 'chart' | 'dashboard' | 'insights';
  initialData: any;
  dataSource: DataSourceType | DataSourceType[];
  metrics?: string[];
  timeRange?: string;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  userId?: string;
  showControls?: boolean;
}

/**
 * RealTimeVisualization component
 * 
 * This component wraps the existing visualization components and adds real-time
 * update capabilities using WebSockets. It handles connection status, refresh
 * controls, and data merging.
 */
const RealTimeVisualization: React.FC<RealTimeVisualizationProps> = ({
  type,
  initialData,
  dataSource,
  metrics,
  timeRange = 'LAST_MONTH',
  refreshInterval = 30000, // Default: 30 seconds
  autoRefresh = true,
  userId,
  showControls = true
}) => {
  // State for visualization data
  const [data, setData] = useState(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // WebSocket connection configuration
  const wsConfig = {
    dataSource,
    metrics,
    timeRange,
    userId,
    refreshInterval: autoRefresh ? refreshInterval : undefined
  };
  
  // Use the WebSocket hook
  const { 
    isConnected, 
    latestData, 
    error, 
    requestDataRefresh,
    isFallbackMode,
    reconnectAttempts 
  } = useVisualizationWebSocket(wsConfig);
  
  // Update data when new data arrives from WebSocket
  useEffect(() => {
    if (latestData) {
      setIsUpdating(true);
      
      try {
        // Merge new data with existing data based on visualization type
        const updatedData = { ...data };
        
        if (type === 'chart') {
          // For charts, update the data array
          updatedData.data = latestData;
        } else if (type === 'dashboard') {
          // For dashboards, update each chart's data
          if (updatedData.charts) {
            updatedData.charts = updatedData.charts.map((chart: any) => {
              // Find matching data for this chart
              const chartData = latestData.find((d: any) => 
                d.dataSource === chart.dataSource && 
                d.metrics.some((m: string) => chart.metrics.includes(m))
              );
              
              if (chartData) {
                return { ...chart, data: chartData.data };
              }
              
              return chart;
            });
          }
        } else if (type === 'insights') {
          // For insights, update the metrics data
          if (updatedData.metricsData) {
            updatedData.metricsData = latestData;
          }
        }
        
        setData(updatedData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error updating visualization data:', err);
        // Don't update the data if there was an error processing it
      } finally {
        setIsUpdating(false);
      }
    }
  }, [latestData, data, type]);
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setIsUpdating(true);
    requestDataRefresh();
    
    // Set a timeout to clear the updating state in case of failure
    setTimeout(() => {
      setIsUpdating(false);
    }, 5000);
  }, [requestDataRefresh]);
  
  // Function to render connection status indicator
  const renderConnectionStatus = useCallback(() => {
    if (isFallbackMode) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
          <Database className="h-3 w-3" />
          <span>Using Cached Data</span>
        </Badge>
      );
    } else if (isConnected) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          <span>Live</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </Badge>
      );
    }
  }, [isConnected, isFallbackMode]);
  
  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };
  
  // Render the appropriate visualization component based on type
  const renderVisualization = () => {
    switch (type) {
      case 'chart':
        return <ChartVisualization data={data} />;
      case 'dashboard':
        return <DashboardVisualization data={data} />;
      case 'insights':
        return <HealthInsightsVisualization data={data} />;
      default:
        return <div>Unsupported visualization type</div>;
    }
  };
  
  return (
    <div className="relative">
      {/* Visualization component */}
      <div className={isUpdating ? 'opacity-60 transition-opacity' : ''}>
        {renderVisualization()}
      </div>
      
      {/* Connection status and controls */}
      {showControls && (
        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            {renderConnectionStatus()}
            <span className="text-xs">
              Updated {formatTimeAgo(lastUpdated)}
            </span>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isUpdating || !isConnected}
                  className="h-8 w-8 p-0"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
          <div className="bg-white p-2 rounded-full shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            {isFallbackMode && reconnectAttempts >= 5 && (
              <div className="mt-1 text-xs">
                Data may be outdated. The application will automatically reconnect when possible.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Fallback mode notice - only show if in fallback mode but no error is showing */}
      {isFallbackMode && !error && (
        <Alert variant="warning" className="mt-2">
          <Database className="h-4 w-4" />
          <AlertTitle>Using cached data</AlertTitle>
          <AlertDescription>
            Unable to connect to the server. Displaying cached data from your last session.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RealTimeVisualization;
