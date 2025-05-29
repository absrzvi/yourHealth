import React, { useRef, useEffect } from 'react';
import AriaMessage from '../aria/AriaMessage';
import UserMessage from './UserMessage';

// Define message type for chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasAttachment?: boolean;
  attachmentName?: string;
  isTyping?: boolean;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  isTyping?: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  messages, 
  isTyping = false 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Group messages by date for visual separation
  const groupMessagesByDate = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    let currentGroup: ChatMessage[] = [];
    
    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-8">
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-6">
          <div className="flex justify-center">
            <div className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
              {group.date === new Date().toLocaleDateString() 
                ? 'Today' 
                : group.date}
            </div>
          </div>
          
          {group.messages.map((message) => (
            <div key={message.id}>
              {message.role === 'assistant' ? (
                <AriaMessage 
                  content={message.content} 
                  timestamp={new Date(message.timestamp)}
                  isTyping={message.isTyping}
                />
              ) : (
                <UserMessage 
                  content={message.content} 
                  timestamp={new Date(message.timestamp)}
                  hasAttachment={message.hasAttachment}
                  attachmentName={message.attachmentName}
                />
              )}
            </div>
          ))}
        </div>
      ))}
      
      {/* Typing indicator for Aria */}
      {isTyping && (
        <AriaMessage 
          content="" 
          timestamp={new Date()} 
          isTyping={true}
        />
      )}
      
      {/* Empty div for auto-scrolling */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatHistory;
