'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, MenuIcon, ArrowLeft } from 'lucide-react';
import EnhancedChatInterface from './EnhancedChatInterface';
import ChatSessionManager from './ChatSessionManager';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useStreamChat } from '@/hooks/useStreamChat';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  
  // Get chat sessions and stream chat hook
  const { 
    currentSessionId, 
    currentSession,
    createSession, 
    switchSession 
  } = useChatSessions();
  
  const { 
    setActiveChatSession, 
    clearMessages, 
    chatSessionId 
  } = useStreamChat(currentSessionId || undefined);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Sync chat session between hooks
  useEffect(() => {
    if (currentSessionId && currentSessionId !== chatSessionId) {
      setActiveChatSession(currentSessionId);
    }
  }, [currentSessionId, chatSessionId, setActiveChatSession]);
  
  // Handle creating a new chat session
  const handleNewSession = useCallback(async () => {
    const newSession = await createSession();
    if (newSession) {
      setActiveChatSession(newSession.id);
      clearMessages();
      setShowSessions(false);
    }
  }, [createSession, setActiveChatSession, clearMessages]);
  
  // Handle selecting an existing session
  const handleSelectSession = useCallback((sessionId: string) => {
    switchSession(sessionId);
    setActiveChatSession(sessionId);
    setShowSessions(false);
  }, [switchSession, setActiveChatSession]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-96 h-[600px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-lg shadow-2xl flex flex-col bg-white"
          >
            {showSessions ? (
              <div className="flex flex-col h-full">
                <div className="border-b p-3 flex items-center justify-between">
                  <button
                    onClick={() => setShowSessions(false)}
                    className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                    aria-label="Back to chat"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="font-semibold">Chat History</h2>
                  <div className="w-10"></div> {/* Spacer for alignment */}
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatSessionManager
                    onSessionSelect={handleSelectSession}
                    onNewSession={handleNewSession}
                    currentSessionId={currentSessionId || undefined}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="border-b p-3 flex items-center justify-between">
                  <button
                    onClick={() => setShowSessions(true)}
                    className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                    aria-label="Show chat history"
                  >
                    <MenuIcon size={18} />
                  </button>
                  <h2 className="font-semibold">
                    {currentSession?.title || 'AI Coach Chat'}
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                    aria-label="Close chat"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <EnhancedChatInterface 
                    isOpen={isOpen} 
                    onClose={() => setIsOpen(false)} 
                    chatSessionId={currentSessionId || undefined}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Open chat"
          >
            <MessageSquare size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;
