import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type MessageRole = 'USER' | 'ASSISTANT';
type MessageType = 'text' | 'chart' | 'dashboard' | 'error';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string | Record<string, any>;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  chatSessionId?: string;
  llmProvider?: string | null;
  llmModel?: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
}

export const useChatContext = () => {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error('Failed to create chat session');
      }
      
      const { session: newSession } = await response.json();
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]);
      return newSession;
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
      const response = await fetch(`/api/chat/sessions?id=${sessionId}`, {
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

  // Send a new message
  const sendMessage = useCallback(async (content: string, options: {
    type?: MessageType;
    llmProvider?: string;
    llmModel?: string;
  } = {}) => {
    if (!currentSession || !session) return null;
    
    const tempId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempId,
      role: 'USER',
      type: options.type || 'text',
      content,
      timestamp: new Date(),
      status: 'sending',
      chatSessionId: currentSession.id,
    };

    // Add the user message to the UI immediately
    setMessages(prev => [...prev, userMessage]);

    try {
      // Save the user message to the database
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

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { message: savedMessage } = await response.json();

      // Update the message in the UI with the saved version
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId 
            ? { ...savedMessage, status: 'sent' as const }
            : msg
        )
      );

      return savedMessage;
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
    loadSessions();
  }, [loadSessions]);

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
