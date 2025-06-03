import { renderHook, act } from '@testing-library/react';
import { useVisualizationWebSocket } from '@/lib/websocket/visualizationWebSocketService';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0; // CONNECTING
  onopen: Function | null = null;
  onclose: Function | null = null;
  onmessage: Function | null = null;
  onerror: Function | null = null;
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  constructor(url: string) {
    this.url = url;
  }
  
  send = jest.fn();
  close = jest.fn();
  
  // Helper to simulate connection open
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    if (this.onopen) this.onopen({ type: 'open' });
  }
  
  // Helper to simulate connection close
  simulateClose(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) this.onclose({ type: 'close', code, reason });
  }
  
  // Helper to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
  }
  
  // Helper to simulate an error
  simulateError(error: any) {
    if (this.onerror) this.onerror(error);
  }
}

// Mock the global WebSocket class
global.WebSocket = MockWebSocket as any;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('useVisualizationWebSocket', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReset();
    mockSessionStorage.setItem.mockReset();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('connects to websocket on mount', () => {
    const { result } = renderHook(() => useVisualizationWebSocket({
      dataSource: 'health_metrics',
      metrics: ['Heart Rate'],
      timeRange: 'LAST_MONTH',
      refreshInterval: 30000
    }));
    
    expect(result.current.isConnected).toBe(false);
    
    // Get the mock websocket instance
    const ws = (global.WebSocket as any).mock.instances[0];
    
    // Simulate websocket connection open
    act(() => {
      ws.simulateOpen();
    });
    
    expect(result.current.isConnected).toBe(true);
    expect(ws.send).toHaveBeenCalled();
    
    // Check the subscription message
    const sentMessage = JSON.parse(ws.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe('subscribe');
    expect(sentMessage.config.dataSource).toBe('health_metrics');
  });
  
  test('handles data updates correctly', async () => {
    const { result } = renderHook(() => useVisualizationWebSocket({
      dataSource: 'health_metrics',
      metrics: ['Heart Rate'],
      timeRange: 'LAST_MONTH'
    }));
    
    const ws = (global.WebSocket as any).mock.instances[0];
    
    // Simulate connection open
    act(() => {
      ws.simulateOpen();
    });
    
    // Simulate receiving data
    const mockData = [
      { date: '2023-01-01', 'Heart Rate': 75 },
      { date: '2023-01-02', 'Heart Rate': 80 }
    ];
    
    act(() => {
      ws.simulateMessage({
        type: 'data_update',
        data: mockData
      });
    });
    
    expect(result.current.latestData).toEqual(mockData);
    
    // Verify data is stored in sessionStorage
    expect(mockSessionStorage.setItem).toHaveBeenCalled();
  });
  
  test('handles connection errors', async () => {
    const { result } = renderHook(() => useVisualizationWebSocket({
      dataSource: 'health_metrics',
      metrics: ['Heart Rate']
    }));
    
    const ws = (global.WebSocket as any).mock.instances[0];
    
    // Simulate error
    act(() => {
      ws.simulateError(new Error('Connection failed'));
    });
    
    expect(result.current.error).toBe('Connection error');
    expect(result.current.isConnected).toBe(false);
  });
  
  test('attempts reconnection after connection close', async () => {
    const { result } = renderHook(() => useVisualizationWebSocket({
      dataSource: 'health_metrics',
      metrics: ['Heart Rate']
    }));
    
    const ws = (global.WebSocket as any).mock.instances[0];
    
    // Simulate connection open
    act(() => {
      ws.simulateOpen();
    });
    
    expect(result.current.isConnected).toBe(true);
    
    // Simulate connection close (abnormal)
    act(() => {
      ws.simulateClose(1006, 'Connection lost');
    });
    
    expect(result.current.isConnected).toBe(false);
    
    // Fast-forward time to trigger reconnect
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // A new WebSocket should have been created
    expect(global.WebSocket).toHaveBeenCalledTimes(2);
  });
  
  test('enters fallback mode after max reconnect attempts', async () => {
    const { result } = renderHook(() => useVisualizationWebSocket({
      dataSource: 'health_metrics',
      metrics: ['Heart Rate']
    }));
    
    // Initial connection
    let ws = (global.WebSocket as any).mock.instances[0];
    
    // Simulate multiple connection failures
    for (let i = 0; i < 6; i++) {
      act(() => {
        // Simulate connection attempt
        ws.simulateClose(1006, 'Connection lost');
      });
      
      act(() => {
        // Advance time to trigger reconnect
        jest.advanceTimersByTime(3000);
      });
      
      // Get the new websocket instance
      ws = (global.WebSocket as any).mock.instances[i + 1];
    }
    
    // Should be in fallback mode after multiple failures
    expect(result.current.isFallbackMode).toBe(true);
    expect(result.current.error).toBe('Connection lost. Using cached data.');
  });
  
  test('loads data from fallback storage in fallback mode', async () => {
    // Mock sessionStorage to return some data
    const mockStoredData = [
      { date: '2023-01-01', 'Heart Rate': 70 }
    ];
    mockSessionStorage.getItem.mockImplementation(() => JSON.stringify(mockStoredData));
    
    // Render the hook with it already in fallback mode (simulate through initial state)
    const { result, rerender } = renderHook(
      (props) => useVisualizationWebSocket(props),
      {
        initialProps: {
          dataSource: 'health_metrics',
          metrics: ['Heart Rate']
        }
      }
    );
    
    // Force the component into fallback mode
    let ws = (global.WebSocket as any).mock.instances[0];
    for (let i = 0; i < 6; i++) {
      act(() => {
        ws.simulateClose(1006);
        jest.advanceTimersByTime(3000);
      });
      ws = (global.WebSocket as any).mock.instances[i + 1];
    }
    
    expect(result.current.isFallbackMode).toBe(true);
    
    // Change the config to trigger loading from fallback
    act(() => {
      rerender({
        dataSource: 'health_metrics',
        metrics: ['Heart Rate', 'Blood Pressure']
      });
    });
    
    // Should have attempted to load from storage
    expect(mockSessionStorage.getItem).toHaveBeenCalled();
    expect(result.current.latestData).toEqual(mockStoredData);
  });
  
  test('handles manual data refresh request', async () => {
    const { result } = renderHook(() => useVisualizationWebSocket({
      dataSource: 'health_metrics',
      metrics: ['Heart Rate']
    }));
    
    const ws = (global.WebSocket as any).mock.instances[0];
    
    // Simulate connection open
    act(() => {
      ws.simulateOpen();
    });
    
    // Request data refresh
    act(() => {
      result.current.requestDataRefresh();
    });
    
    // Should have sent a refresh message
    expect(ws.send).toHaveBeenCalledTimes(2); // First for subscribe, second for refresh
    const refreshMessage = JSON.parse(ws.send.mock.calls[1][0]);
    expect(refreshMessage.type).toBe('refresh');
  });
  
  test('updates subscription when config changes', async () => {
    const { rerender } = renderHook(
      (props) => useVisualizationWebSocket(props),
      {
        initialProps: {
          dataSource: 'health_metrics',
          metrics: ['Heart Rate']
        }
      }
    );
    
    const ws = (global.WebSocket as any).mock.instances[0];
    
    // Simulate connection open
    act(() => {
      ws.simulateOpen();
    });
    
    // Change the config
    act(() => {
      rerender({
        dataSource: 'health_metrics',
        metrics: ['Heart Rate', 'Blood Pressure']
      });
    });
    
    // Should have sent an update subscription message
    expect(ws.send).toHaveBeenCalledTimes(2); // First for subscribe, second for update
    const updateMessage = JSON.parse(ws.send.mock.calls[1][0]);
    expect(updateMessage.type).toBe('update_subscription');
    expect(updateMessage.config.metrics).toContain('Blood Pressure');
  });
});
