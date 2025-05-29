import React from 'react';
import { motion } from 'framer-motion';
import AriaAvatar from './AriaAvatar';
import AriaTypingIndicator from './AriaTypingIndicator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AriaMessageProps {
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
}

const AriaMessage: React.FC<AriaMessageProps> = ({ 
  content, 
  timestamp, 
  isTyping = false,
  isStreaming = false
}) => {
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(timestamp);

  return (
    <motion.div 
      className="flex items-start gap-3 max-w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-shrink-0 mt-1">
        <AriaAvatar size="sm" isActive={isTyping} />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center mb-1">
          <span className="font-medium text-sm">Aria</span>
          <span className="ml-2 text-xs text-gray-500">{formattedTime}</span>
        </div>
        
        <div 
          className="p-4 rounded-lg rounded-tl-none"
          style={{ background: 'var(--bg-aria-message)' }}
        >
          {isTyping ? (
            <AriaTypingIndicator visible={true} />
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AriaMessage;
