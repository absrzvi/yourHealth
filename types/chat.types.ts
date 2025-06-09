// types/chat.types.ts

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'streaming';
export type MessageRole = 'USER' | 'ASSISTANT';
export type MessageType = 'text' | 'chart' | 'dashboard' | 'error';
export type LLMProvider = 'ollama' | 'openai' | 'pending' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string | Record<string, any>;
  timestamp: Date;
  status?: MessageStatus;
  chatSessionId?: string;
  llmProvider?: LLMProvider;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  userId?: string;
}

export interface ChatVisualizationData {
  type: 'chart' | 'dashboard';
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'radar' | 'scatter';
    title?: string;
    description?: string;
  };
  data: any;
  options?: Record<string, any>;
}

export interface ChatAPIRequest {
  message: string;
  chatSessionId?: string;
  context?: {
    userId?: string;
    userPreferences?: Record<string, any>;
    chatHistory?: Message[];
  };
  stream?: boolean;
  provider?: LLMProvider;
}

export interface ChatAPIResponse {
  success: boolean;
  message?: string;
  data?: {
    response: string;
    sessionId?: string;
    messages?: Message[];
    visualization?: ChatVisualizationData;
  };
  error?: string;
}

export interface ChatProviderProps {
  children: React.ReactNode;
  defaultProvider?: LLMProvider;
}

export interface ChatContextType {
  messages: Message[];
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  createSession: (title?: string) => Promise<ChatSession | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  switchSession: (sessionId: string) => Promise<void>;
  clearMessages: () => void;
  setProvider: (provider: LLMProvider) => void;
  currentProvider: LLMProvider;
}
