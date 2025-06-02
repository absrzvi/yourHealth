import { HealthMetric, DNASequence, MicrobiomeSample, HealthSummary } from '@/types/health';

const API_BASE_URL = '/api';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'An error occurred');
  }
  return response.json();
}

// Health Metrics API
export const healthMetricsApi = {
  async getMetrics(params?: { 
    type?: string; 
    startDate?: string; 
    endDate?: string; 
  }): Promise<HealthMetric[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await fetch(`${API_BASE_URL}/health-metrics?${queryParams}`);
    return handleResponse<HealthMetric[]>(response);
  },

  async createMetric(metric: Omit<HealthMetric, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthMetric> {
    const response = await fetch(`${API_BASE_URL}/health-metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    });
    return handleResponse<HealthMetric>(response);
  },
};

// DNA Sequences API
export const dnaSequencesApi = {
  async getSequences(params?: { rsid?: string; chromosome?: string }): Promise<DNASequence[]> {
    const queryParams = new URLSearchParams();
    if (params?.rsid) queryParams.append('rsid', params.rsid);
    if (params?.chromosome) queryParams.append('chromosome', params.chromosome);
    
    const response = await fetch(`${API_BASE_URL}/dna-sequences?${queryParams}`);
    return handleResponse<DNASequence[]>(response);
  },

  async createSequence(sequence: Omit<DNASequence, 'id' | 'userId' | 'createdAt'>): Promise<DNASequence> {
    const response = await fetch(`${API_BASE_URL}/dna-sequences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sequence),
    });
    return handleResponse<DNASequence>(response);
  },
};

// Microbiome API
export const microbiomeApi = {
  async getSamples(params?: { 
    sampleType?: string; 
    startDate?: string; 
    endDate?: string; 
  }): Promise<MicrobiomeSample[]> {
    const queryParams = new URLSearchParams();
    if (params?.sampleType) queryParams.append('sampleType', params.sampleType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await fetch(`${API_BASE_URL}/microbiome/samples?${queryParams}`);
    return handleResponse<MicrobiomeSample[]>(response);
  },

  async createSample(sample: Omit<MicrobiomeSample, 'id' | 'userId' | 'createdAt' | 'organisms'> & { 
    organisms: Array<Omit<MicrobiomeSample['organisms'][number], 'id' | 'sampleId' | 'createdAt'>> 
  }): Promise<MicrobiomeSample> {
    const response = await fetch(`${API_BASE_URL}/microbiome/samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sample),
    });
    return handleResponse<MicrobiomeSample>(response);
  },
};

// Health Summary API
export const healthSummaryApi = {
  async getSummary(): Promise<HealthSummary> {
    const response = await fetch(`${API_BASE_URL}/health/summary`);
    return handleResponse<HealthSummary>(response);
  },
};

// Combined health data API
export const healthApi = {
  metrics: healthMetricsApi,
  dna: dnaSequencesApi,
  microbiome: microbiomeApi,
  summary: healthSummaryApi,
};

export default healthApi;
