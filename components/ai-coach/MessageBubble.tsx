import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { Message, MessageStatus, MessageType } from '@/types/chat.types';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, Loader2, Clock } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  className?: string;
  onRetry?: (messageId: string) => void;
}

const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ message, isLast, className, onRetry }, ref) => {
    const isUser = message.role === 'USER';
    const isError = message.status === 'error';
    const isLoading = message.status === 'sending' || message.status === 'streaming';

    const getStatusIcon = () => {
      if (isError) {
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      }
      
      if (isLoading) {
        return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />;
      }
      
      return <Check className="w-3 h-3 text-muted-foreground" />;
    };

    const getBubbleClass = () => {
      const baseClass = 'rounded-2xl px-4 py-2.5 text-sm max-w-[85%] md:max-w-[75%] relative';
      
      if (isUser) {
        return cn(
          baseClass,
          'bg-primary text-primary-foreground rounded-tr-none',
          isError ? 'bg-red-500/90' : 'bg-primary/90',
          className
        );
      }
      
      return cn(
        baseClass,
        'bg-muted rounded-tl-none',
        className
      );
    };

    const getTimestampClass = () => {
      return cn(
        'flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap',
        isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
        isError && 'text-red-400'
      );
    };

    const formatTimestamp = (date: Date | string) => {
      try {
        // If date is a string, try to parse it
        const dateObj = typeof date === 'string' 
          ? new Date(date.includes('T') ? date : date + 'T00:00:00') 
          : date;
        
        // Check if the date is valid
        if (!isValid(dateObj)) {
          console.warn('Invalid date:', date);
          return <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> --:--</span>;
        }
        
        return format(dateObj, 'h:mm a');
      } catch (error) {
        console.error('Error formatting date:', error);
        return <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> --:--</span>;
      }
    };

    const handleRetry = () => {
      if (isError && onRetry) {
        onRetry(message.id);
      }
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex w-full',
          isUser ? 'justify-end' : 'justify-start',
          isLast ? 'mb-4' : 'mb-2',
          className
        )}
      >
        <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
          <div className={getBubbleClass()}>
            {message.type === 'text' ? (
              <div className="whitespace-pre-wrap break-words">
                {typeof message.content === 'string' 
                  ? message.content 
                  : JSON.stringify(message.content, null, 2)}
              </div>
            ) : (
              <div className="bg-background rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-2">
                  [Unsupported message type: {message.type}]
                </p>
                <pre className="text-xs overflow-auto max-h-60">
                  {JSON.stringify(message.content, null, 2)}
                </pre>
              </div>
            )}
            
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-5 right-0 flex items-center gap-1"
                >
                  <span className="text-xs text-muted-foreground">
                    {message.status === 'streaming' ? 'Typing...' : 'Sending...'}
                  </span>
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className={getTimestampClass()}>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 opacity-70" />
              {formatTimestamp(message.timestamp)}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="whitespace-nowrap">
                {message.status === 'error' ? 'Failed' : 
                 message.status === 'sending' ? 'Sending' : 
                 message.status === 'streaming' ? 'Typing...' : 'Sent'}
              </span>
            </div>
            
            {isError && onRetry && (
              <button 
                onClick={handleRetry}
                className="ml-2 text-xs text-red-400 hover:text-red-300 underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
