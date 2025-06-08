'use client';

import { useEffect, useRef } from 'react';
import { useAICoachStore } from '@/stores/aiCoachStore';

/**
 * Custom hook to safely initialize the AI Coach store
 * This prevents infinite update loops by ensuring initialization happens only once
 */
export function useAICoachInitializer() {
  const initialized = useRef(false);
  const createNewSession = useAICoachStore(state => state.createNewSession);
  const currentSessionId = useAICoachStore(state => state.currentSessionId);
  const sessions = useAICoachStore(state => state.sessions);
  
  // Initialize the store safely
  useEffect(() => {
    // Skip if already initialized or if we already have a session
    if (initialized.current || (currentSessionId && sessions[currentSessionId])) {
      return;
    }
    
    // Set initialization flag to prevent multiple initializations
    initialized.current = true;
    
    // Create a new session if needed
    if (!currentSessionId || !sessions[currentSessionId]) {
      // Use setTimeout to break the render cycle and prevent infinite loops
      setTimeout(() => {
        createNewSession();
      }, 0);
    }
    
    // Clean up function
    return () => {
      // No cleanup needed
    };
  }, [createNewSession, currentSessionId, sessions]);
  
  return {
    initialized: initialized.current || Boolean(currentSessionId && sessions[currentSessionId])
  };
}
