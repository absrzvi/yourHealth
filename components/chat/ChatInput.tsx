import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, X } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onAttachFile: (file: File) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onAttachFile,
  isLoading = false,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };
  
  const handleFileUpload = () => {
    if (selectedFile) {
      onAttachFile(selectedFile);
      setSelectedFile(null);
    }
  };
  
  const handleCancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Selected file preview */}
      {selectedFile && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center text-blue-500">
              <Paperclip size={16} />
            </div>
            <div className="ml-2 overflow-hidden">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleFileUpload}
              className="px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded-full hover:bg-blue-200 transition-colors"
              disabled={isLoading || disabled}
            >
              Upload
            </button>
            <button 
              onClick={handleCancelFile}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Cancel file upload"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      <div className="flex items-end space-x-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
        {/* File attachment button */}
        <button
          onClick={handleFileClick}
          className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
          aria-label="Attach file"
          disabled={isLoading || disabled}
        >
          <Paperclip size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.csv,.txt,.jpg,.jpeg,.png"
        />
        
        {/* Message textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Aria..."
          className="flex-1 resize-none bg-transparent border-0 outline-none focus:ring-0 py-2 px-0 min-h-[40px] max-h-[120px]"
          rows={1}
          disabled={isLoading || disabled}
          aria-label="Type a message to Aria"
        />
        
        {/* Character count */}
        {message.length > 0 && (
          <div className="self-center mr-2 text-xs text-gray-400">
            {message.length}
          </div>
        )}
        
        {/* Voice input (future feature) */}
        <button
          className="p-2 text-gray-400 cursor-not-allowed"
          aria-label="Voice input (coming soon)"
          disabled={true}
        >
          <Mic size={20} />
        </button>
        
        {/* Send button */}
        <button
          onClick={handleSend}
          className={`p-2 rounded-full ${
            message.trim() && !isLoading && !disabled
              ? 'text-white'
              : 'text-gray-400 cursor-not-allowed'
          }`}
          style={{ 
            background: message.trim() && !isLoading && !disabled 
              ? 'var(--aria-gradient)' 
              : 'var(--bg-user-message)'
          }}
          aria-label="Send message"
          disabled={!message.trim() || isLoading || disabled}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
