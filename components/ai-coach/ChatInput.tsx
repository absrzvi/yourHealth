import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  isSending: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onFileUpload?: (file: File) => void;
  onVoiceInput?: () => void;
  onNewChat?: () => void;
}

const MAX_ROWS = 8;

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  isSending,
  placeholder = 'Type your message...',
  className = '',
  disabled = false,
  onFileUpload,
  onVoiceInput,
  onNewChat,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    onChange(textarea.value);
    
    // Auto-resize textarea
    textarea.style.height = 'auto';
    const newRows = Math.min(
      Math.max(1, Math.ceil((textarea.scrollHeight - 16) / 24)),
      MAX_ROWS
    );
    setRows(newRows);
    textarea.style.height = 'auto';
    textarea.style.height = `${newRows * 24}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSending) {
        onSend();
        // Reset rows after sending
        setRows(1);
      }
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onFileUpload) {
      onFileUpload(e.target.files[0]);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !onFileUpload) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          onFileUpload(file);
          e.preventDefault();
        }
      }
    }
  };

  // Focus the input when it's enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className={cn(
      'w-full border-t bg-background/95 backdrop-blur-sm',
      isFocused ? 'border-primary/50' : 'border-border/50',
      className
    )}>
      <div className="container max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled || isSending}
              rows={1}
              className={cn(
                'min-h-[40px] max-h-[200px] resize-none pr-12',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'border-0 shadow-none',
                'text-foreground placeholder:text-muted-foreground/60',
                'transition-all duration-200',
                disabled ? 'opacity-70 cursor-not-allowed' : ''
              )}
              style={{
                height: `${rows * 24}px`,
                overflowY: rows >= MAX_ROWS ? 'auto' : 'hidden',
              }}
            />
            
            <AnimatePresence>
              {value && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={() => {
                    onChange('');
                    setRows(1);
                    textareaRef.current?.focus();
                  }}
                  className={cn(
                    'absolute right-2 bottom-2 p-1 rounded-full',
                    'text-muted-foreground hover:text-foreground',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                  )}
                  disabled={disabled || isSending}
                  aria-label="Clear message"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-1">
            {onFileUpload && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled || isSending}
                      aria-label="Attach file"
                    >
                      <Paperclip className="h-4 w-4" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={disabled || isSending}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Attach file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {onVoiceInput && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={onVoiceInput}
                      disabled={disabled || isSending}
                      aria-label="Voice input"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Voice input</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Button
              type="button"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={onSend}
              disabled={!value.trim() || isSending || disabled}
              aria-label="Send message"
            >
              {isSending ? (
                <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            
            {onNewChat && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={onNewChat}
                      disabled={disabled || isSending}
                      aria-label="New chat"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>New chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
