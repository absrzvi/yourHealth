import { create, StateCreator, UseBoundStore } from 'zustand';
import type { StoreApi, Mutate } from 'zustand/vanilla';


import { persist, devtools, createJSONStorage } from 'zustand/middleware';

// Types
type AIModel = 'local' | 'gpt-4' | 'claude-2' | 'gpt-3.5-turbo';

interface ChatMessage {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT'; // Matches MessageRole from chat.types.ts
  timestamp: Date;
  model?: AIModel;
  isStreaming?: boolean;
  type: 'text' | 'chart' | 'dashboard' | 'error';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'streaming';
  llmProvider?: 'ollama' | 'openai' | 'pending' | 'error';
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: AIModel;
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  role: string;
  isAvailable: boolean;
  model: AIModel;
  avatar?: string;
}

export interface AICoachState {
  // State
  initialized: boolean; // Track if store has been initialized
  _isCreatingSession?: boolean; // Internal flag to prevent duplicate session creation
  currentSessionId: string | null;
  sessions: Record<string, ChatSession>;
  agents: AIAgent[];
  activeAgentId: string | null;
  isSidebarOpen: boolean;
  isAgentsPanelOpen: boolean;
  isMobileView: boolean;
  
  // Actions
  createNewSession: (model?: AIModel) => void;
  sendMessage: (content: string) => Promise<void>;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  setActiveAgent: (agentId: string) => void;
  toggleSidebar: () => void;
  toggleAgentsPanel: () => void;
  setMobileView: (isMobile: boolean) => void;
}

// Define the shape of the persisted state
export interface PersistedAICoachState {
  currentSessionId: string | null;
  sessions: Record<string, ChatSession>;
  activeAgentId: string | null;
  isMobileView: boolean;
}

// Initial state
const initialState: Omit<AICoachState, 
  'createNewSession' | 'sendMessage' | 'switchSession' | 
  'deleteSession' | 'updateSessionTitle' | 'setActiveAgent' |
  'toggleSidebar' | 'toggleAgentsPanel' | 'setMobileView'
> = {
  initialized: false,
  _isCreatingSession: false,
  currentSessionId: null,
  sessions: {},
  agents: [
    {
      id: 'aria',
      name: 'Aria',
      description: 'Your AI Health Coach',
      role: 'Health Coach',
      isAvailable: true,
      model: 'gpt-4',
      avatar: '/avatars/aria.png',
    },
    {
      id: 'doc',
      name: 'Dr. Smith',
      description: 'Medical Expert',
      role: 'Medical Doctor',
      isAvailable: true,
      model: 'gpt-4',
      avatar: '/avatars/doctor.png',
    },
  ],
  activeAgentId: 'aria',
  isSidebarOpen: true,
  isAgentsPanelOpen: false,
  isMobileView: false,
};

// Store is now initialized directly in the aiCoachStoreInitializer

