import React, { useState, useEffect } from 'react';
import ChatHistory, { ChatMessage } from '../chat/ChatHistory';
import ChatInput from '../chat/ChatInput';
import SuggestedQuestions from '../chat/SuggestedQuestions';
import { v4 as uuidv4 } from 'uuid';

interface AriaChatProps {
  className?: string;
}

// Context-aware suggested questions based on user's health data
const SUGGESTED_QUESTIONS = [
  "What does my latest blood work show?",
  "How can I improve my cardiovascular health?",
  "Explain my inflammation markers",
  "What supplements should I consider?",
  "How does my DNA affect my health?"
];

const AriaChat: React.FC<AriaChatProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initial greeting message from Aria
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: "Hello! I'm Aria, your personal health companion. I'm here to help you understand your health data and provide personalized insights. How can I assist you today?",
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    }
  }, []);
  
  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);
    
    try {
      // Simulate API call with timeout (replace with actual API call)
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content,
          provider: 'openai', // Default provider, this could be user-selectable
          model: 'gpt-3.5-turbo' // Default model, this could be user-selectable
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add Aria's response
      const ariaMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.message || "I'm sorry, I couldn't process your request right now.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, ariaMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      
      // Add error message from Aria
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. This could be due to network issues or high demand. Please try again in a moment.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleFileUpload = async (file: File) => {
    // Add file upload message
    const fileMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: `I'm uploading a file: ${file.name}`,
      timestamp: new Date(),
      hasAttachment: true,
      attachmentName: file.name
    };
    
    setMessages(prev => [...prev, fileMessage]);
    setIsTyping(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Send file to API
      const response = await fetch('/api/reports/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add Aria's response about the file
      const ariaMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data.message || `I've received your ${file.name}. I'll analyze it and provide insights shortly.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, ariaMessage]);
    } catch (err) {
      console.error('Error uploading file:', err);
      
      // Add error message from Aria
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `I had trouble processing your ${file.name}. Please make sure it's in a supported format (PDF, CSV, or image for lab results).`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // HIPAA security considerations
  useEffect(() => {
    // Clear messages from localStorage for security
    localStorage.removeItem('chatMessages');
    
    // Session timeout warning after 10 minutes of inactivity
    const inactivityTimeout = 10 * 60 * 1000; // 10 minutes
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Show inactivity warning in chat
        const timeoutMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: "For your security, this session will time out after 5 more minutes of inactivity to protect your health data.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, timeoutMessage]);
      }, inactivityTimeout);
    };
    
    // Reset timeout on user activity
    window.addEventListener('click', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    
    // Initial timeout
    resetTimeout();
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('click', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
    };
  }, []);
  
  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Main chat container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 text-sm">
            {error}
          </div>
        )}
        
        {/* Chat history */}
        <ChatHistory 
          messages={messages} 
          isTyping={isTyping} 
        />
        
        {/* Suggested questions */}
        <SuggestedQuestions 
          questions={SUGGESTED_QUESTIONS} 
          onSelectQuestion={handleSendMessage} 
        />
        
        {/* Chat input */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          onAttachFile={handleFileUpload}
          isLoading={isTyping}
        />
      </div>
    </div>
  );
};

export default AriaChat;
