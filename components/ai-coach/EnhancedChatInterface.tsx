'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, MessageSquare, Plus, Trash2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { VisualizationMessage } from './VisualizationMessage';
import { useVisualization } from '@/hooks/useVisualization';
import { useChatContext, type ChatMessage } from '@/hooks/useChatContext';

interface EnhancedChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// Export the component as a named export for better tree-shaking
export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const { data: session } = useSession();
  const {
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
  } = useChatContext();

  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    type: visualizationType, 
    data: visualizationData, 
    isLoading: isGeneratingVisualization, 
    error: visualizationError, 
    generateVisualization,
    clearVisualization 
  } = useVisualization();

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isGeneratingVisualization]);

  // Load sessions when component mounts
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  // Load messages when current session changes
  useEffect(() => {
    if (currentSession?.id) {
      loadMessages(currentSession.id);
    } else if (sessions.length > 0) {
      setCurrentSession(sessions[0]);
    } else {
      // No sessions, create a new one
      handleNewSession();
    }
  }, [currentSession?.id, sessions, loadMessages, setCurrentSession]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSendMessage = useCallback(async () => {
    const messageText = inputText.trim();
    if (!messageText || isLoading) return;

    // Clear input
    setInputText('');

    // First try to generate a visualization
    const isVisualization = await generateVisualization(messageText);
    
    if (isVisualization) {
      // The visualization will be added by the effect hook
      return;
    }

    // Send the message
    await sendMessage(messageText, {
      type: 'text',
      llmProvider: 'openai',
      llmModel: 'gpt-4',
    });
  }, [inputText, isLoading, generateVisualization, sendMessage]);

  const handleNewSession = useCallback(async () => {
    const newSession = await createSession('New Chat');
    if (newSession) {
      setCurrentSession(newSession);
      setNewSessionTitle('');
      setIsCreatingSession(false);
    }
  }, [createSession, setCurrentSession]);

  const handleDeleteSession = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      await deleteSession(sessionId);
    }
  }, [deleteSession]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (!isOpen) return null;

  return (
    <div className={cn("flex h-full bg-white text-foreground rounded-lg shadow-xl overflow-hidden", className)}>
      {/* Sidebar */}
      <div 
        className={cn(
          'w-64 border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full absolute z-10 h-full',
          'md:relative md:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg">Chat Sessions</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {isCreatingSession ? (
            <div className="p-2">
              <Input
                type="text"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="Session title"
                className="mb-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createSession(newSessionTitle || 'New Chat');
                    setIsCreatingSession(false);
                  } else if (e.key === 'Escape') {
                    setIsCreatingSession(false);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => {
                    createSession(newSessionTitle || 'New Chat');
                    setIsCreatingSession(false);
                  }}
                >
                  Create
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsCreatingSession(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 mb-4"
              onClick={() => setIsCreatingSession(true)}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          )}
          
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100',
                  currentSession?.id === session.id && 'bg-blue-50 border border-blue-200'
                )}
                onClick={() => setCurrentSession(session)}
              >
                <span className="truncate flex-1">
                  {session.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-semibold">
              {currentSession?.title || 'New Chat'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 bg-white">
          <div className="space-y-6">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                <p>Ask me anything about your health data, and I'll help you understand it better.</p>
                <div className="mt-4 text-sm text-muted-foreground space-y-2">
                  <p>Try asking:</p>
                  <ul className="space-y-1">
                    <li>• "Show me my heart rate trends"</li>
                    <li>• "Create a dashboard of my sleep data"</li>
                    <li>• "How's my activity level this week?"</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'USER' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-3xl rounded-lg px-4 py-2',
                      message.role === 'USER'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.type === 'text' ? (
                      <div className="prose max-w-none">
                        {typeof message.content === 'string' ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <p className="whitespace-pre-wrap">
                            {JSON.stringify(message.content, null, 2)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <VisualizationMessage
                        type={message.type}
                        data={message.content}
                        isLoading={message.status === 'sending'}
                        error={
                          message.status === 'error' ? 'Failed to load content' : undefined
                        }
                      />
                    )}
                    <div
                      className={cn(
                        'text-xs mt-1',
                        message.role === 'USER' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center justify-center p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="relative">
            <div className="flex items-end gap-2">
              <div className="flex-1 min-h-[42px] bg-muted rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none placeholder:text-muted-foreground px-3 py-2 resize-none"
                  rows={1}
                  style={{ minHeight: '42px', maxHeight: '200px' }}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                size="icon"
                className="h-10 w-10 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Ask about your health data, request visualizations, or get insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Keep default export for backward compatibility
export default EnhancedChatInterface;
