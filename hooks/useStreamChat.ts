import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getChatSession } from '@/lib/api/chat';

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';
export type MessageType = 'text' | 'chart' | 'dashboard' | 'insights' | 'error' | 'visualization';
export type MessageStatus = 'sending' | 'streaming' | 'sent' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string | Record<string, any>;
  timestamp: Date;
  status?: MessageStatus;
  chatSessionId?: string;
  isVisualization?: boolean;
  visualizationType?: 'chart' | 'dashboard' | 'insights';
}

export function useStreamChat(initialSessionId?: string) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | undefined>(initialSessionId);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any ongoing streams and timers when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);
  
  // Load messages from the chat session when the session ID changes
  useEffect(() => {
    if (!chatSessionId || !session?.user) return;
    
    const loadSessionMessages = async () => {
      try {
        const chatSession = await getChatSession(chatSessionId);
        
        if (chatSession && chatSession.messages) {
          // Convert DB messages to our ChatMessage format
          const formattedMessages: ChatMessage[] = chatSession.messages.map(msg => ({
            id: msg.id,
            role: msg.role as MessageRole,
            type: 'text', // Assume text by default
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            status: 'sent',
            chatSessionId: msg.chatSessionId
          }));
          
          setMessages(formattedMessages);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error loading chat session messages:', error);
      }
    };
    
    if (!isInitialized) {
      loadSessionMessages();
    }
  }, [chatSessionId, session, isInitialized]);

  // Start typing indicator with random timing to simulate realistic typing
  const startTypingIndicator = useCallback(() => {
    setIsTyping(true);
    // Set a timeout to stop typing after a random period between 1-3 seconds
    // This creates a more realistic typing appearance before streaming starts
    const typingDelay = Math.floor(Math.random() * 2000) + 1000;
    
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    typingTimerRef.current = setTimeout(() => {
      // Only stop the typing indicator if we're still in typing state
      // and not actively streaming a response yet
      if (!isStreaming) {
        setIsTyping(false);
      }
    }, typingDelay);
  }, [isStreaming]);

  // Send a message and receive a streaming response
  const sendMessage = useCallback(async (messageText: string, chatSessionId?: string) => {
    if (!messageText.trim() || !session?.user) return null;

    // Create a new abort controller for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'USER',
      type: 'text',
      content: messageText,
      timestamp: new Date(),
      status: 'sending',
    };

    // Add user message to state
    setMessages(prev => [...prev, userMessage]);
    
    // Start typing indicator
    startTypingIndicator();

    try {
      // Create placeholder for assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'ASSISTANT',
        type: 'text',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
      };

      // Small delay to show typing indicator before adding the assistant message
      setTimeout(() => {
        setMessages(prev => [
          ...prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, status: 'sent' as const } 
              : msg
          ),
          assistantMessage
        ]);
        setIsTyping(false);
        setIsStreaming(true);
      }, 800);

      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText, chatSessionId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // End of stream
          break;
        }
        
        // Decode and process the chunk
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.content) {
                // Accumulate the content
                accumulatedResponse += data.content;
                
                // Update the message content in real-time
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedResponse }
                      : msg
                  )
                );
              }
              
              if (data.done) {
                // Stream completed, update message status
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, status: 'sent' as const }
                      : msg
                  )
                );
                setIsStreaming(false);
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }

      return {
        userMessage,
        assistantMessage: {
          ...assistantMessage,
          content: accumulatedResponse,
          status: 'sent' as const
        }
      };
    } catch (error) {
      console.error('Error in stream chat:', error);
      
      // Check if it's an abort error (user cancelled)
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Request was cancelled');
        return null;
      }
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'ASSISTANT',
        type: 'error',
        content: {
          error: 'Failed to generate a response. Please try again.'
        },
        timestamp: new Date(),
        status: 'error',
      };
      
      setMessages(prev => [
        ...prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as const } 
            : msg
        ),
        errorMessage
      ]);
      
      setIsTyping(false);
      setIsStreaming(false);
      return null;
    }
  }, [session, startTypingIndicator]);

  // Cancel any ongoing streams
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsTyping(false);
  }, []);

  // Set or change the current chat session
  const setActiveChatSession = useCallback((sessionId: string) => {
    if (sessionId !== chatSessionId) {
      setChatSessionId(sessionId);
      setIsInitialized(false); // Trigger reloading messages
    }
  }, [chatSessionId]);
  
  // Clear messages (for new chat)
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    setMessages,
    sendMessage,
    cancelStream,
    isStreaming,
    isTyping,
    chatSessionId,
    setActiveChatSession,
    clearMessages
  };
}
