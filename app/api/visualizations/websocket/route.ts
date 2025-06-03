import { NextRequest } from 'next/server';
import { WebSocketServer } from 'ws';
import { getSession } from '../../.././../lib/auth/session';
import * as visualizationService from '../../.././../lib/ai/visualizationService';

/**
 * WebSocket server for real-time visualization data updates
 * 
 * This implementation uses the 'ws' package for WebSocket functionality
 * and integrates with the visualization service to provide real-time data updates.
 */

// Map to store active client connections and their subscriptions
const clients = new Map();

// Create WebSocket server instance (initialized only once)
let wss: WebSocketServer | null = null;

// Health metric generators for different data sources
const healthDataGenerators = {
  health_metrics: (metrics: string[], timeRange: string) => {
    // Generate health metrics data based on metrics and timeRange
    const dataPoints = timeRange === 'LAST_WEEK' ? 7 : timeRange === 'LAST_MONTH' ? 30 : 90;
    
    return Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (dataPoints - 1 - i));
      
      const dataPoint: any = {
        date: date.toISOString().split('T')[0]
      };
      
      // Add value for each requested metric
      metrics.forEach(metric => {
        if (metric === 'Heart Rate') {
          dataPoint[metric] = 65 + Math.floor(Math.random() * 15);
        } else if (metric === 'Blood Pressure Systolic') {
          dataPoint[metric] = 115 + Math.floor(Math.random() * 15);
        } else if (metric === 'Blood Pressure Diastolic') {
          dataPoint[metric] = 75 + Math.floor(Math.random() * 10);
        } else if (metric === 'Glucose') {
          dataPoint[metric] = 95 + Math.floor(Math.random() * 20);
        } else {
          dataPoint[metric] = 50 + Math.floor(Math.random() * 50);
        }
      });
      
      return dataPoint;
    });
  },
  sleep_data: (metrics: string[], timeRange: string) => {
    const dataPoints = timeRange === 'LAST_WEEK' ? 7 : timeRange === 'LAST_MONTH' ? 30 : 90;
    
    return Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (dataPoints - 1 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        'Sleep Duration': 5 + Math.floor(Math.random() * 4),
        'Sleep Quality': Math.floor(Math.random() * 100)
      };
    });
  },
  weight_log: (metrics: string[], timeRange: string) => {
    const dataPoints = timeRange === 'LAST_WEEK' ? 7 : timeRange === 'LAST_MONTH' ? 30 : 90;
    
    // Create a trend with small variations
    const baseWeight = 70 + Math.floor(Math.random() * 20);
    let currentWeight = baseWeight;
    
    return Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (dataPoints - 1 - i));
      
      // Small day-to-day variation with slight trend downward
      currentWeight += (Math.random() - 0.55) * 0.3;
      
      return {
        date: date.toISOString().split('T')[0],
        'Weight': parseFloat(currentWeight.toFixed(1))
      };
    });
  },
  blood_test: (metrics: string[], timeRange: string) => {
    // Generate fewer data points for blood tests as they're less frequent
    const dataPoints = timeRange === 'LAST_WEEK' ? 1 : timeRange === 'LAST_MONTH' ? 2 : 6;
    
    return Array.from({ length: dataPoints }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor((dataPoints - i) * 30 / dataPoints));
      
      const dataPoint: any = {
        date: date.toISOString().split('T')[0]
      };
      
      metrics.forEach(metric => {
        if (metric === 'LDL Cholesterol') {
          dataPoint[metric] = 100 + Math.floor(Math.random() * 30);
        } else if (metric === 'HDL Cholesterol') {
          dataPoint[metric] = 50 + Math.floor(Math.random() * 15);
        } else if (metric === 'Total Cholesterol') {
          dataPoint[metric] = 180 + Math.floor(Math.random() * 40);
        } else {
          dataPoint[metric] = 50 + Math.floor(Math.random() * 50);
        }
      });
      
      return dataPoint;
    });
  }
};

/**
 * Initialize WebSocket server if needed
 */
function initializeWebSocketServer(server: any) {
  if (!wss && server) {
    wss = new WebSocketServer({ server });
    
    wss.on('connection', handleConnection);
    
    console.log('WebSocket server for visualizations initialized');
  }
  
  return wss;
}

/**
 * Handle new WebSocket connections
 */
