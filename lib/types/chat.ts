// Types for chat functionality

export type MessageRole = 'USER' | 'ASSISTANT';
export type MessageType = 'text' | 'chart' | 'dashboard' | 'error';
export type MessageStatus = 'sending' | 'sent' | 'error' | 'streaming';

export interface ChatMessage {
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

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  loadSessions: () => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
  createSession: (name: string) => Promise<ChatSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string, options?: { 
    type?: MessageType; 
    llmProvider?: string; 
    llmModel?: string; 
  }) => Promise<ChatMessage | null>;
  setCurrentSession: (session: ChatSession | null) => void;
}
