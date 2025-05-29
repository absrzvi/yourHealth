import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Upload, Info, AlertCircle } from 'lucide-react';
import HealthMetricCard, { MetricType } from './HealthMetricCard';

interface HealthPanelProps {
  className?: string;
  isMobile?: boolean;
}

const HealthPanel: React.FC<HealthPanelProps> = ({ 
  className = '',
  isMobile = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  
  // Mock data - in a real app this would come from API/state
  const healthMetrics = {
    cardiovascular: 75,
    metabolic: 62,
    inflammation: 48
  };
  
  const lastUpdate = new Date('2025-05-15');
  
  // Recent activity mock data
  const recentActivities = [
    {
      id: 1,
      type: 'upload',
      description: 'Blood Test Results',
      timestamp: new Date('2025-05-15T14:32:00')
    },
    {
      id: 2,
      type: 'insight',
      description: 'Weekly Health Summary',
      timestamp: new Date('2025-05-14T09:15:00')
    },
    {
      id: 3,
      type: 'alert',
      description: 'Vitamin D levels below optimal',
      timestamp: new Date('2025-05-12T16:45:00')
    }
  ];
  
  // Activity icon mapping
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <Upload size={16} className="text-blue-500" />;
      case 'insight':
        return <Info size={16} className="text-green-500" />;
      case 'alert':
        return <AlertCircle size={16} className="text-orange-500" />;
      default:
        return <Info size={16} />;
    }
  };
  
  // Format relative time
  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  };
  
  return (
    <div 
      className={`bg-gray-50 border-l border-gray-200 transition-all duration-300 ${className} ${
        isCollapsed && !isMobile ? 'w-16' : ''
      }`}
    >
      {/* Toggle button (desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-4 top-1/2 transform -translate-y-1/2 h-8 w-8 bg-white rounded-full shadow-md flex items-center justify-center z-10 border border-gray-200"
          aria-label={isCollapsed ? 'Expand health panel' : 'Collapse health panel'}
        >
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      )}
      
      {/* Mobile handle */}
      {isMobile && (
        <div 
          className="h-6 border-t border-gray-300 flex items-center justify-center"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="w-10 h-1 rounded-full bg-gray-300"></div>
        </div>
      )}
      
      {/* Panel content */}
      {(!isCollapsed || isMobile) && (
        <div className="p-4 overflow-y-auto h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Health Status</h2>
            {isMobile && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 text-gray-500"
                aria-label="Close health panel"
              >
                <ChevronDown size={20} />
              </button>
            )}
          </div>
          
          {/* Health metrics */}
          <div className="space-y-4 mb-6">
            <HealthMetricCard
              type="cardiovascular"
              score={healthMetrics.cardiovascular}
              title="Cardiovascular"
              description="Blood pressure, cholesterol, and heart metrics"
              lastUpdated={lastUpdate}
            />
            
            <HealthMetricCard
              type="metabolic"
              score={healthMetrics.metabolic}
              title="Metabolic"
              description="Blood sugar, insulin, and metabolic markers"
              lastUpdated={lastUpdate}
            />
            
            <HealthMetricCard
              type="inflammation"
              score={healthMetrics.inflammation}
              title="Inflammation"
              description="CRP, cytokines, and inflammatory markers"
              lastUpdated={lastUpdate}
            />
          </div>
          
          {/* Upload section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Add Health Data</h3>
            <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">Drop files or click to upload</p>
              <button className="text-xs px-3 py-1 rounded-full text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                Upload Reports
              </button>
            </div>
          </div>
          
          {/* Recent activity */}
          <div>
            <h3 className="text-sm font-medium text-gray-800 mb-2">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="bg-white rounded-lg p-3 flex items-start">
                  <div className="mt-0.5 mr-3">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthPanel;
