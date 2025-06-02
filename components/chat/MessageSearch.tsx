'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  chatSessionId: string;
  chatSession: {
    id: string;
    title: string;
  };
  createdAt: string;
}

export function MessageSearch({
  isOpen = false,
  onClose,
  currentSessionId,
  onResultClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId?: string;
  onResultClick: (sessionId: string, messageId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const params = new URLSearchParams({
          q: query,
          ...(currentSessionId && { sessionId: currentSessionId }),
        });

        const response = await fetch(`/api/chat/search?${params.toString()}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, currentSessionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-20">
      <div 
        className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center">
          <Search className="h-5 w-5 text-muted-foreground mr-2" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search messages..."
            className="flex-1 border-0 shadow-none focus-visible:ring-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {isSearching ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <div 
                  key={result.id}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors',
                    result.role === 'USER' ? 'bg-muted/50' : 'bg-background'
                  )}
                  onClick={() => {
                    onResultClick(result.chatSessionId, result.id);
                    onClose();
                  }}
                >
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span className="font-medium">
                      {result.chatSession.title || 'Untitled Chat'}
                    </span>
                    <span>
                      {format(new Date(result.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-sm">
                    {result.content}
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="text-center p-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" />
              <p>No messages found for "{query}"</p>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p>Search for messages in {currentSessionId ? 'this chat' : 'all chats'}</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
