// components/ai-coach/ChatInterface.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { MessageSearch } from '../chat/MessageSearch';
import { VisualizationMessage } from './VisualizationMessage';
import { useAICoachStore } from '@/stores/aiCoachStore';
import { 
  Message, 
  MessageStatus, 
  MessageType,
} from '@/types/chat.types';

// No need to import AICoachState type explicitly

// Helper interfaces for our components

// Helper interfaces for our components
interface MessageStatusIndicatorProps {
  status: MessageStatus;
}

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
}

/**
 * Component that displays status indicators for messages
 */
const MessageStatusIndicator = ({ status }: MessageStatusIndicatorProps): JSX.Element => {
  const statusIcons: Record<MessageStatus, JSX.Element> = {
    sending: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    sent: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    delivered: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    read: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6L9 17l-5-5" />
        <path d="M20 12L9 23l-5-5" />
      </svg>
    ),
    error: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    streaming: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  };

  return (
    <div className="ml-1 text-gray-400 flex items-center">
      {statusIcons[status] || null}
    </div>
  );
};

/**
 * Component that shows an animated typing indicator
 */
const TypingIndicator = (): JSX.Element => {
  return (
    <div className="flex gap-1 p-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

/**
 * Component to render individual message bubbles
 */
const MessageBubble = React.memo((
  { message, isLast }: MessageBubbleProps
): JSX.Element => {
  // Determine if the message is from the user or AI
  const isUser = message.role !== 'ASSISTANT';
  const formattedDate = message.timestamp ? format(new Date(message.timestamp), 'MMM d, h:mm a') : '';
  const messageRole = isUser ? 'You' : 'AI Coach';
  
  // Use the message type or default to text
  const messageType = message.type as MessageType || 'text';
  
  return (
    <div 
      className={`px-4 py-6 ${isUser ? 'bg-gray-100' : 'bg-white'} ${isLast ? '' : 'border-b border-gray-200'}`}
      id={`message-${message.id}`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">{messageRole}</span>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
      
      <div className="text-gray-900">
        {/* Handle different message types */}
        {messageType === 'text' ? (
          <div className="prose prose-blue prose-sm sm:prose-base max-w-none">
            {message.content as string}
          </div>
        ) : messageType === 'chart' || messageType === 'dashboard' ? (
          <VisualizationMessage 
            type={messageType} 
            data={typeof message.content === 'string' ? JSON.parse(message.content) : message.content} 
          />
        ) : messageType === 'error' ? (
          <div className="text-red-500">
            <p className="font-semibold">Error:</p>
            <p>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</p>
          </div>
        ) : (
          <div>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</div>
        )}
        
        {message.status && (
          <div className="flex justify-end mt-1">
            <MessageStatusIndicator status={message.status} />
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if message content, status, or isLast changed
  return (
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.isLast === nextProps.isLast
  );
});

MessageBubble.displayName = 'MessageBubble';

/**
 * Main chat interface component
 */
const ChatInterface = ({
  showDebug = false, // Default to false for production
  className = '',
}: {
  showDebug?: boolean;
  className?: string;
}): JSX.Element => {
  // Get authentication session if needed in the future
  // const { data: session } = useSession();
  // Using a fixed value for typing indicator since we removed the input functionality
  const isTyping = false; // Static value as input functionality has been removed
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use refs to track state changes and prevent infinite loops
  const storeInitializedRef = useRef(false);
  
  // Get chat state using individual selectors to prevent unnecessary re-renders
  // Use stable selector functions to prevent unnecessary re-renders
  const currentSessionId = useAICoachStore(useCallback((state) => state.currentSessionId || undefined, []));
  
  const messages = useAICoachStore(useCallback((state) => {
    if (!state.currentSessionId || !state.sessions[state.currentSessionId]) {
      return [];
    }
    return state.sessions[state.currentSessionId].messages || [];
  }, []));

  const handleSearchResultClick = useCallback(() => {
    setShowSearch(false);
    // TODO: Implement scroll to message
    // TODO: Select the suitable message for highlighting
    // TODO: Switch to the correct session if needed
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Move store access outside of the callback to prevent stale closures
  const createNewSession = useAICoachStore(state => state.createNewSession);
  
  const createNewChat = useCallback(async () => {
    try {
      await createNewSession();
      return true;
    } catch (error) {
      console.error('Error creating new chat session:', error);
      return null;
    }
  }, [createNewSession]);

  const loadChatSession = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    // Loading state management removed as we no longer need input functionality
    try {
      const response = await fetch(`/api/chat/${sessionId}`);
      if (response.ok) {
        // Data is now handled by the store
      } else if (response.status === 404) {
        await createNewChat();
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  }, [createNewChat]);

  // handleSendMessage function removed as the input element has been removed
  // Message sending is now handled by the ChatInput component

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Only load chat session on initial mount or when session ID changes
  const didInitialize = useRef(false);
  
  useEffect(() => {
    // Skip if the store is already initialized
    if (storeInitializedRef.current) return;
    
    // Skip the initial load if we don't have a session ID yet
    if (!currentSessionId) {
      // If no session ID, we might need to create a new session
      // But we'll let the store handle that through the useAICoachInitializer hook
      return;
    }
    
    // Mark the store as initialized to prevent further initialization attempts
    storeInitializedRef.current = true;
    
    // Only load once per component mount to prevent loops
    if (didInitialize.current) return;
    didInitialize.current = true;
    
    // Use setTimeout to break the render cycle and prevent infinite loops
    setTimeout(() => {
      loadChatSession(currentSessionId);
    }, 0);
    
    // No cleanup needed for the timeout since it only runs once
    return () => {};
  }, [currentSessionId, loadChatSession]);

  return (
    <div className={`relative flex flex-col bg-white h-full ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-semibold text-lg">AI Health Coach</h2>
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="p-2 text-gray-500 hover:text-gray-700"
          aria-label="Search messages"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Debug Panel - Only show in development */}
      {showDebug && (
        <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
        <div className="font-semibold">Debug Info:</div>
        <div>Session: {currentSessionId || 'none'}</div>
        <div>Messages: {messages.length}</div>
      </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-4">
            <h3 className="font-semibold mb-2">Welcome to AI Health Coach</h3>
            <p>Send a message to get started</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isLast={index === messages.length - 1} 
              />
            ))}
            {isTyping && (
              <div className="flex items-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input section removed as requested */}
      {/* We've removed the entire input section to maintain clean UI */}

      {/* Search Overlay */}
      {showSearch && (
        <div className="absolute inset-0 bg-white z-10 p-4">
          <MessageSearch
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
            currentSessionId={currentSessionId}
            onResultClick={handleSearchResultClick}
          />
        </div>
      )}
      
      <style>{`
        @keyframes highlight {
          0% { background-color: rgba(59, 130, 246, 0.1); }
          100% { background-color: transparent; }
        }
        
        .animate-highlight {
          animation: highlight 2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;