function handleConnection(ws: any) {
  const clientId = Date.now().toString();
  const clientData = { 
    ws, 
    subscriptions: [], 
    userId: null,
    authenticated: false,
    refreshIntervals: new Map()
  };
  
  clients.set(clientId, clientData);
  
  console.log(`Client connected: ${clientId}`);
  
  // Handle messages from client
  ws.on('message', async (message: any) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      
      switch (parsedMessage.type) {
        case 'authenticate':
          await handleAuthentication(clientId, parsedMessage.token);
          break;
          
        case 'subscribe':
          handleSubscription(clientId, parsedMessage.config);
          break;
          
        case 'update_subscription':
          handleUpdateSubscription(clientId, parsedMessage.config);
          break;
          
        case 'refresh':
          sendDataUpdate(clientId, parsedMessage.config);
          break;
          
        case 'unsubscribe':
          handleUnsubscribe(clientId);
          break;
          
        default:
          sendError(clientId, 'Unknown message type', 'UNKNOWN_MESSAGE_TYPE');
      }
    } catch (err) {
      console.error('Error processing message:', err);
      sendError(clientId, 'Failed to process message', 'MESSAGE_PROCESSING_ERROR');
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    const client = clients.get(clientId);
    
    // Clear any refresh intervals
    if (client && client.refreshIntervals) {
      for (const interval of client.refreshIntervals.values()) {
        clearInterval(interval);
      }
    }
    
    // Remove client from the map
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });
  
  // Send initial connection acknowledgment
  ws.send(JSON.stringify({
    type: 'connection_established',
    clientId,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Handle client authentication
 */
async function handleAuthentication(clientId: string, token: string) {
  const client = clients.get(clientId);
  
  if (!client) {
    return;
  }
  
  try {
    // Validate session (in a real implementation, validate the token)
    const session = { user: { id: 'sample-user-id' } }; // Mocked for demo
    
    if (session && session.user) {
      client.authenticated = true;
      client.userId = session.user.id;
      
      client.ws.send(JSON.stringify({
        type: 'authentication_success',
        userId: client.userId,
        timestamp: new Date().toISOString()
      }));
    } else {
      sendError(clientId, 'Authentication failed', 'AUTHENTICATION_FAILED');
    }
  } catch (err) {
    console.error('Authentication error:', err);
    sendError(clientId, 'Authentication failed', 'AUTHENTICATION_ERROR');
  }
}

/**
 * Handle subscription requests
 */
function handleSubscription(clientId: string, config: any) {
  const client = clients.get(clientId);
  
  if (!client) {
    return;
  }
  
  // Add subscription
  const subscriptionId = Date.now().toString();
  const subscription = {
    id: subscriptionId,
    config
  };
  
  client.subscriptions.push(subscription);
  
  // Send initial data update
  sendDataUpdate(clientId, config);
  
  // Set up refresh interval if configured
  if (config.refreshInterval && config.refreshInterval > 0) {
    const interval = setInterval(() => {
      sendDataUpdate(clientId, config);
    }, config.refreshInterval);
    
    client.refreshIntervals.set(subscriptionId, interval);
  }
  
  // Send subscription acknowledgment
  client.ws.send(JSON.stringify({
    type: 'subscription_success',
    subscriptionId,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Handle subscription updates
 */
function handleUpdateSubscription(clientId: string, newConfig: any) {
  const client = clients.get(clientId);
  
  if (!client) {
    return;
  }
  
  // Update the existing subscription
  if (client.subscriptions.length > 0) {
    const subscription = client.subscriptions[0];
    subscription.config = newConfig;
    
    // Clear existing refresh interval
    if (client.refreshIntervals.has(subscription.id)) {
      clearInterval(client.refreshIntervals.get(subscription.id));
      client.refreshIntervals.delete(subscription.id);
    }
    
    // Set up new refresh interval if configured
    if (newConfig.refreshInterval && newConfig.refreshInterval > 0) {
      const interval = setInterval(() => {
        sendDataUpdate(clientId, newConfig);
      }, newConfig.refreshInterval);
      
      client.refreshIntervals.set(subscription.id, interval);
    }
    
    // Send immediate data update with new config
    sendDataUpdate(clientId, newConfig);
  }
}

/**
 * Handle unsubscribe requests
 */
function handleUnsubscribe(clientId: string) {
  const client = clients.get(clientId);
  
  if (!client) {
    return;
  }
  
  // Clear all refresh intervals
  for (const interval of client.refreshIntervals.values()) {
    clearInterval(interval);
  }
  
  client.refreshIntervals.clear();
  client.subscriptions = [];
  
  // Send unsubscribe acknowledgment
  client.ws.send(JSON.stringify({
    type: 'unsubscribe_success',
    timestamp: new Date().toISOString()
  }));
}

/**
 * Send error message to client
 */
function sendError(clientId: string, message: string, code: string) {
  const client = clients.get(clientId);
  
  if (!client) {
    return;
  }
  
  client.ws.send(JSON.stringify({
    type: 'error',
    message,
    code,
    timestamp: new Date().toISOString()
  }));
}

/**
 * Send data update to client
 */
function sendDataUpdate(clientId: string, config: any) {
  const client = clients.get(clientId);
  
  if (!client) {
    return;
  }
  
  try {
    // Process data sources
    const dataSources = Array.isArray(config.dataSource) 
      ? config.dataSource 
      : [config.dataSource];
    
    // For each data source, send an update
    dataSources.forEach(dataSource => {
      if (!dataSource || !healthDataGenerators[dataSource]) {
        return;
      }
      
      const metrics = config.metrics || ['Heart Rate'];
      const timeRange = config.timeRange || 'LAST_MONTH';
      
      // Generate data for this source and metrics
      const data = healthDataGenerators[dataSource](metrics, timeRange);
      
      // Send the data update
      client.ws.send(JSON.stringify({
        type: 'data_update',
        dataSource,
        metrics,
        data,
        timestamp: new Date().toISOString()
      }));
    });
  } catch (err) {
    console.error('Error sending data update:', err);
    sendError(clientId, 'Failed to generate data update', 'DATA_UPDATE_ERROR');
  }
}

/**
 * POST handler for WebSocket upgrade
 */
export async function POST(req: NextRequest) {
  // This is a dummy endpoint for WebSocket upgrade
  // The actual upgrade happens in middleware
  return new Response('WebSocket endpoint', { status: 400 });
}

/**
 * GET handler for WebSocket upgrade
 */
export async function GET(req: NextRequest) {
  // This is a dummy endpoint for WebSocket upgrade
  // The actual upgrade happens in middleware
  return new Response('WebSocket endpoint', { status: 400 });
}

// Export the initialize function to be used in middleware
export { initializeWebSocketServer };
