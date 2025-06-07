// components/ai-coach/ChatInterface.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, FC } from 'react';
import { useSession } from 'next-auth/react';
import { VisualizationMessage } from './VisualizationMessage';
import { MessageSearch } from '../chat/MessageSearch';
import { Search, X, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { handleSendMessage as streamingSendMessage } from './handleSendMessage';
import { 
  Message, 
  MessageStatus, 
  MessageRole, 
  MessageType,
  LLMProvider,
  ChatSession
} from '@/types/chat.types';

// Re-export types for external use
export type { 
  Message as ChatMessage, 
  MessageStatus, 
  MessageRole, 
  MessageType,
  LLMProvider,
  ChatSession as ChatSessionType
};

// ChatSession type is now imported from chat.types.ts

interface ChatInterfaceProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  initialMessages?: Message[];
  sessionId?: string;
  showDebug?: boolean; // Make debug panel optional
}

// Separate components for better organization
const MessageStatusIndicator: FC<{ status: MessageStatus }> = ({ status }) => {
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

const TypingIndicator: FC = () => {
  return (
    <div className="flex gap-1 p-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

const SourceBadge: FC<{ source?: LLMProvider }> = ({ source }) => {
  const badgeConfig: Record<LLMProvider, { color: string; emoji: string; label: string }> = {
    ollama: { color: 'bg-green-500', emoji: '🟢', label: 'Local' },
    openai: { color: 'bg-orange-500', emoji: '🟠', label: 'OpenAI' },
    pending: { color: 'bg-gray-400', emoji: '⚪', label: 'Processing' },
    error: { color: 'bg-red-500', emoji: '🔴', label: 'Error' },
  };

  const config = source ? badgeConfig[source] : badgeConfig.pending;

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-semibold ${config.color}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </div>
  );
};

const MessageBubble: FC<{ message: Message; isLast: boolean }> = React.memo(
  ({ message, isLast }) => {
    const isUser = message.role === 'USER';
    
    return (
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-2`}>
        <div className={`flex items-end max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            className={`
              ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}
              rounded-2xl px-4 py-3 ${isUser ? 'ml-2' : 'mr-2'}
              break-words whitespace-pre-wrap shadow-sm
              ${isLast ? 'animate-highlight' : ''}
            `}
          >
            {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
          </div>
          {!isUser && message.status && <MessageStatusIndicator status={message.status} />}
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{format(message.timestamp, 'h:mm a')}</span>
          {!isUser && <SourceBadge source={message.llmProvider} />}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.status === nextProps.message.status &&
      prevProps.message.llmProvider === nextProps.message.llmProvider &&
      prevProps.isLast === nextProps.isLast
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

const ChatInterface: FC<ChatInterfaceProps> = ({
  isOpen = true,
  onMouseEnter = () => {},
  onMouseLeave = () => {},
  initialMessages = [],
  sessionId,
  showDebug = false, // Default to false for production
}): JSX.Element => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const handleSearchResultClick = useCallback((sessionId: string, messageId: string) => {
    setShowSearch(false);
    // TODO: Implement scroll to message
  }, []);
  
  const updateCurrentSessionId = useCallback((sessionId: string | undefined) => {
    setCurrentSessionId(sessionId);
    if (typeof window !== 'undefined') {
      if (sessionId) {
        localStorage.setItem('currentChatSessionId', sessionId);
      } else {
        localStorage.removeItem('currentChatSessionId');
      }
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadChatSession = useCallback(async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        const typedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(typedMessages);
        updateCurrentSessionId(sessionId);
      } else if (response.status === 404) {
        await createNewChat();
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [updateCurrentSessionId]);

  const createNewChat = useCallback(async (initialMessage?: string) => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: initialMessage ? initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : '') : 'New Chat' 
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        updateCurrentSessionId(data.id);
        setMessages([]);
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating new chat session:', error);
      return null;
    }
  }, [updateCurrentSessionId]);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    // Create abort controller for this request
    const controller = new AbortController();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = controller;

    // Generate message IDs
    const userMessageId = `user-${Date.now()}`;
    const aiMessageId = `ai-${Date.now()}`;

    // Create messages with proper typing
    const userMessage: Message = {
      id: userMessageId,
      role: 'USER',
      type: 'text',
      content: messageContent,
      timestamp: new Date(),
      status: 'sent',
      chatSessionId: currentSessionId || undefined,
      llmProvider: undefined
    };

    const aiMessage: Message = {
      id: aiMessageId,
      role: 'ASSISTANT',
      type: 'text',
      content: '',
      timestamp: new Date(),
      status: 'sending',
      chatSessionId: currentSessionId || undefined,
      llmProvider: 'pending' as const
    };

    // Add messages to the chat
    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      await streamingSendMessage(
        messageContent,
        currentSessionId,
        setMessages,
        setIsLoading,
        setIsTyping,
        scrollToBottom,
        controller,
        aiMessageId
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? {
                ...msg,
                content: 'Sorry, there was an error processing your message. Please try again.',
                status: 'error',
                timestamp: new Date(),
                llmProvider: 'error' as const
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, currentSessionId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (currentSessionId) {
      loadChatSession(currentSessionId);
    }
  }, [currentSessionId, loadChatSession]);

  return (
    <div 
      className={`
        fixed bottom-4 right-4 w-[400px] max-h-[600px] bg-white rounded-xl
        shadow-2xl flex flex-col z-50 transition-all duration-200
        ${isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-5'}
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
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

      {/* Input */}
      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (inputText.trim()) {
              handleSendMessage(inputText);
            }
          }}
          className="relative"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message AI Health Coach..."
            className="w-full pl-4 pr-20 py-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputText.trim()) {
                  handleSendMessage(inputText);
                }
              }
            }}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Clear message"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className={`
                p-2 rounded-full transition-colors
                ${isLoading || !inputText.trim() 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'}
              `}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <Send size={18} className="text-white" />
              )}
            </button>
          </div>
        </form>
      </div>

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
      
      <style jsx>{`
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