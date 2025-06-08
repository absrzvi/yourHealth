'use client';

import React from 'react';
import { useAICoachStore } from '@/stores/aiCoachStore';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const ChatHistorySidebar = () => {
  const {
    sessions,
    currentSessionId,
    createNewSession,
    switchSession,
    deleteSession,
  } = useAICoachStore();

  const handleCreateNewChat = () => {
    createNewSession();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">Recent Chats</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCreateNewChat}
          className="h-8 w-8"
          aria-label="New chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {Object.values(sessions).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No chat history yet</p>
            <Button
              variant="link"
              onClick={handleCreateNewChat}
              className="mt-2"
            >
              Start a new chat
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {Object.values(sessions)
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group flex items-center justify-between p-2 rounded-md hover:bg-accent',
                    currentSessionId === session.id ? 'bg-accent' : ''
                  )}
                >
                  <button
                    onClick={() => switchSession(session.id)}
                    className="flex-1 text-left text-sm truncate"
                  >
                    {session.title || 'New Chat'}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this chat?')) {
                        deleteSession(session.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistorySidebar;

// Helper function to handle class names
function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
