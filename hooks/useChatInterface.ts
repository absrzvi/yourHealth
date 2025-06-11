import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Message, MessageStatus, MessageType } from '@/types/chat.types';

export const useChatInterface = () => {
  const {
    messages,
    currentSession,
    isSending,
    sendMessage,
    createSession,
    deleteSession,
    switchSession,
    clearMessages,
    setProvider,
    currentProvider,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSendMessage = useCallback(async () => {
    const message = inputValue.trim();
    if (!message || isSending) return;

    await sendMessage(message);
    setInputValue('');
    
    // Focus the input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [inputValue, isSending, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleNewChat = useCallback(async () => {
    await createSession();
    setIsSidebarOpen(false);
  }, [createSession]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
  }, [deleteSession]);

  const handleSwitchSession = useCallback(async (sessionId: string) => {
    await switchSession(sessionId);
    setIsSidebarOpen(false);
  }, [switchSession]);

  const handleClearMessages = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all messages in this chat?')) {
      clearMessages();
    }
  }, [clearMessages]);

  const handleProviderChange = useCallback((provider: string) => {
    setProvider(provider as any);
  }, [setProvider]);

  const formatMessageContent = useCallback((message: Message) => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    
    try {
      return JSON.stringify(message.content, null, 2);
    } catch (e) {
      console.error('Error formatting message content:', e);
      return 'Error displaying message';
    }
  }, []);

  const getMessageStatus = useCallback((status?: MessageStatus) => {
    if (!status) return null;
    
    const statusMap: Record<MessageStatus, string> = {
      sending: 'Sending...',
      sent: 'Sent',
      delivered: 'Delivered',
      read: 'Read',
      error: 'Error',
      streaming: 'Typing...',
    };
    
    return statusMap[status];
  }, []);

  return {
    // State
    messages,
    currentSession,
    isSending,
    inputValue,
    isSidebarOpen,
    isSearchOpen,
    currentProvider,
    
    // Refs
    messagesEndRef,
    inputRef,
    
    // Handlers
    setInputValue,
    handleSendMessage,
    handleKeyDown,
    handleNewChat,
    handleDeleteSession,
    handleSwitchSession,
    handleClearMessages,
    handleProviderChange,
    setIsSidebarOpen,
    setIsSearchOpen,
    
    // Utilities
    formatMessageContent,
    getMessageStatus,
  };
};
