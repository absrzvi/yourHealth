'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import ChatInterface from './ChatInterface';

interface ChatWidgetProps {
  defaultOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showDebug?: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ 
  defaultOpen = false,
  position = 'bottom-right',
  showDebug = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Position classes based on prop
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  // Animation variants for the chat window
  const chatVariants = {
    hidden: { 
      opacity: 0, 
      y: position.includes('bottom') ? 20 : -20, 
      scale: 0.9,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 300 
      }
    },
    minimized: {
      height: '60px',
      transition: { duration: 0.3 }
    },
    maximized: {
      height: '600px',
      transition: { duration: 0.3 }
    }
  };

  // Button animation variants
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    notification: {
      scale: [1, 1.1, 1],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut"
      }
    }
  };

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setHasNewMessage(false);
    setIsMinimized(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-window"
            variants={chatVariants}
            initial="hidden"
            animate={isMinimized ? "minimized" : "maximized"}
            exit="hidden"
            className="relative"
          >
            <div className={`
              bg-white rounded-xl shadow-2xl overflow-hidden
              ${isMinimized ? 'h-[60px]' : 'h-[600px]'}
              w-[400px] max-w-[calc(100vw-3rem)]
              transition-all duration-300
            `}>
              {/* Custom Header for minimized state */}
              {isMinimized ? (
                <div className="flex items-center justify-between p-4 bg-blue-600 text-white h-full">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={20} />
                    <span className="font-semibold">AI Health Coach</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMinimize}
                      className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors"
                      aria-label="Maximize chat"
                    >
                      <Maximize2 size={16} />
                    </button>
                    <button
                      onClick={handleClose}
                      className="p-1.5 hover:bg-blue-700 rounded-lg transition-colors"
                      aria-label="Close chat"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Custom header overlay */}
                  <div className="absolute top-0 right-0 flex items-center gap-1 p-2 z-10">
                    <button
                      onClick={handleMinimize}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors bg-white/90 backdrop-blur-sm"
                      aria-label="Minimize chat"
                    >
                      <Minimize2 size={16} />
                    </button>
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors bg-white/90 backdrop-blur-sm"
                      aria-label="Close chat"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {/* Chat Interface */}
                  <ChatInterface
                    isOpen={true}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    showDebug={showDebug}
                  />
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {/* Notification dot */}
            {hasNewMessage && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
            
            <motion.button
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              animate={hasNewMessage ? "notification" : "initial"}
              onClick={handleOpen}
              className={`
                bg-blue-600 text-white rounded-full p-4 shadow-lg 
                hover:bg-blue-700 transition-colors
                ${hasNewMessage ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
              `}
              aria-label="Open chat"
            >
              <MessageSquare size={24} />
            </motion.button>
            
            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`
                    absolute ${position.includes('bottom') ? 'bottom-full mb-2' : 'top-full mt-2'}
                    ${position.includes('right') ? 'right-0' : 'left-0'}
                    bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap
                  `}
                >
                  Chat with AI Health Coach
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Keyboard shortcut hint */}
      {!isOpen && (
        <div className={`
          absolute ${position.includes('bottom') ? '-top-8' : '-bottom-8'}
          ${position.includes('right') ? 'right-0' : 'left-0'}
          text-xs text-gray-500 opacity-0 hover:opacity-100 transition-opacity
        `}>
          Press Ctrl+K to open
        </div>
      )}
    </div>
  );
};

export default ChatWidget;