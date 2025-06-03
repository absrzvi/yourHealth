'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-start mb-4 ${className}`}>
      <div className="flex items-center gap-1 px-4 py-3 bg-neutral-200 text-black rounded-lg max-w-[120px]">
        <motion.div
          className="w-2 h-2 bg-neutral-500 rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            repeatType: "loop",
            ease: "easeInOut",
            times: [0, 0.5, 1],
            delay: 0
          }}
        />
        <motion.div
          className="w-2 h-2 bg-neutral-500 rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            repeatType: "loop", 
            ease: "easeInOut",
            times: [0, 0.5, 1],
            delay: 0.15
          }}
        />
        <motion.div
          className="w-2 h-2 bg-neutral-500 rounded-full"
          animate={{ y: [0, -5, 0] }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            repeatType: "loop", 
            ease: "easeInOut",
            times: [0, 0.5, 1],
            delay: 0.3
          }}
        />
      </div>
    </div>
  );
};

export default TypingIndicator;
