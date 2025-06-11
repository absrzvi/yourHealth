'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useChat } from '@/contexts/ChatContext';
import { useChatInterface } from '@/hooks/useChatInterface';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ChatSidebar } from './ChatSidebar';
import { WelcomeScreen } from './WelcomeScreen';
import { cn } from '@/lib/utils';
import { Loader2, MessageSquare, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ModernChatInterfaceProps {
  className?: string;
  initialSessionId?: string;
  showWelcome?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const ModernChatInterface: React.FC<ModernChatInterfaceProps> = ({
  className = '',
  initialSessionId,
  showWelcome = true,
  onClose,
  isMobile = false,
}) => {
  const { data: session } = useSession();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(showWelcome);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use our chat context and hooks
  const {
    messages,
    currentSession,
    isSending,
    sendMessage,
    createSession,
    deleteSession,
    switchSession,
    clearMessages,
    sessions,
    currentProvider,
    setProvider,
  } = useChat();

  // Initialize with initial session ID if provided
  useEffect(() => {
    if (initialSessionId) {
      switchSession(initialSessionId);
    }
  }, [initialSessionId, switchSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []); 

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Hide welcome screen when user sends first message
    if (showWelcomeScreen) {
      setShowWelcomeScreen(false);
    }
    
    await sendMessage(content);
  }, [sendMessage, showWelcomeScreen]);

  const handleNewChat = useCallback(async () => {
    await createSession();
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
    setShowWelcomeScreen(true);
  }, [createSession, isMobile]);

  const handleSelectSession = useCallback(async (sessionId: string) => {
    await switchSession(sessionId);
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
    setShowWelcomeScreen(false);
  }, [switchSession, isMobile]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    // If we deleted the current session, create a new one
    if (currentSession?.id === sessionId) {
      await handleNewChat();
    }
  }, [currentSession?.id, deleteSession, handleNewChat]);

  const handleClearConversations = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
      // Clear all sessions and create a new one
      for (const session of sessions) {
        await deleteSession(session.id);
      }
      await handleNewChat();
    }
  }, [deleteSession, handleNewChat, sessions]);

  const handleQuickAction = useCallback((prompt: string) => {
    setShowWelcomeScreen(false);
    handleSendMessage(prompt);
  }, [handleSendMessage]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'flex flex-col h-full bg-background overflow-hidden',
        'rounded-lg border border-border shadow-sm',
        className
      )}
    >
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        sessions={sessions}
        currentSession={currentSession}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearConversations={handleClearConversations}
        className={cn(
          'md:block',
          isMobile && 'fixed inset-0 z-40',
          !isMobileSidebarOpen && 'hidden'
        )}
        user={{
          name: session?.user?.name || 'User',
          email: session?.user?.email || '',
          avatar: session?.user?.image || '',
        }}
        onSignOut={() => {
          // Handle sign out
          if (onClose) onClose();
        }}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <ChatHeader
          title={currentSession?.title || 'New Chat'}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onNewChat={handleNewChat}
          onSearch={(query) => {
            console.log('Searching for:', query);
            // Implement search functionality
          }}
          onSettingsClick={() => {
            // Open settings
            console.log('Open settings');
          }}
          showBackButton={false}
          className="border-b border-border/50"
          avatarUrl="/ai-avatar.png"
          status="online"
          statusMessage="AI is ready to help"
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {showWelcomeScreen ? (
            <WelcomeScreen onQuickAction={handleQuickAction} />
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">No messages yet</h3>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isLast={index === messages.length - 1}
                      onRetry={() => {
                        if (message.role === 'USER') {
                          handleSendMessage(message.content as string);
                        }
                      }}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </AnimatePresence>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto w-full p-4">
            <ChatInput
              value=""
              onChange={() => {}}
              onSend={handleSendMessage}
              isSending={isSending}
              placeholder="Type your message..."
              disabled={isSending}
              onFileUpload={(file) => {
                console.log('File uploaded:', file);
                // Handle file upload
              }}
              onVoiceInput={() => {
                // Handle voice input
                console.log('Voice input clicked');
              }}
              onNewChat={handleNewChat}
            />
            <div className="text-xs text-center text-muted-foreground mt-2">
              AI may produce inaccurate information. Check important info.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernChatInterface;
