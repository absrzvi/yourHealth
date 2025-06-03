'use client';

import React, { useState, useRef } from 'react';
import { useChatSessions } from '@/hooks/useChatSessions';
import { 
  Clock, 
  Edit2, 
  Trash2, 
  Plus, 
  MessageSquare, 
  X,
  Check 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatSessionManagerProps {
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  currentSessionId?: string;
}

export const ChatSessionManager: React.FC<ChatSessionManagerProps> = ({
  onSessionSelect,
  onNewSession,
  currentSessionId
}) => {
  const { 
    sessions, 
    isLoading, 
    error, 
    updateSessionTitle, 
    deleteSession 
  } = useChatSessions();
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Start editing a session title
  const handleStartEdit = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditTitle(currentTitle);
    
    // Focus the input after a short delay to allow rendering
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Save edited session title
  const handleSaveEdit = async () => {
    if (editingSessionId && editTitle.trim()) {
      await updateSessionTitle(editingSessionId, editTitle.trim());
      setEditingSessionId(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingSessionId(null);
  };

  // Delete a session
  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      await deleteSession(sessionId);
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Chat History</h3>
          <button 
            onClick={onNewSession}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
            aria-label="New chat"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-neutral-500">Loading sessions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Chat History</h3>
          <button 
            onClick={onNewSession}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
            aria-label="New chat"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center text-red-500">
          Failed to load chat history
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Chat History</h3>
        <button 
          onClick={onNewSession}
          className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          aria-label="New chat"
        >
          <Plus size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center text-neutral-500 mt-4">
            <MessageSquare className="mx-auto mb-2 opacity-50" size={24} />
            <p>No chat sessions yet</p>
            <button
              onClick={onNewSession}
              className="mt-2 text-primary hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map(session => (
              <li 
                key={session.id} 
                className={`rounded-lg p-3 cursor-pointer transition-colors ${
                  currentSessionId === session.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-neutral-100'
                }`}
              >
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Chat session title"
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-green-600 hover:bg-green-50 rounded-full"
                      aria-label="Save"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                      aria-label="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="flex items-start"
                    onClick={() => onSessionSelect(session.id)}
                  >
                    <div className="flex-1 truncate">
                      <p className="font-medium truncate">
                        {session.title || 'Untitled Chat'}
                      </p>
                      <div className="flex items-center text-xs text-neutral-500 mt-1">
                        <Clock size={12} className="mr-1" />
                        <span>
                          {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                      {session.messages && session.messages.length > 0 && (
                        <p className="text-xs text-neutral-500 mt-1 truncate">
                          {session.messages[0].content.length > 60
                            ? `${session.messages[0].content.substring(0, 60)}...`
                            : session.messages[0].content}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(session.id, session.title || 'Untitled Chat');
                        }}
                        className="p-1 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 rounded-full"
                        aria-label="Rename"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="p-1 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-full ml-1"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatSessionManager;
