'use client';

import React, { useState, useRef } from 'react';
import { useAICoachStore } from '@/stores/aiCoachStore';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';

interface ChatInputProps {
  isLoading?: boolean;
  onFileUpload?: (files: FileList) => void;
}

export default function ChatInput({ isLoading = false, onFileUpload }: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useAICoachStore();

  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedFiles.length === 0) return;
    
    // Handle file uploads if any selected
    if (selectedFiles.length > 0 && onFileUpload) {
      const fileList = new DataTransfer();
      selectedFiles.forEach(file => fileList.items.add(file));
      onFileUpload(fileList.files);
    }
    
    // Send text message if provided
    if (inputText.trim()) {
      await sendMessage(inputText);
      setInputText('');
    }
    
    // Clear selected files after sending
    setSelectedFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border-t bg-white">
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedFiles.map((file, index) => (
            <div 
              key={`${file.name}-${index}`} 
              className="flex items-center bg-gray-100 rounded-md px-2 py-1 text-xs"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-1 p-0.5 hover:bg-gray-200 rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute left-3 text-gray-400 hover:text-gray-600"
          aria-label="Attach files"
        >
          <Paperclip size={18} />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.csv,.xlsx,.txt"
        />
        
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message AI Health Coach..."
          className="w-full pl-10 pr-20 py-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={isLoading || (!inputText.trim() && selectedFiles.length === 0)}
          className={`
            absolute right-2 p-2 rounded-full transition-colors
            ${isLoading || (!inputText.trim() && selectedFiles.length === 0)
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'}
          `}
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
