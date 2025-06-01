import { useState, useEffect, useCallback } from 'react';
import { HealthMetric, DNASequence, MicrobiomeSample, HealthSummary } from '@/types/health';
import { healthMetricsApi, dnaSequencesApi, microbiomeApi, healthSummaryApi } from '@/lib/api/health';

export function useHealthData() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [dnaSequences, setDnaSequences] = useState<DNASequence[]>([]);
  const [microbiomeSamples, setMicrobiomeSamples] = useState<MicrobiomeSample[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [summaryData, metricsData, dnaData, microbiomeData] = await Promise.all([
        healthSummaryApi.getSummary(),
        healthMetricsApi.getMetrics({}),
        dnaSequencesApi.getSequences({}),
        microbiomeApi.getSamples({})
      ]);

      setSummary(summaryData);
      setMetrics(metricsData);
      setDnaSequences(dnaData);
      setMicrobiomeSamples(microbiomeData);
      setLastUpdated(new Date());
      
      return {
        summary: summaryData,
        metrics: metricsData,
        dnaSequences: dnaData,
        microbiomeSamples: microbiomeData
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health data';
      setError(errorMessage);
      console.error('Error in refreshAll:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Fetch health summary
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await healthSummaryApi.getSummary();
      setSummary(data);
      setLastUpdated(new Date());
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health summary';
      setError(errorMessage);
      console.error('Error in fetchSummary:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch health metrics
  const fetchMetrics = useCallback(async (params: { 
    type?: string; 
    startDate?: string; 
    endDate?: string;
    limit?: number;
  } = {}) => {
    try {
      setLoading(true);
      const data = await healthMetricsApi.getMetrics(params);
      setMetrics(prev => {
        // Only update if we're not fetching filtered data
        if (!params.type && !params.startDate && !params.endDate) {
          return data;
        }
        return prev;
      });
      setLastUpdated(new Date());
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health metrics';
      setError(errorMessage);
      console.error('Error in fetchMetrics:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch DNA sequences
  const fetchDnaSequences = useCallback(async (params: { 
    rsid?: string; 
    chromosome?: string;
    limit?: number;
  } = {}) => {
    try {
      setLoading(true);
      const data = await dnaSequencesApi.getSequences(params);
      setDnaSequences(prev => {
        // Only update if we're not fetching filtered data
        if (!params.rsid && !params.chromosome) {
          return data;
        }
        return prev;
      });
      setLastUpdated(new Date());
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch DNA sequences';
      setError(errorMessage);
      console.error('Error in fetchDnaSequences:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch microbiome samples
  const fetchMicrobiomeSamples = useCallback(async (params?: { 
    sampleType?: string; 
    startDate?: string; 
    endDate?: string; 
  }) => {
    try {
      setLoading(true);
      const data = await microbiomeApi.getSamples(params);
      setMicrobiomeSamples(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch microbiome samples');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchSummary(),
        fetchMetrics(),
        fetchDnaSequences(),
        fetchMicrobiomeSamples(),
      ]);
    };

    loadInitialData();
  }, [fetchSummary, fetchMetrics, fetchDnaSequences, fetchMicrobiomeSamples]);

  // Create a new health metric
  const createHealthMetric = useCallback(async (metric: Omit<HealthMetric, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      const newMetric = await healthMetricsApi.createMetric(metric);
      setMetrics(prev => [newMetric, ...prev]);
      setLastUpdated(new Date());
      return newMetric;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create health metric';
      setError(errorMessage);
      console.error('Error in createHealthMetric:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new DNA sequence
  const createDnaSequence = useCallback(async (sequence: Omit<DNASequence, 'id' | 'userId' | 'createdAt'>) => {
    try {
      setLoading(true);
      const newSequence = await dnaSequencesApi.createSequence(sequence);
      setDnaSequences(prev => [newSequence, ...prev]);
      setLastUpdated(new Date());
      return newSequence;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create DNA sequence';
      setError(errorMessage);
      console.error('Error in createDnaSequence:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new microbiome sample
  const createMicrobiomeSample = useCallback(async (sample: Omit<MicrobiomeSample, 'id' | 'userId' | 'createdAt' | 'organisms'> & {
    organisms: Array<Omit<MicrobiomeSample['organisms'][number], 'id' | 'sampleId' | 'createdAt'>>;
  }) => {
    try {
      setLoading(true);
      const newSample = await microbiomeApi.createSample(sample);
      setMicrobiomeSamples(prev => [newSample, ...prev]);
      setLastUpdated(new Date());
      return newSample;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create microbiome sample';
      setError(errorMessage);
      console.error('Error in createMicrobiomeSample:', errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    loading,
    error,
    lastUpdated,
    summary,
    metrics,
    dnaSequences,
    microbiomeSamples,
    
    // Data fetching
    refreshAll,
    fetchSummary,
    fetchMetrics,
    fetchDnaSequences,
    fetchMicrobiomeSamples,
    
    // Data creation
    createHealthMetric,
    createDnaSequence,
    createMicrobiomeSample,
    
    // Convenience getters
    getLatestMetrics: (limit = 5) => metrics.slice(0, limit),
    getMetricsByType: (type: string) => metrics.filter(m => m.type === type),
    getDnaSequence: (rsid: string) => dnaSequences.find(s => s.rsid === rsid),
    getLatestMicrobiomeSample: () => microbiomeSamples[0]
  };
}

export default useHealthData;
