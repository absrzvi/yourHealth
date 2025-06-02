import { useState, useCallback } from 'react';
import { generateSampleData } from '@/lib/chartUtils';

type VisualizationType = 'chart' | 'dashboard' | 'message' | 'error' | null;

interface VisualizationResponse {
  type: VisualizationType;
  data: any;
  isLoading: boolean;
  error: string | null;
  generateVisualization: (prompt: string) => Promise<boolean>;
  clearVisualization: () => void;
}

export function useVisualization(): VisualizationResponse {
  const [type, setType] = useState<VisualizationType>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearVisualization = useCallback(() => {
    setType(null);
    setData(null);
    setError(null);
  }, []);

  const generateVisualization = useCallback(async (prompt: string): Promise<boolean> => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty');
      return false;
    }

    // Check if this is a visualization request
    const isVisualizationRequest = /^(show|display|graph|chart|visualize)/i.test(prompt);
    if (!isVisualizationRequest) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/visualizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate visualization');
      }

      const result = await response.json();
      
      if (!result.type) {
        setType('message');
        setData({
          content: 'I can help you visualize your health data. Try asking for a specific type of chart or dashboard.',
        });
        return true;
      }

      setType(result.type);
      setData(result.data);
      return true;
      
    } catch (err) {
      console.error('Error generating visualization:', err);
      setType('error');
      setError('Failed to generate visualization. Please try again.');
      
      // Fallback to sample data in case of error
      setType('chart');
      setData({
        chartType: 'line',
        title: 'Sample Health Data',
        data: generateSampleData('line'),
        xAxis: 'name',
        yAxis: 'value',
      });
      return true;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    type,
    data,
    isLoading,
    error,
    generateVisualization,
    clearVisualization,
  };
}