const aiCoachStoreInitializer: StateCreator<AICoachState, [], []> = (set, get) => ({
  ...initialState,
  initialized: true, // Directly set initialized to true
        
  createNewSession: (model: AIModel = 'gpt-3.5-turbo') => {
    try {
      const state = get(); 
      const { currentSessionId, sessions } = state;
            
      // Don't create a new session if we already have one and it's not empty
      if (currentSessionId && sessions[currentSessionId] && sessions[currentSessionId].messages.length > 0) {
        return; // Prevent re-init if we have messages
      }

      if (state._isCreatingSession) {
        return;
      }
      set({ _isCreatingSession: true });

      try {
        const sessionId = `session-${Date.now()}`;
        const newSession: ChatSession = {
          id: sessionId,
          title: 'New Chat',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          model: model,
        };

        set((prevState) => ({
          ...prevState,
          currentSessionId: sessionId,
          sessions: { ...prevState.sessions, [sessionId]: newSession },
          _isCreatingSession: false,
        }));
      } catch (innerError) {
        console.error('Error creating session (inner):', innerError);
        set({ _isCreatingSession: false }); // Reset flag on inner error
      }
    } catch (error) {
      console.error('Error creating session (outer):', error);
      set({ _isCreatingSession: false }); // Reset flag on outer error
    }
  },
        
  sendMessage: async (content: string) => {
    const currentSessionId = get().currentSessionId;
    if (!currentSessionId) {
      console.error('No active session to send message to.');
      return; 
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content,
      role: 'USER',
      timestamp: new Date(),
      type: 'text',
      status: 'sent'
    };

    set((prevState) => {
      const updatedSession = prevState.sessions[currentSessionId!];
      if (!updatedSession) return prevState; 
      return {
        ...prevState,
        sessions: {
          ...prevState.sessions,
          [currentSessionId!]: {
            ...updatedSession,
            messages: [...updatedSession.messages, userMessage],
            updatedAt: new Date(),
          },
        },
      };
    });

    // Add a typing indicator message
    const typingMessageId = `typing-${Date.now()}`;
    set((prevState) => {
      const updatedSession = prevState.sessions[currentSessionId!];
      if (!updatedSession) return prevState;
      
      const typingMessage: ChatMessage = {
        id: typingMessageId,
        content: '',
        role: 'ASSISTANT',
        timestamp: new Date(),
        isStreaming: true,
        type: 'text',
        status: 'streaming',
        llmProvider: 'pending'
      };
      
      return {
        ...prevState,
        sessions: {
          ...prevState.sessions,
          [currentSessionId!]: {
            ...updatedSession,
            messages: [...updatedSession.messages, typingMessage],
            updatedAt: new Date(),
          },
        },
      };
    });

    try {
      // Call the new AI chat API endpoint [REH]
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and split by SSE format
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.error) {
                console.error('Stream error:', data.error);
                continue;
              }

              if (data.text) {
                // Update the typing message with accumulated text
                accumulatedResponse += data.text;
                
                // Update the typing message with the accumulated response
                set((prevState) => {
                  const updatedSession = prevState.sessions[currentSessionId!];
                  if (!updatedSession) return prevState;
                  
                  // Find and update the typing message
                  const updatedMessages = updatedSession.messages.map(msg => 
                    msg.id === typingMessageId 
                      ? { ...msg, content: accumulatedResponse }
                      : msg
                  );
                  
                  return {
                    ...prevState,
                    sessions: {
                      ...prevState.sessions,
                      [currentSessionId!]: {
                        ...updatedSession,
                        messages: updatedMessages,
                      },
                    },
                  };
                });
              }
              
              // If this is the final chunk, replace typing indicator with final message
              if (data.isComplete) {
                const finalText = data.fullText || accumulatedResponse;
                
                // Create the final assistant response
                const assistantResponse: ChatMessage = {
                  id: `msg-${Date.now() + 1}`,
                  content: finalText,
                  role: 'ASSISTANT',
                  timestamp: new Date(),
                  model: 'local',
                  type: 'text',
                  status: 'sent',
                  llmProvider: data.provider || 'ollama'
                };
                
                // Replace typing indicator with final message
                set((prevState) => {
                  const updatedSession = prevState.sessions[currentSessionId!];
                  if (!updatedSession) return prevState;
                  
                  const finalMessages = updatedSession.messages
                    .filter(msg => msg.id !== typingMessageId)
                    .concat(assistantResponse);
                  
                  return {
                    ...prevState,
                    sessions: {
                      ...prevState.sessions,
                      [currentSessionId!]: {
                        ...updatedSession,
                        messages: finalMessages,
                        updatedAt: new Date(),
                      },
                    },
                  };
                });
                break;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message or receiving AI response:', error);
      // Clean up the typing indicator on error
      set((prevState) => {
        const updatedSession = prevState.sessions[currentSessionId!];
        if (!updatedSession) return prevState;
        
        // Add an error message instead
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          content: 'Sorry, there was an error processing your message. Please try again.',
          role: 'ASSISTANT',
          timestamp: new Date(),
          type: 'error',
          status: 'error',
          llmProvider: 'error'
        };
        
        const updatedMessages = updatedSession.messages
          .filter(msg => msg.id !== typingMessageId)
          .concat(errorMessage);
          
        return {
          ...prevState,
          sessions: {
            ...prevState.sessions,
            [currentSessionId!]: {
              ...updatedSession,
              messages: updatedMessages,
              updatedAt: new Date(),
            },
          },
        };
      });
    }
  },
        
  switchSession: (sessionId: string) => {
    set({ currentSessionId: sessionId });
  },
        
  deleteSession: (sessionId: string) => {
    set((prevState) => {
      const newSessions = { ...prevState.sessions };
      delete newSessions[sessionId];
            
      let newCurrentSessionId = prevState.currentSessionId;
      if (newCurrentSessionId === sessionId) {
        const remainingSessionIds = Object.keys(newSessions);
        newCurrentSessionId = remainingSessionIds.length > 0 ? remainingSessionIds[0] : null;
      }
            
      return {
        sessions: newSessions,
        currentSessionId: newCurrentSessionId,
      };
    });
  },
        
  updateSessionTitle: (sessionId: string, title: string) => {
    set((prevState) => {
      const sessionToUpdate = prevState.sessions[sessionId];
      if (!sessionToUpdate) return prevState;
            
      return {
        sessions: {
          ...prevState.sessions,
          [sessionId]: {
            ...sessionToUpdate,
            title,
            updatedAt: new Date(),
          },
        },
      };
    });
  },
        
  setActiveAgent: (agentId: string) => {
    set({ activeAgentId: agentId });
  },
        
  toggleSidebar: () => {
    set((prevState) => ({ isSidebarOpen: !prevState.isSidebarOpen }));
  },
        
  toggleMobileView: () => {
    set((prevState) => ({ isMobileView: !prevState.isMobileView }));
  },

  toggleAgentsPanel: () => {
    set((prevState) => ({ isAgentsPanelOpen: !prevState.isAgentsPanelOpen }));
  },
  
  setMobileView: (isMobile: boolean) => {
    set({ isMobileView: isMobile });
  }
});

export const useAICoachStore: UseBoundStore<
  Mutate<
    StoreApi<AICoachState>,
    [
      ['zustand/devtools', never], // Outermost middleware
      ['zustand/persist', PersistedAICoachState]  // Persist middleware, type for external API
    ]
  >
> = create( // No generic on create()
  devtools(
    persist( // No generic on persist()
      aiCoachStoreInitializer, // Use the extracted initializer
      { // Persist options
        name: 'ai-coach-storage',
        version: 1, // Add version to help with migrations
        skipHydration: true, // Skip automatic hydration to prevent loops
        storage: createJSONStorage<PersistedAICoachState>(() => localStorage),
        partialize: (state: AICoachState): PersistedAICoachState => ({
          currentSessionId: state.currentSessionId,
          sessions: state.sessions,
          activeAgentId: state.activeAgentId,
          isMobileView: state.isMobileView,
        }),
        onRehydrateStorage: () => {
          console.log('Zustand: Hydration process started.');
          return (rehydratedState?: AICoachState, error?: unknown) => {
            if (error) {
              console.error('Zustand: An error occurred during rehydration:', error);
            } else {
              console.log('Zustand: Hydration finished successfully.');
            }
          };
        }
      }
    ),
    { // Devtools options
      name: 'AICoachStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
