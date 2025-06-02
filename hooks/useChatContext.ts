import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

// Define types locally until the module is properly imported
type MessageRole = 'USER' | 'ASSISTANT';
type MessageType = 'text' | 'chart' | 'dashboard' | 'error';
type MessageStatus = 'sending' | 'sent' | 'error' | 'streaming';

interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string | Record<string, any>;
  timestamp: Date;
  status?: MessageStatus;
  chatSessionId?: string;
  llmProvider?: string | null;
  llmModel?: string | null;
}

interface ChatSession {
  id: string;
  title: string | null;  // Make title nullable to match backend
  updatedAt: Date;
  messageCount: number;
}

interface ChatContextValue {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  loadSessions: () => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  createSession: (name: string) => Promise<ChatSession | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  sendMessage: (content: string, options?: { type?: MessageType; llmProvider?: string; llmModel?: string }) => Promise<ChatMessage | null>;
  setCurrentSession: (session: ChatSession | null) => void;
}

export const useChatContext = (): ChatContextValue => {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load all chat sessions for the user
  const loadSessions = useCallback(async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/chat/sessions');

      if (!response.ok) {
        throw new Error('Failed to load chat sessions');
      }

      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Error loading chat sessions:', err);
      setError('Failed to load chat sessions');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Load messages for a specific session
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!session) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      setMessages(data.messages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Create a new chat session
  const createSession = useCallback(async (title: string = 'New Chat') => {
    if (!session) return null;

    try {
      setIsLoading(true);
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create chat session');
      }

      const { session: newSession } = await response.json();
      
      // Ensure the session has the expected format
      const formattedSession = {
        ...newSession,
        messageCount: newSession.messageCount || 0,
        updatedAt: newSession.updatedAt ? new Date(newSession.updatedAt) : new Date()
      };
      
      setSessions(prev => [formattedSession, ...prev]);
      setCurrentSession(formattedSession);
      setMessages([]);
      return formattedSession;
    } catch (err) {
      console.error('Error creating chat session:', err);
      setError('Failed to create chat session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Delete a chat session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!session) return false;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat session');
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
      return true;
    } catch (err) {
      console.error('Error deleting chat session:', err);
      setError('Failed to delete chat session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session, currentSession]);

  /**
   * Send a new chat message
   * @param content The message content
   * @param options Additional message options
   * @returns The sent message or null if failed
   */
  const sendMessage = useCallback(async (content: string, options: {
    type?: MessageType;
    llmProvider?: string;
    llmModel?: string;
  } = {}): Promise<ChatMessage | null> => {
    // Declare assistantMessage variable at the start of the function
    let assistantMessage: ChatMessage | null = null;
    if (!currentSession || !session) {
      console.error('No active session or user not authenticated');
      return null;
    }

    // Create a temporary ID for the user's message
    const tempId = `temp-${Date.now()}`;

    // Create the user message object
    const userMessage: ChatMessage = {
      id: tempId,
      role: 'USER',
      type: options.type || 'text',
      content,
      timestamp: new Date(),
      status: 'sending',
      chatSessionId: currentSession.id,
      llmProvider: options.llmProvider || null,
      llmModel: options.llmModel || null,
    };

    // Add the user message to the UI immediately
    setMessages(prev => [...prev, userMessage]);

    try {
      // Log the message being sent
      console.log('Sending request to /api/chat/messages');

      // Send the message to the server
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          content,
          type: options.type || 'text',
          role: 'USER',
          llmProvider: options.llmProvider,
          llmModel: options.llmModel,
        }),
      });

      // Log the response status and headers
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from server:', errorText);
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }

      // Process the response based on content type
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      // Handle non-streaming responses
      if (!contentType?.includes('text/event-stream')) {
        const responseData = await response.json();
        console.log('Non-streaming response:', responseData);

        if (!responseData.message) {
          throw new Error('Invalid response format from server: missing message');
        }

        // Create the saved message object
        const savedMessage: ChatMessage = {
          id: responseData.message.id,
          role: responseData.message.role as MessageRole,
          type: responseData.message.type as MessageType,
          content: responseData.message.content,
          timestamp: new Date(responseData.message.createdAt || Date.now()),
          status: 'sent',
          chatSessionId: responseData.message.chatSessionId,
          llmProvider: responseData.message.llmProvider || null,
          llmModel: responseData.message.llmModel || null,
        };

        // Update the message in the UI
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? savedMessage : msg
          )
        );

        return savedMessage;
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response stream');
      }

      // Create an initial assistant message for streaming
      const tempAssistantId = `assistant-${Date.now()}`;
      assistantMessage = {
        id: tempAssistantId,
        role: 'ASSISTANT',
        type: 'text',
        content: '',
        timestamp: new Date(),
        status: 'streaming',
        chatSessionId: currentSession?.id || '',
      };

      // Add the assistant message to the UI
      setMessages(prev => [...prev, assistantMessage!]);

      console.log('Starting to read stream');

      let responseText = '';
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));

              if (data.done) {
                // Stream completed - update the assistant message with final content
                const finalMessage: ChatMessage = {
                  ...assistantMessage!,
                  content: responseText,
                  status: 'sent',
                  timestamp: new Date()
                };
                
                // Update the message in the UI
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === tempAssistantId ? finalMessage : msg
                  )
                );
                
                return finalMessage;
              } else if (data.content) {
                // Append chunk to response
                responseText += data.content;

                // Update the UI with the latest response
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === tempAssistantId 
                      ? { ...msg, content: responseText }
                      : msg
                  )
                );
              } else if (data.error) {
                throw new Error(data.error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing stream:', error);
        setError('Failed to process response');
        
        // Update the message with error state
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempAssistantId 
              ? { ...msg, status: 'error' as const }
              : msg
          )
        );
        
        return null;
      }
      
      // If we get here, return the current assistant message or null
      return assistantMessage;
    } catch (err) {
      console.error('Error sending message:', err);

      // Update the message in the UI with an error state
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );

      setError('Failed to send message');
      return null;
    }
  }, [currentSession, session]);

  // Load initial data when the component mounts
  useEffect(() => {
    let isSubscribed = true;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/chat/sessions');
        
        if (!response.ok) {
          throw new Error('Failed to load chat sessions');
        }
        
        const data = await response.json();
        if (isSubscribed) {
          setSessions(data.sessions);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        if (isSubscribed) {
          setError('Failed to load initial data');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return {
    sessions,
    currentSession,
    messages,
    isLoading,
    error,
    loadSessions,
    loadMessages,
    createSession,
    deleteSession,
    sendMessage,
    setCurrentSession,
  };
};
