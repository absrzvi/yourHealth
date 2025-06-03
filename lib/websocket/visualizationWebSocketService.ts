'use client';

/**
 * Visualization WebSocket Service
 * 
 * This service handles real-time data updates for health visualizations
 * using WebSockets. It provides methods for subscribing to specific data
 * sources and metrics, and handles reconnection and message parsing.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type DataSourceType = 
  | 'health_metrics' 
  | 'sleep_data' 
  | 'weight_log' 
  | 'exercise_log' 
  | 'nutrition_log'
  | 'blood_test';

export type SubscriptionConfig = {
  dataSource: DataSourceType | DataSourceType[];
  metrics?: string[];
  timeRange?: string;
  userId?: string;
  refreshInterval?: number; // in milliseconds
};

export type DataUpdateMessage = {
  type: 'data_update';
  dataSource: DataSourceType;
  metrics: string[];
  data: any[];
  timestamp: string;
};

export type ErrorMessage = {
  type: 'error';
  message: string;
  code: string;
};

export type WebSocketMessage = DataUpdateMessage | ErrorMessage;

const WEBSOCKET_RECONNECT_DELAY = 2000; // 2 seconds
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BACKOFF_MULTIPLIER = 1.5; // Exponential backoff

/**
 * Custom hook for using the visualization WebSocket service
 */
