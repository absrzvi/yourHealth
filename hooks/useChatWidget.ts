import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

export type ChatWidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface ChatWidgetState {
  isOpen: boolean;
  isMinimized: boolean;
  hasNewMessage: boolean;
  isHovered: boolean;
  position: ChatWidgetPosition;
  showWelcome: boolean;
  sessionId: string | null;
  unreadCount: number;
  lastMessageTime: number | null;
}

export interface UseChatWidgetOptions {
  /**
   * Whether the chat widget is open by default
   * @default false
   */
  defaultOpen?: boolean;
  
  /**
   * Initial position of the chat widget
   * @default 'bottom-right'
   */
  position?: ChatWidgetPosition;
  
  /**
   * Whether to show the welcome screen by default
   * @default true
   */
  showWelcome?: boolean;
  
  /**
   * Whether to persist the widget state in localStorage
   * @default true
   */
  persistState?: boolean;
  
  /**
   * Key to use for localStorage persistence
   * @default 'chat-widget-state'
   */
  storageKey?: string;
}

const DEFAULT_STATE: ChatWidgetState = {
  isOpen: false,
  isMinimized: false,
  hasNewMessage: false,
  isHovered: false,
  position: 'bottom-right',
  showWelcome: true,
  sessionId: null,
  unreadCount: 0,
  lastMessageTime: null,
};

/**
 * A custom hook to manage the chat widget state and behavior
 */
export function useChatWidget({
  defaultOpen = false,
  position = 'bottom-right',
  showWelcome = true,
  persistState = true,
  storageKey = 'chat-widget-state',
}: UseChatWidgetOptions = {}) {
  const { data: session } = useSession();
  const [state, setState] = useState<ChatWidgetState>(() => {
    // Initialize state from localStorage if persistence is enabled
    if (typeof window !== 'undefined' && persistState) {
      try {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          return { ...DEFAULT_STATE, ...JSON.parse(savedState) };
        }
      } catch (error) {
        console.error('Failed to parse chat widget state from localStorage:', error);
      }
    }
    return { ...DEFAULT_STATE, isOpen: defaultOpen, position, showWelcome };
  });

  // Generate a session ID if one doesn't exist
  useEffect(() => {
    if (!state.sessionId) {
      setState(prev => ({
        ...prev,
        sessionId: `session-${uuidv4()}`,
      }));
    }
  }, [state.sessionId]);

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      try {
        const { lastMessageTime, ...stateToPersist } = state;
        localStorage.setItem(storageKey, JSON.stringify(stateToPersist));
      } catch (error) {
        console.error('Failed to save chat widget state to localStorage:', error);
      }
    }
  }, [state, persistState, storageKey]);

  // Handle window blur/focus to detect when user returns to the page
  useEffect(() => {
    if (!persistState) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.hasNewMessage) {
        // Reset new message indicator when user returns to the page
        setState(prev => ({
          ...prev,
          hasNewMessage: false,
          unreadCount: 0,
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [persistState, state.hasNewMessage]);

  const open = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
      hasNewMessage: false,
      unreadCount: 0,
    }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      isMinimized: false,
    }));
  }, []);

  const toggle = useCallback(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, open, close]);

  const minimize = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized,
    }));
  }, []);

  const setPosition = useCallback((position: ChatWidgetPosition) => {
    setState(prev => ({
      ...prev,
      position,
    }));
  }, []);

  const setShowWelcome = useCallback((show: boolean) => {
    setState(prev => ({
      ...prev,
      showWelcome: show,
    }));
  }, []);

  const newMessageReceived = useCallback(() => {
    setState(prev => {
      // If chat is not open or is minimized, increment unread count
      const isChatInactive = !prev.isOpen || prev.isMinimized;
      const isDocumentHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
      
      return {
        ...prev,
        hasNewMessage: isChatInactive || isDocumentHidden,
        unreadCount: isChatInactive || isDocumentHidden ? prev.unreadCount + 1 : 0,
        lastMessageTime: Date.now(),
      };
    });
  }, []);

  const markAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasNewMessage: false,
      unreadCount: 0,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      ...DEFAULT_STATE,
      isOpen: defaultOpen,
      position,
      showWelcome,
      sessionId: `session-${uuidv4()}`,
    });
  }, [defaultOpen, position, showWelcome]);

  return {
    // State
    ...state,
    
    // Actions
    open,
    close,
    toggle,
    minimize,
    setPosition,
    setShowWelcome,
    newMessageReceived,
    markAsRead,
    reset,
    
    // Derived state
    isActive: state.isOpen && !state.isMinimized,
    hasUnread: state.unreadCount > 0,
    
    // Session info
    userId: session?.user?.id,
    userName: session?.user?.name,
    userEmail: session?.user?.email,
    userAvatar: session?.user?.image,
  };
}

export default useChatWidget;
