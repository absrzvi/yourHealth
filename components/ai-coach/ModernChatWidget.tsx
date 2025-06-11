'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minimize2, Maximize2, Bot } from 'lucide-react';
import ModernChatInterface from './ModernChatInterface';
import { cn } from '@/lib/utils';

interface ModernChatWidgetProps {
  /**
   * Whether the chat widget is open by default
   * @default false
   */
  defaultOpen?: boolean;
  
  /**
   * Position of the chat widget on the screen
   * @default 'bottom-right'
   */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /**
   * Whether to show debug information
   * @default false
   */
  showDebug?: boolean;
  
  /**
   * Custom class name for the widget container
   */
  className?: string;
  
  /**
   * Initial session ID to load
   */
  initialSessionId?: string;
  
  /**
   * Whether to show the welcome screen by default
   * @default true
   */
  showWelcome?: boolean;
  
  /**
   * Callback when the widget is closed
   */
  onClose?: () => void;
  
  /**
   * Whether the widget is in mobile view
   * @default false
   */
  isMobile?: boolean;
  
  /**
   * Whether to show the minimize button
   * @default true
   */
  showMinimize?: boolean;
  
  /**
   * Whether to show the header
   * @default true
   */
  showHeader?: boolean;
}

/**
 * A modern, feature-rich chat widget that can be embedded anywhere in the application.
 * Supports both floating and inline modes, with animations and responsive design.
 */
const ModernChatWidget: React.FC<ModernChatWidgetProps> = ({
  defaultOpen = false,
  position = 'bottom-right',
  showDebug = false,
  className = '',
  initialSessionId,
  showWelcome = true,
  onClose,
  isMobile = false,
  showMinimize = true,
  showHeader = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

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
      scale: 0.95,
      transition: { 
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 300,
        mass: 0.5
      }
    },
    minimized: {
      height: '60px',
      width: '60px',
      borderRadius: '9999px',
      transition: { 
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    maximized: {
      height: isMobile ? 'calc(100vh - 3rem)' : 'min(90vh, 800px)',
      width: isMobile ? 'calc(100vw - 2rem)' : '400px',
      borderRadius: '1rem',
      transition: { 
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    }
  };

  // Button animation variants
  const buttonVariants = {
    initial: { 
      scale: 1,
      opacity: 1
    },
    hover: { 
      scale: 1.05,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 20
      }
    },
    notification: {
      scale: [1, 1.1, 1],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut"
      }
    }
  };

  // Effect to handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        if (isOpen && isMinimized) {
          setIsMinimized(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMinimized]);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasNewMessage(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    if (onClose) onClose();
  }, [onClose]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(!isMinimized);
  }, [isMinimized]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Don't render on server-side to prevent hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <div 
      ref={widgetRef}
      className={cn(
        'fixed z-[100]',
        positionClasses[position],
        'shadow-2xl',
        'transition-all duration-300 ease-in-out',
        {
          'w-[60px] h-[60px]': !isOpen || isMinimized,
          'w-full max-w-[400px]': isOpen && !isMinimized && !isMobile,
          'w-[calc(100vw-2rem)]': isOpen && isMobile,
        },
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-window"
            variants={chatVariants}
            initial="hidden"
            animate={isMinimized ? "minimized" : "maximized"}
            exit="hidden"
            className={cn(
              'relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden',
              'border border-gray-200 dark:border-gray-700',
              'flex flex-col',
              'shadow-xl',
              {
                'rounded-full': isMinimized,
                'w-full h-full': true,
              }
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {isMinimized ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white cursor-pointer">
                <motion.div
                  animate={hasNewMessage ? "notification" : "initial"}
                  variants={buttonVariants}
                  className="relative"
                >
                  <Bot className="w-7 h-7" />
                  {hasNewMessage && (
                    <motion.span 
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              </div>
            ) : (
              <>
                {showHeader && (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      <h3 className="font-semibold">AI Health Coach</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {showMinimize && (
                        <button
                          onClick={handleMinimize}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          aria-label="Minimize chat"
                        >
                          <Minimize2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        aria-label="Close chat"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden">
                  <ModernChatInterface
                    initialSessionId={initialSessionId}
                    showWelcome={showWelcome}
                    isMobile={isMobile}
                    onClose={handleClose}
                  />
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chat-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', damping: 20, stiffness: 300 }}
            className="relative"
          >
            <motion.button
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              animate={hasNewMessage ? "notification" : "initial"}
              onClick={handleOpen}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center',
                'bg-gradient-to-br from-blue-600 to-purple-600 text-white',
                'shadow-lg hover:shadow-xl',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                'transition-all duration-200',
                'relative',
                'border-2 border-white dark:border-gray-800',
                'transform hover:scale-105 active:scale-95'
              )}
              aria-label="Open chat"
            >
              <MessageSquare className="w-6 h-6" />
              {hasNewMessage && (
                <motion.span 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernChatWidget;
