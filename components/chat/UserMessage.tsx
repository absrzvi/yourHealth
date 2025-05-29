import React from 'react';
import { motion } from 'framer-motion';

interface UserMessageProps {
  content: string;
  timestamp: Date;
  hasAttachment?: boolean;
  attachmentName?: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ 
  content, 
  timestamp, 
  hasAttachment = false,
  attachmentName
}) => {
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(timestamp);

  return (
    <motion.div 
      className="flex items-start gap-3 max-w-full justify-end"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 overflow-hidden max-w-[85%]">
        <div className="flex items-center mb-1 justify-end">
          <span className="text-xs text-gray-500">{formattedTime}</span>
          <span className="ml-2 font-medium text-sm">You</span>
        </div>
        
        <div className="p-4 rounded-lg rounded-tr-none bg-gray-100 text-gray-800">
          <p className="whitespace-pre-wrap break-words">{content}</p>
          
          {hasAttachment && (
            <div className="mt-2 p-2 bg-white rounded border border-gray-200 flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <span className="ml-2 text-sm truncate">{attachmentName || 'Attached file'}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0 mt-1">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
          U
        </div>
      </div>
    </motion.div>
  );
};

export default UserMessage;
