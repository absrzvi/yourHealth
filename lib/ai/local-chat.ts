/**
 * Helper functions for interacting with the local FastAPI backend
 * that powers our AI chat using Ollama models
 */
import axios from 'axios';

// Default to localhost:8000 if not specified in environment variables
const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL || 'http://localhost:8000';

// Track API availability
let isLocalApiAvailable: boolean | null = null;
let lastAvailabilityCheck: number = 0;
const AVAILABILITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Send a chat message to the local FastAPI backend
 */
interface UserProfile {
  // Define the structure of userProfile if known
  [key: string]: unknown;
}

export async function localChatCompletion(
  message: string,
  userProfile: UserProfile = {},
  sessionId?: string
) {
  try {
    const response = await axios.post(`${FASTAPI_BASE_URL}/chat`, {
      message,
      context: {
        user_profile: userProfile,
        session_id: sessionId
      }
    });

    return response.data.data.response;
  } catch (error) {
    console.error('Error in local chat completion:', error);
    throw error;
  }
}

/**
 * Stream a chat message from the local FastAPI backend 
 */
export async function* streamLocalChatCompletion(
  message: string, 
  userProfile: UserProfile = {},
  sessionId?: string
) {
  // Check if local API is available
  const isAvailable = await checkLocalApiAvailability();
  if (!isAvailable) {
    throw new Error('Local chat service is currently unavailable. Please check if the local API server is running.');
  }
  
  const controller = new AbortController();
  const { signal } = controller;

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context: {
          user_profile: userProfile,
          session_id: sessionId
        }
      }),
      signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      
      if (done) {
        break;
      }
      
      // Decode the chunk and add it to our buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process all complete lines in the buffer
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep the last incomplete chunk in the buffer
      
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) {
          continue;
        }
        
        try {
          // Extract the JSON data after 'data: '
          const jsonString = line.slice(6);
          const data = JSON.parse(jsonString);
          
          // If we have a token or content, yield it
          if (data.token) {
            yield data.token;
          }
          
          // Handle completion or error
          if (data.done || data.error) {
            if (data.error) {
              console.error('Stream error:', data.error);
            }
            break;
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e, line);
        }
      }
    }
  } catch (error) {
    console.error('Error in streaming chat completion:', error);
    throw error;
  }
  
  return controller.abort();
}

/**
 * Check if the local API server is available with caching
 */
export async function checkLocalApiAvailability(forceCheck = false): Promise<boolean> {
  const now = Date.now();
  
  // Return cached result if it's still fresh
  if (!forceCheck && isLocalApiAvailable !== null && (now - lastAvailabilityCheck) < AVAILABILITY_CHECK_INTERVAL) {
    return isLocalApiAvailable;
  }
  
  try {
    const response = await axios.get(`${FASTAPI_BASE_URL}/`, {
      timeout: 2000, // 2 second timeout
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    isLocalApiAvailable = response.status === 200;
    lastAvailabilityCheck = now;
    return isLocalApiAvailable;
  } catch (error) {
    console.error('Local API server check failed:', error);
    isLocalApiAvailable = false;
    lastAvailabilityCheck = now;
    return false;
  }
}
