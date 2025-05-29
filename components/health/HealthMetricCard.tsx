import React from 'react';
import { motion } from 'framer-motion';

export type MetricType = 'cardiovascular' | 'metabolic' | 'inflammation';

interface HealthMetricCardProps {
  type: MetricType;
  score: number | null;
  title: string;
  description?: string;
  lastUpdated?: Date | null;
}

const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  type,
  score,
  title,
  description,
  lastUpdated
}) => {
  // Color mapping based on metric type
  const colorMap = {
    cardiovascular: 'var(--metric-cardio)',
    metabolic: 'var(--metric-metabolic)',
    inflammation: 'var(--metric-inflammation)'
  };
  
  // Score range: 0-100
  const normalizedScore = score !== null ? Math.max(0, Math.min(100, score)) : null;
  
  // Health status text based on score
  const getStatusText = (score: number | null) => {
    if (score === null) return 'No data';
    if (score >= 80) return 'Optimal';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div 
          className="h-3 w-3 rounded-full" 
          style={{ backgroundColor: colorMap[type] }}
        />
      </div>
      
      <div className="mt-3">
        {normalizedScore !== null ? (
          <>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ backgroundColor: colorMap[type] }}
                initial={{ width: 0 }}
                animate={{ width: `${normalizedScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">{normalizedScore}</div>
              <div className="text-sm text-gray-500">{getStatusText(normalizedScore)}</div>
            </div>
            
            {description && (
              <p className="text-xs text-gray-500 mt-2">{description}</p>
            )}
            
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-2">
                Updated {lastUpdated.toLocaleDateString()}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="text-sm text-gray-400 mb-2">No data available</div>
            <button 
              className="text-xs px-3 py-1 rounded-full text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Upload report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthMetricCard;
