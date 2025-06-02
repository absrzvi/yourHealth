import { useState } from 'react';
import { generateSampleData } from '@/lib/chartUtils';

type VisualizationType = 'chart' | 'dashboard' | 'message' | 'error';

interface VisualizationResponse {
  type: VisualizationType;
  data: any;
  isLoading: boolean;
  error: string | null;
  generateVisualization: (prompt: string) => Promise<void>;
}

export function useVisualization(): VisualizationResponse {
  const [type, setType] = useState<VisualizationType>('message');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVisualization = async (prompt: string) => {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty');
      return;
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
      
      // If no specific visualization was generated, return a default message
      if (!result.type) {
        setType('message');
        setData({
          content: 'I can help you visualize your health data. Try asking for a specific type of chart or dashboard.',
        });
        return;
      }

      setType(result.type);
      setData(result.data);
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
    } finally {
      setIsLoading(false);
    }
  };

  return {
    type,
    data,
    isLoading,
    error,
    generateVisualization,
  };
}
