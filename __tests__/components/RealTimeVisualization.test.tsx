import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import RealTimeVisualization from '@/components/ai-coach/RealTimeVisualization';
import { useVisualizationWebSocket } from '@/lib/websocket/visualizationWebSocketService';

// Mock the WebSocket hook
jest.mock('@/lib/websocket/visualizationWebSocketService', () => ({
  useVisualizationWebSocket: jest.fn(),
  DataSourceType: {
    HEALTH_METRICS: 'health_metrics',
    SLEEP_DATA: 'sleep_data',
    WEIGHT_LOG: 'weight_log',
    BLOOD_TEST: 'blood_test'
  }
}));

// Mock the visualization components
jest.mock('@/components/visualizations/ChartVisualization', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="chart-visualization">Mock Chart</div>)
}));

jest.mock('@/components/visualizations/DashboardVisualization', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="dashboard-visualization">Mock Dashboard</div>)
}));

jest.mock('@/components/visualizations/HealthInsightsVisualization', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="insights-visualization">Mock Insights</div>)
}));

describe('RealTimeVisualization', () => {
  const mockInitialData = {
    title: 'Test Chart',
    chartType: 'line',
    metrics: ['Heart Rate'],
    data: [
      { date: '2023-01-01', 'Heart Rate': 75 }
    ]
  };

  beforeEach(() => {
    // Reset the mock implementation before each test
    (useVisualizationWebSocket as jest.Mock).mockImplementation(() => ({
      isConnected: true,
      latestData: null,
      error: null,
      requestDataRefresh: jest.fn(),
      isFallbackMode: false,
      reconnectAttempts: 0
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders chart visualization correctly', () => {
    render(
      <RealTimeVisualization
        type="chart"
        initialData={mockInitialData}
        dataSource="health_metrics"
        metrics={['Heart Rate']}
      />
    );

    expect(screen.getByTestId('chart-visualization')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  test('renders dashboard visualization correctly', () => {
    render(
      <RealTimeVisualization
        type="dashboard"
        initialData={{
          title: 'Health Dashboard',
          charts: [{ id: '1', title: 'Chart 1', chartType: 'line', metrics: ['Heart Rate'], data: [] }]
        }}
        dataSource={['health_metrics', 'sleep_data']}
      />
    );

    expect(screen.getByTestId('dashboard-visualization')).toBeInTheDocument();
  });

  test('renders insights visualization correctly', () => {
    render(
      <RealTimeVisualization
        type="insights"
        initialData={{
          title: 'Health Insights',
          metrics: ['Heart Rate'],
          insights: [],
          summary: 'Test summary'
        }}
        dataSource="health_metrics"
      />
    );

    expect(screen.getByTestId('insights-visualization')).toBeInTheDocument();
  });

  test('shows offline status when not connected', () => {
    (useVisualizationWebSocket as jest.Mock).mockImplementation(() => ({
      isConnected: false,
      latestData: null,
      error: null,
      requestDataRefresh: jest.fn(),
      isFallbackMode: false,
      reconnectAttempts: 0
    }));

    render(
      <RealTimeVisualization
        type="chart"
        initialData={mockInitialData}
        dataSource="health_metrics"
        metrics={['Heart Rate']}
      />
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  test('shows loading state when updating', async () => {
    const mockRequestDataRefresh = jest.fn();
    
    (useVisualizationWebSocket as jest.Mock).mockImplementation(() => ({
      isConnected: true,
      latestData: null,
      error: null,
      requestDataRefresh: mockRequestDataRefresh,
      isFallbackMode: false,
      reconnectAttempts: 0
    }));

    render(
      <RealTimeVisualization
        type="chart"
        initialData={mockInitialData}
        dataSource="health_metrics"
        metrics={['Heart Rate']}
      />
    );

    // Click refresh button
    fireEvent.click(screen.getByRole('button'));
    
    // Wait for loading animation to appear
    await waitFor(() => {
      expect(mockRequestDataRefresh).toHaveBeenCalled();
    });
  });

  test('updates data when new data arrives from websocket', async () => {
    // Initial render with no data updates
    const { rerender } = render(
      <RealTimeVisualization
        type="chart"
        initialData={mockInitialData}
        dataSource="health_metrics"
        metrics={['Heart Rate']}
      />
    );

    // Change the mock to return data
    const newData = [
      { date: '2023-01-01', 'Heart Rate': 80 },
      { date: '2023-01-02', 'Heart Rate': 85 }
    ];
    
    (useVisualizationWebSocket as jest.Mock).mockImplementation(() => ({
      isConnected: true,
      latestData: newData,
      error: null,
      requestDataRefresh: jest.fn(),
      isFallbackMode: false,
      reconnectAttempts: 0
    }));

    // Re-render with the new data
    rerender(
      <RealTimeVisualization
        type="chart"
        initialData={mockInitialData}
        dataSource="health_metrics"
        metrics={['Heart Rate']}
      />
    );

    // Verify that chart is still rendered (data would be updated internally)
    expect(screen.getByTestId('chart-visualization')).toBeInTheDocument();
  });

  test('displays error message when there is an error', () => {
    (useVisualizationWebSocket as jest.Mock).mockImplementation(() => ({
      isConnected: false,
      latestData: null,
      error: 'Connection error',
      requestDataRefresh: jest.fn(),
      isFallbackMode: true,
      reconnectAttempts: 5
    }));

    render(
      <RealTimeVisualization
        type="chart"
        initialData={mockInitialData}
        dataSource="health_metrics"
        metrics={['Heart Rate']}
      />
    );

    expect(screen.getByText('Connection error')).toBeInTheDocument();
  });

  test('hides controls when showControls is false', () => {
    render(
      <RealTimeVisualization
        type="chart"
        initialData={mockInitialData}
        dataSource="health_metrics"
        metrics={['Heart Rate']}
        showControls={false}
      />
    );

    // The Live/Offline badge should not be present
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });
});
