// components/ai-coach/ChatInterface.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, FC } from 'react';
import { useSession } from 'next-auth/react';
import { VisualizationMessage } from './VisualizationMessage';
import { format } from 'date-fns';

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';
type MessageRole = 'USER' | 'ASSISTANT';

type MessageType = 'text' | 'chart' | 'dashboard' | 'error';

interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string | Record<string, any>;
  timestamp: Date;
  status?: MessageStatus;
  chatSessionId?: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  initialMessages?: Message[];
  sessionId?: string;
}

// Component to render different message types
const MessageContent: FC<{ message: Message }> = ({ message }) => {
  if (message.type === 'text' || typeof message.content === 'string') {
    return <div className="message-content">{message.content as string}</div>;
  }

  if (message.type === 'chart' || message.type === 'dashboard' || message.type === 'error') {
    return (
      <div className="w-full max-w-3xl">
        <VisualizationMessage
          type={message.type}
          data={message.content}
        />
      </div>
    );
  }

  return null;
};

const ChatInterface: FC<ChatInterfaceProps> = ({
  isOpen = true,
  onMouseEnter = () => {},
  onMouseLeave = () => {},
  initialMessages = [],
  sessionId,
}) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Message status component
  const MessageStatusIndicator = ({ status }: { status: MessageStatus }) => {
    const getStatusIcon = () => {
      switch (status) {
        case 'sending':
          return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4m-8-8H2m20 0h-4m-1.6-6.4l-2.8 2.8m-11.2 0L4.4 7.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
        case 'sent':
          return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
        case 'delivered':
          return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
        case 'read':
          return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
        case 'error':
          return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          );
        default:
          return null;
      }
    };

    return (
      <span className="message-status" style={messageStatusStyle}>
        {getStatusIcon()}
      </span>
    );
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div style={typingIndicatorStyle}>
      <div className="typing-dots">
        <span className="dot dot-1" style={typingDotStyle}></span>
        <span className="dot dot-2" style={typingDotStyle}></span>
        <span className="dot dot-3" style={typingDotStyle}></span>
      </div>
      <span className="typing-text" style={typingTextStyle}>Aria is typing</span>
    </div>
  );

    // Move formatTime outside to prevent recreation on each render
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Memoize the MessageBubble component with a custom comparison function
  const MessageBubble = React.memo(function MessageBubble({ 
    message, 
    isLast 
  }: { 
    message: Message; 
    isLast: boolean 
  }) {
    const isUser = message.role === 'USER';
    
    // Use useMemo for styles that don't need to be recreated on every render
    const bubbleStyle = React.useMemo<React.CSSProperties>(() => ({
      position: 'relative',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
      margin: '4px 0',
      padding: '12px 16px',
      borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      backgroundColor: isUser ? '#3b82f6' : '#f3f4f6',
      color: isUser ? 'white' : '#1f2937',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease-out',
      opacity: 1, // Always show messages as visible
      animation: isLast ? 'fadeIn 0.3s ease-out forwards' : 'none',
    }), [isUser, isLast]);

    const timeStyle = React.useMemo<React.CSSProperties>(() => ({
      fontSize: '0.7rem',
      opacity: 0.7,
      marginTop: '4px',
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      alignItems: 'center',
      gap: '4px',
      color: isUser ? 'rgba(255, 255, 255, 0.8)' : '#9ca3af',
    }), [isUser]);

    // Only re-render if message content or status changes
    const messageContent = React.useMemo(() => (
      <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {message.content}
      </div>
    ), [message.content]);

    const messageTime = React.useMemo(() => (
      <div style={timeStyle}>
        {formatTime(message.timestamp)}
        {isUser && message.status && (
          <MessageStatusIndicator status={message.status} />
        )}
      </div>
    ), [isUser, message.status, message.timestamp, timeStyle]);

    return (
      <div 
        className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          margin: '8px 0',
          contain: 'content', // Improves rendering performance
        }}
      >
        <div style={bubbleStyle}>
          {messageContent}
          {messageTime}
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if these specific props change
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.status === nextProps.message.status &&
      prevProps.isLast === nextProps.isLast
    );
  });

  // Message status indicator styles
  const messageStatusStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '8px',
    opacity: 0.7,
  };

  const typingIndicatorStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    margin: '4px 0',
  };

  const typingTextStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginLeft: '8px',
  };

  const typingDotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    margin: '0 2px',
    backgroundColor: '#6b7280',
    borderRadius: '50%',
    display: 'inline-block',
  };

  // Input container style
  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: 'var(--background)',
    borderTop: '1px solid var(--border)'
  };

  // Message content style
  const messageContentStyle = (role: MessageRole): React.CSSProperties => ({
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: role === 'USER' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    backgroundColor: role === 'USER' ? '#3b82f6' : '#f3f4f6',
    color: role === 'USER' ? 'white' : '#1f2937',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  });

  // Button styles
  const buttonStyles: React.CSSProperties = {
    padding: '0.5rem 1.25rem',
    borderRadius: '9999px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonStyles,
    opacity: 0.7,
    cursor: 'not-allowed',
  };

  // Add missing handler functions
  const handleButtonHover = () => {
    // Handle button hover effect
  };

  const handleButtonLeave = () => {
    // Handle button leave effect
  };

  const handleButtonFocus = () => {
    // Handle button focus
  };

  const handleButtonBlur = () => {
    // Handle button blur
  };

  // Fetch chat sessions and messages
  const fetchChatSessions = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch('/api/chat');
      if (!response.ok) throw new Error('Failed to fetch chat sessions');
      const data = await response.json();
      setChatSessions(data.sessions || []);

      // If we have a sessionId but no messages, load that session
      if (currentSessionId && messages.length === 0) {
        await loadChatSession(currentSessionId);
      } else if (data.sessions?.length > 0 && !currentSessionId) {
        // Load the most recent session by default
        await loadChatSession(data.sessions[0].id);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  }, [session, currentSessionId, messages.length]);

  // Load messages for a specific chat session
  const loadChatSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat?chatSessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch chat messages');
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else {
        // Fallback to mock response if no messages found
        setMessages([{
          id: '1',
          role: 'ASSISTANT',
          type: 'text',
          content: 'This is a mock response. In a real app, this would come from the API.',
          timestamp: new Date(),
        } as Message]);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
      // Set a default error message
      setMessages([{
        id: 'error-1',
        role: 'ASSISTANT',
        type: 'text',
        content: 'Failed to load chat messages. Please try again later.',
        timestamp: new Date(),
      } as Message]);
    }
  };

  // Create a new chat session
  const createNewChat = async () => {
    try {
      setIsLoading(true);
      // ... (rest of the code remains the same)
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      type: 'text',
      content: inputText,
      timestamp: new Date(),
      status: 'sending',
      chatSessionId: currentSessionId,
    };

    // Add user message to UI immediately for better UX
    setMessages((prev => [...prev, userMessage]));
    setIsLoading(true);
    setIsTyping(true);
    setInputText('');

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          chatSessionId: currentSessionId,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      // Update the messages with the server's response
      const aiMessage: Message = {
        id: data.id || `ai-${Date.now()}`,
        role: 'ASSISTANT',
        type: 'text',
        content: data.content || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date(data.timestamp || Date.now()),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      // Don't show error if the request was aborted
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);

        // Show error message to the user
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'ASSISTANT',
          type: 'text',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        width: '400px',
        maxHeight: '600px',
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease, visibility 0.2s',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
        {messages.map((message, index) => (
          <MessageBubble key={message.id} message={message} isLast={index === messages.length - 1} />
        ))}
        {isTyping && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            margin: '4px 0',
          }}>
            <div style={messageContentStyle('ASSISTANT')}>
              <TypingIndicator />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={inputContainerStyle}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message AI Health Coach..."
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            border: '1px solid #d1d5db',
            width: '100%',
            fontSize: '1rem',
          }}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          style={{
            ...buttonStyles,
            ...(isLoading ? buttonDisabledStyle : {}),
          }}
          onMouseEnter={handleButtonHover}
          onMouseLeave={handleButtonLeave}
          onFocus={handleButtonFocus}
          onBlur={handleButtonBlur}
          disabled={isLoading || !inputText.trim()}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Sending...
            </div>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
