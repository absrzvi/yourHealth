'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Message, 
  ChatSession, 
  ChatContextType, 
  MessageRole, 
  MessageStatus, 
  MessageType,
  LLMProvider
} from '@/types/chat.types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_SESSION: ChatSession = {
  id: 'default-session',
  title: 'New Chat',
  createdAt: new Date(),
  updatedAt: new Date(),
  messageCount: 0,
};

export function ChatProvider({ 
  children,
  defaultProvider = 'ollama' 
}: { 
  children: ReactNode;
  defaultProvider?: LLMProvider;
}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<LLMProvider>(defaultProvider);

  // Load sessions and messages from localStorage on mount
  useEffect(() => {
    loadSessions();
    // Set a default session if none exists
    if (!currentSession && sessions.length === 0) {
      createSession();
    }
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession?.id]);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      const savedSessions = localStorage.getItem('chatSessions');
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        
        // Set current session if not already set
        if (!currentSession && parsedSessions.length > 0) {
          setCurrentSession(parsedSessions[0]);
        }
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load chat sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      const savedMessages = localStorage.getItem(`chatMessages_${sessionId}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(async (title: string = 'New Chat'): Promise<ChatSession | null> => {
    try {
      setIsLoading(true);
      const newSession: ChatSession = {
        id: uuidv4(),
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
        userId: session?.user?.email || undefined,
      };

      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setCurrentSession(newSession);
      setMessages([]);
      
      // Save to localStorage
      localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
      
      return newSession;
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create chat session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessions, session]);

  const deleteSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      
      // If we're deleting the current session, switch to another one
      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSessions[0] || null);
      }
      
      setSessions(updatedSessions);
      
      // Remove messages for this session
      localStorage.removeItem(`chatMessages_${sessionId}`);
      
      // Update sessions in localStorage
      localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
      
      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete chat session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessions, currentSession]);

  const switchSession = useCallback(async (sessionId: string): Promise<void> => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  }, [sessions]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (currentSession) {
      localStorage.removeItem(`chatMessages_${currentSession.id}`);
    }
  }, [currentSession]);

  const saveMessages = useCallback((sessionId: string, messagesToSave: Message[]) => {
    try {
      localStorage.setItem(`chatMessages_${sessionId}`, JSON.stringify(messagesToSave));
    } catch (err) {
      console.error('Error saving messages:', err);
    }
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!content.trim() || !currentSession) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'USER',
      type: 'text',
      content,
      timestamp: new Date(),
      status: 'sent',
      chatSessionId: currentSession.id,
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'ASSISTANT',
      type: 'text',
      content: '',
      timestamp: new Date(),
      status: 'sending',
      chatSessionId: currentSession.id,
      llmProvider: currentProvider,
    };

    // Update UI optimistically
    setMessages(prev => {
      const updated = [...prev, userMessage, assistantMessage];
      saveMessages(currentSession.id, updated);
      return updated;
    });

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          chatSessionId: currentSession.id,
          provider: currentProvider,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let responseText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));
              if (data.content) {
                responseText += data.content;
                
                // Update the assistant's message with the latest content
                setMessages(prev => {
                  const updated = [...prev];
                  const assistantMsg = updated.find(m => m.id === assistantMessage.id);
                  if (assistantMsg) {
                    assistantMsg.content = responseText;
                    assistantMsg.status = 'streaming';
                  }
                  return updated;
                });
              }
            }
          }
        }
      }

      // Final update to mark as delivered
      setMessages(prev => {
        const updated = [...prev];
        const assistantMsg = updated.find(m => m.id === assistantMessage.id);
        if (assistantMsg) {
          assistantMsg.status = 'delivered';
          assistantMsg.timestamp = new Date();
        }
        saveMessages(currentSession.id, updated);
        return updated;
      });

      // Update session's last updated time
      setSessions(prev => {
        const updated = prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, updatedAt: new Date() } 
            : s
        );
        localStorage.setItem('chatSessions', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      
      // Update message status to error
      setMessages(prev => {
        const updated = [...prev];
        const assistantMsg = updated.find(m => m.id === assistantMessage.id);
        if (assistantMsg) {
          assistantMsg.status = 'error';
          assistantMsg.content = 'Failed to get response. Please try again.';
        }
        saveMessages(currentSession.id, updated);
        return updated;
      });
    } finally {
      setIsSending(false);
    }
  }, [currentSession, currentProvider]);

  const setProvider = useCallback((provider: LLMProvider) => {
    setCurrentProvider(provider);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sessions,
        currentSession,
        isLoading,
        isSending,
        error,
        sendMessage,
        createSession,
        deleteSession,
        switchSession,
        clearMessages,
        setProvider,
        currentProvider,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
