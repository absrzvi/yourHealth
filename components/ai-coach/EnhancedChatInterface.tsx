'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import './chat-styles.css';
import { useStreamChat, ChatMessage, MessageType } from '@/hooks/useStreamChat';
import TypingIndicator from './TypingIndicator';
import ChartVisualization from './ChartVisualization';
import DashboardVisualization from './DashboardVisualization';
import HealthInsightsVisualization from './HealthInsightsVisualization';

// Using the types from useStreamChat hook

interface EnhancedChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  chatSessionId?: string;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  isOpen,
  onClose,
  className = '',
  chatSessionId,
}) => {
  const { data: session } = useSession();
  const { 
    messages, 
    setMessages, 
    sendMessage, 
    cancelStream, 
    isStreaming, 
    isTyping 
  } = useStreamChat(chatSessionId);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Track visualization generation state
  const [isGeneratingVisualization, setIsGeneratingVisualization] = useState(false);

  // Scroll to bottom when messages change, on typing, or streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, isGeneratingVisualization, isTyping, isStreaming]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Generate visualization from user request
  const generateVisualization = async (message: string): Promise<void> => {
    try {
      setIsGeneratingVisualization(true);
      
      const response = await fetch('/api/visualizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      
      // Process visualization response
      if (result.type === 'chart' || result.type === 'dashboard' || result.type === 'insights') {
        // Create a system message to acknowledge the visualization request
        const systemMessage: ChatMessage = {
          id: Date.now().toString(),
          content: 'I\'ll create a visualization for you based on your request.',
          role: 'SYSTEM',
          type: 'text',
          timestamp: new Date(),
          status: 'sent',
        };
        
        // Create a special message with the visualization data
        const visualizationMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: JSON.stringify(result),
          role: 'ASSISTANT',
          type: 'visualization',
          timestamp: new Date(),
          status: 'sent',
          isVisualization: true,
          visualizationType: result.type as 'chart' | 'dashboard' | 'insights',
        };
        
        // Add both messages to the chat
        setMessages(prev => [...prev, systemMessage, visualizationMessage]);
        return;
      }
      
      // If we received a regular message response instead of visualization data
      throw new Error('No visualization was generated');
    } catch (error) {
      console.error('Visualization generation error:', error);
      throw error; // Re-throw to fall back to regular chat
    } finally {
      setIsGeneratingVisualization(false);
    }
  };

  const handleSendMessage = async () => {
    const messageText = inputText.trim();
    if (!messageText || isStreaming || isGeneratingVisualization) return;

    // Clear input text immediately for better UX
    setInputText('');

    // Add user message to chat immediately for better UX
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'USER',
      type: 'text',
      content: messageText,
      timestamp: new Date(),
      status: 'sent',
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Check if this might be a visualization request
    const visualizationKeywords = [
      'chart', 'graph', 'plot', 'visualization', 'visualize', 'show me', 
      'dashboard', 'trend', 'compare', 'track', 'monitor', 'metric', 
      'cholesterol', 'blood pressure', 'glucose', 'weight', 'sleep', 'exercise'
    ];
    
    const isLikelyVisualizationRequest = visualizationKeywords.some(keyword => 
      messageText.toLowerCase().includes(keyword)
    );

    // First try to generate a visualization if it seems like a visualization request
    if (isLikelyVisualizationRequest) {
      try {
        await generateVisualization(messageText);
        return; // If visualization succeeds, we're done
      } catch (error) {
        console.error('Error generating visualization:', error);
        // If visualization fails, fall back to regular chat message
      }
    }
    
    // Send as regular chat message
    await sendMessage(messageText, chatSessionId);
  };



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message: ChatMessage) => {
    // Handle visualization messages
    if (message.isVisualization && typeof message.content === 'string') {
      try {
        const visualizationData = JSON.parse(message.content);
        return (
          <div key={message.id} className="flex justify-start mb-4 w-full">
            <div className="max-w-full w-full">
              <div className="bg-gray-100 text-gray-800 p-4 rounded-lg border border-gray-300">
                <h3 className="font-bold text-lg mb-2">{visualizationData.data.title || 'Visualization'}</h3>
                {visualizationData.type === 'chart' && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <ChartVisualization data={visualizationData.data} />
                  </div>
                )}
                {visualizationData.type === 'dashboard' && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <DashboardVisualization data={visualizationData.data} />
                  </div>
                )}
                {visualizationData.type === 'insights' && (
                  <div className="bg-white p-2 rounded border border-gray-200">
                    <HealthInsightsVisualization data={visualizationData.data} />
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1 text-left">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        );
      } catch (error) {
        console.error('Error rendering visualization:', error);
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div>
              <div className="bg-red-100 text-red-800 p-3 rounded-lg rounded-tl-none">
                Error rendering visualization
              </div>
              <div className="text-xs text-gray-500 mt-1 text-left">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        );
      }
    }
    
    // Determine message alignment and style based on role
    const isUser = message.role === 'USER';
    const containerClasses = `flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`;
    const messageClasses = `max-w-[80%] p-3 rounded-lg ${isUser
      ? 'bg-blue-600 text-white rounded-tr-none'
      : 'bg-gray-200 text-gray-800 rounded-tl-none'
    }`;

    const formattedTime = formatTimestamp(message.timestamp);

    return (
      <div key={message.id} className={containerClasses}>
        <div>
          <div className={messageClasses}>
            {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
          </div>
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formattedTime}
          </div>
        </div>
      </div>
    );
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
          <div className="space-y-4">
            {messages.map((message) => renderMessage(message))}
            
            {isGeneratingVisualization && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-800">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            )}
            
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 p-3 rounded-lg rounded-tl-none">
                  <TypingIndicator />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
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
              disabled={isStreaming || isGeneratingVisualization}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isStreaming || isGeneratingVisualization}
            className="h-[42px] w-[42px] flex-shrink-0 bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors items-center justify-center flex"
          >
            {isStreaming || isGeneratingVisualization ? (
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
