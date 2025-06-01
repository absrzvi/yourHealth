'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import './chat-styles.css';
import { VisualizationMessage } from './VisualizationMessage';
import { useVisualization } from '@/hooks/useVisualization';

type MessageRole = 'USER' | 'ASSISTANT';
type MessageType = 'text' | 'chart' | 'dashboard' | 'error';

interface Message {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string | Record<string, any>;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  chatSessionId?: string;
}

interface EnhancedChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  isOpen,
  onClose,
  className = '',
}) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    type: visualizationType, 
    data: visualizationData, 
    isLoading: isGeneratingVisualization, 
    error: visualizationError, 
    generateVisualization 
  } = useVisualization();

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isGeneratingVisualization]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    const messageText = inputText.trim();
    if (!messageText || isLoading) return;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      type: 'text',
      content: messageText,
      timestamp: new Date(),
      status: 'sending',
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // First try to generate a visualization
      await generateVisualization(messageText);
      
      // Update message status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as const } 
            : msg
        )
      );
      
    } catch (error) {
      console.error('Error generating visualization:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'ASSISTANT',
        type: 'error',
        content: {
          error: 'Failed to generate visualization. Please try again.'
        },
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle visualization generation completion
  useEffect(() => {
    if (isGeneratingVisualization || !visualizationData) return;

    // Add the generated visualization to the chat
    const visualizationMessage: Message = {
      id: `viz-${Date.now()}`,
      role: 'ASSISTANT',
      type: visualizationType as MessageType,
      content: visualizationData,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, visualizationMessage]);
  }, [isGeneratingVisualization, visualizationData, visualizationType]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`flex flex-col h-full bg-white text-foreground rounded-lg shadow-xl overflow-hidden ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-100">
        <style jsx global>{`
          /* Force remove background and set text color for assistant messages */
          [data-role="ASSISTANT"] * {
            background: transparent !important;
            background-color: transparent !important;
            color: #000000 !important; /* Force black text */
          }
          
          /* Target common background utility classes */
          .bg-gray-800, .bg-gray-700, .bg-gray-600, .bg-opacity-50, .bg-opacity-100 {
            background-color: transparent !important;
          }
          
          /* Target any element with inline background */
          [style*="background"], [style*="background-color"] {
            background: transparent !important;
            background-color: transparent !important;
          }`}
        </style>
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
              data-role={message.role}
              className={`flex flex-col ${
                message.role === 'USER' ? 'items-end' : 'items-start'
              }`}
            >
              <div className={`max-w-3/4 ${message.role === 'USER' ? '' : 'w-full'}`}>
                {message.type === 'text' ? (
                  <div className="whitespace-pre-wrap">
                    {message.role === 'USER' ? (
                      <span className="inline-block bg-primary text-white rounded-lg p-3">
                        {message.content as string}
                      </span>
                    ) : (
                      <div className="bg-transparent text-black">
                        <div className="bg-transparent text-current">
                          {message.content as string}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    <VisualizationMessage
                      type={message.type}
                      data={message.content}
                      isLoading={message.status === 'sending'}
                      error={message.status === 'error' ? 'Failed to load visualization' : undefined}
                    />
                  </div>
                )}
                <p className={`text-xs mt-1 opacity-70 ${
                  message.role === 'USER' ? 'text-right' : 'text-left'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isGeneratingVisualization && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-800">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-h-[42px] bg-neutral-100 rounded-lg border border-gray-200 focus-within:border-primary flex items-center transition-colors">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-foreground placeholder-gray-500 px-3 py-2.5 resize-none"
              rows={1}
              style={{ height: '24px', minHeight: '24px', maxHeight: '120px' }}
              disabled={isLoading || isGeneratingVisualization}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading || isGeneratingVisualization}
            className="h-[42px] w-[42px] flex-shrink-0 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors items-center justify-center flex"
          >
            {isLoading || isGeneratingVisualization ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Ask about your health data, request visualizations, or get insights
        </p>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