export function useVisualizationWebSocket(config: SubscriptionConfig) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestData, setLatestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef<SubscriptionConfig>(config);

  // Function to get the WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/visualizations/websocket`;
  }, []);

  // Reconnect to WebSocket server with exponential backoff
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Calculate backoff time with exponential increase
    const backoffTime = WEBSOCKET_RECONNECT_DELAY * 
      Math.pow(RECONNECT_BACKOFF_MULTIPLIER, Math.min(reconnectAttempts, 8));
    
    setReconnectAttempts(prev => prev + 1);
    
    // If we've exceeded max reconnect attempts, switch to fallback mode
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max WebSocket reconnect attempts reached, switching to fallback mode');
      setIsFallbackMode(true);
      setError('Connection lost. Using cached data.');
      return;
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnecting to WebSocket server... (Attempt ${reconnectAttempts + 1})`);
      connect();
    }, backoffTime);
  }, [reconnectAttempts]);

  // Function to connect to the WebSocket server
  const connect = useCallback(() => {
    // Clear any existing timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Don't attempt to connect if we're not in a browser environment
    if (typeof window === 'undefined') return;
    
    try {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        
        // Send subscription configuration when connection is established
        const subscriptionMessage = {
          type: 'subscribe',
          config: {
            ...configRef.current,
            refreshInterval: configRef.current.refreshInterval || DEFAULT_REFRESH_INTERVAL
          }
        };
        
        ws.send(JSON.stringify(subscriptionMessage));
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          if (message.type === 'data_update') {
            setLatestData(message.data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        
        // Attempt to reconnect after delay
        reconnect();
      };
      
      socketRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      
      // Attempt to reconnect after delay
      reconnect();
    }
  }, [configRef, getWebSocketUrl, reconnect]);

  // Function to load data from fallback storage
  const loadFallbackData = useCallback(() => {
    try {
      const storageKey = `visualization_data_${Array.isArray(configRef.current.dataSource) ? 
        configRef.current.dataSource.join('_') : configRef.current.dataSource}`;
      const storedData = sessionStorage.getItem(storageKey);
      
      if (storedData) {
        setLatestData(JSON.parse(storedData));
        return true;
      }
    } catch (err) {
      console.error('Failed to load fallback data:', err);
    }
    return false;
  }, [configRef]);

  // Request a data refresh from the server
  const requestDataRefresh = useCallback(() => {
    // If in fallback mode, try to load from storage
    if (isFallbackMode) {
      const success = loadFallbackData();
      if (!success) {
        setError('Unable to refresh data. Connection lost and no cached data available.');
      }
      return;
    }
    
    // If connected, send refresh request
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const refreshMessage = JSON.stringify({
        type: 'refresh'
      });
      
      socketRef.current.send(refreshMessage);
    } else {
      // If not connected, attempt to reconnect
      connect();
    }
  }, [isFallbackMode, loadFallbackData, connect]);

  // Set up connection and refresh interval when component mounts
  useEffect(() => {
    connect();
    
    // Set up automatic refresh interval if configured
    if (configRef.current.refreshInterval && configRef.current.refreshInterval > 0) {
      const startRefreshInterval = () => {
        refreshIntervalRef.current = setInterval(() => {
          requestDataRefresh();
        }, configRef.current.refreshInterval);
      };
      startRefreshInterval();
    }
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [connect, configRef, requestDataRefresh]);

  // Update subscription when config changes
  useEffect(() => {
    // Only update if there are actual changes
    if (JSON.stringify(configRef.current) !== JSON.stringify(config)) {
      configRef.current = config;
      
      // If in fallback mode, try to load from storage with new config
      if (isFallbackMode) {
        loadFallbackData();
        return;
      }
      
      // If connected, send updated subscription
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const updateMessage = JSON.stringify({
          type: 'update_subscription',
          config
        });
        
        socketRef.current.send(updateMessage);
      }
      
      // Update refresh interval if needed
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      if (config.refreshInterval) {
        const startRefreshInterval = () => {
          refreshIntervalRef.current = setInterval(() => {
            requestDataRefresh();
          }, config.refreshInterval);
        };
        startRefreshInterval();
      }
    }
  }, [config, isFallbackMode, loadFallbackData, requestDataRefresh]);

  // Initial load of fallback data if available
  useEffect(() => {
    if (isFallbackMode) {
      loadFallbackData();
    }
  }, [isFallbackMode, loadFallbackData]);

  return {
    isConnected,
    latestData,
    error,
    requestDataRefresh,
    isFallbackMode,
    reconnectAttempts
  };
}

/**
 * Standalone service for WebSocket connections without React hooks
 */
export class VisualizationWebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private config: SubscriptionConfig;
  private listeners: Array<(data: any) => void> = [];
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private errorListeners: Array<(error: string) => void> = [];

  constructor(config: SubscriptionConfig) {
    this.config = config;
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/visualizations/websocket`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        // Notify connection listeners
        this.connectionListeners.forEach(listener => listener(true));
        
        // Send subscription config
        if (this.socket) {
          const subscriptionMessage = {
            type: 'subscribe',
            config: {
              ...this.config,
              refreshInterval: this.config.refreshInterval || DEFAULT_REFRESH_INTERVAL
            }
          };
          
          this.socket.send(JSON.stringify(subscriptionMessage));
        }
        
        // Set up refresh interval
        if (this.config.refreshInterval && this.config.refreshInterval > 0) {
          this.refreshInterval = setInterval(() => {
            this.requestDataRefresh();
          }, this.config.refreshInterval);
        }
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          if (message.type === 'data_update') {
            // Notify data listeners
            this.listeners.forEach(listener => listener(message.data));
          } else if (message.type === 'error') {
            // Notify error listeners
            this.errorListeners.forEach(listener => listener(message.message));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      this.socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        this.errorListeners.forEach(listener => listener('WebSocket connection error'));
      };
      
      this.socket.onclose = () => {
        // Notify connection listeners
        this.connectionListeners.forEach(listener => listener(false));
        
        // Clear refresh interval
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
          this.refreshInterval = null;
        }
        
        // Attempt to reconnect after delay
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, WEBSOCKET_RECONNECT_DELAY);
      };
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      this.errorListeners.forEach(listener => listener('Failed to create WebSocket connection'));
      
      // Attempt to reconnect after delay
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, WEBSOCKET_RECONNECT_DELAY);
    }
  }

  /**
   * Request a data refresh from the server
   */
  public requestDataRefresh(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const refreshMessage = {
        type: 'refresh',
        config: {
          dataSource: this.config.dataSource,
          metrics: this.config.metrics,
          timeRange: this.config.timeRange,
          userId: this.config.userId
        }
      };
      
      this.socket.send(JSON.stringify(refreshMessage));
    }
  }

  /**
   * Update the subscription configuration
   */
  public updateConfig(newConfig: SubscriptionConfig): void {
    this.config = newConfig;
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const updateMessage = {
        type: 'update_subscription',
        config: {
          ...newConfig,
          refreshInterval: newConfig.refreshInterval || DEFAULT_REFRESH_INTERVAL
        }
      };
      
      this.socket.send(JSON.stringify(updateMessage));
    }
    
    // Update refresh interval if needed
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    
    if (newConfig.refreshInterval && newConfig.refreshInterval > 0) {
      this.refreshInterval = setInterval(() => {
        this.requestDataRefresh();
      }, newConfig.refreshInterval);
    }
  }

  /**
   * Close the WebSocket connection
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  /**
   * Add a listener for data updates
   */
  public addDataListener(listener: (data: any) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Remove a data listener
   */
  public removeDataListener(listener: (data: any) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Add a connection status listener
   */
  public addConnectionListener(listener: (connected: boolean) => void): void {
    this.connectionListeners.push(listener);
  }
  
  /**
   * Remove a connection status listener
   */
  public removeConnectionListener(listener: (connected: boolean) => void): void {
    const index = this.connectionListeners.indexOf(listener);
    if (index !== -1) {
      this.connectionListeners.splice(index, 1);
    }
  }
  
  /**
   * Add an error listener
   */
  public addErrorListener(listener: (error: string) => void): void {
    this.errorListeners.push(listener);
  }
  
  /**
   * Remove an error listener
   */
  public removeErrorListener(listener: (error: string) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index !== -1) {
      this.errorListeners.splice(index, 1);
    }
  }
}
