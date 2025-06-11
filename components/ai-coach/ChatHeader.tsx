import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Menu, X, MessageSquare, Plus, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatHeaderProps {
  title: string;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onNewChat: () => void;
  onSearch: (query: string) => void;
  onSettingsClick: () => void;
  onBackClick?: () => void;
  className?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  statusMessage?: string;
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onNewChat,
  onSearch,
  onSettingsClick,
  onBackClick,
  className = '',
  showBackButton = false,
  showSearch = false,
  searchQuery = '',
  onSearchQueryChange,
  avatarUrl = '',
  status = 'online',
  statusMessage = '',
}) => {
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header 
      className={cn(
        'sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur-sm',
        'transition-all duration-200',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onBackClick}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onToggleMobileSidebar}
              aria-label={isMobileSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isMobileSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}

          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={title} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {title.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-background',
                  statusColors[status]
                )}
                title={statusMessage || status}
              />
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-sm font-medium line-clamp-1">{title}</h1>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {statusMessage || status.charAt(0).toUpperCase() + status.slice(1)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNewChat}
                  aria-label="New chat"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New chat</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onSearchQueryChange?.('');
                    setIsSearchFocused(!isSearchFocused);
                  }}
                  aria-label={isSearchFocused ? 'Close search' : 'Search messages'}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSearchFocused ? 'Close search' : 'Search messages'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSettingsClick}
                  aria-label="Chat settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Chat settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <AnimatePresence>
        {isSearchFocused && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSearch} className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search messages..."
                  className="w-full pl-8 pr-10"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange?.(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-8 w-8"
                    onClick={() => {
                      onSearchQueryChange?.('');
                      onSearch('');
                    }}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
