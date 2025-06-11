import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Settings, 
  X, 
  Search, 
  ChevronDown, 
  ChevronRight,
  History,
  Star,
  FileText,
  HelpCircle,
  LogOut,
  User,
  Moon,
  Sun,
  Palette,
  Bell,
  BellOff,
  MessageSquarePlus,
  MessageSquareDashed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChatSession, Message } from '@/types/chat.types';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearConversations: () => void;
  className?: string;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  onSignOut?: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'account';

const SIDEBAR_WIDTH = 288;

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  sessions = [],
  currentSession,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onClearConversations,
  className = '',
  user = {},
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({
    recent: true,
    favorites: true,
  });

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSection = useCallback((section: string) => {
    setIsExpanded(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleDeleteSession = useCallback((e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDeleteSession(sessionId);
    }
  }, [onDeleteSession]);

  const handleClearConversations = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
      onClearConversations();
    }
  }, [onClearConversations]);

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -SIDEBAR_WIDTH }}
        animate={{ x: isOpen ? 0 : -SIDEBAR_WIDTH }}
        exit={{ x: -SIDEBAR_WIDTH }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={cn(
          'fixed top-0 left-0 bottom-0 z-30 w-[288px]',
          'bg-background border-r border-border/50',
          'flex flex-col',
          'shadow-lg',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Chats</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onNewChat}
                  aria-label="New chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:hidden"
                  onClick={onClose}
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search conversations..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Main content */}
          <ScrollArea className="flex-1 px-2 py-2">
            {isSettingsOpen ? (
              <div className="space-y-6 p-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Settings</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSettingsOpen(false)}
                    className="h-8 text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Close
                  </Button>
                </div>

                <div className="space-y-1">
                  <Button
                    variant={activeTab === 'general' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('general')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    General
                  </Button>
                  <Button
                    variant={activeTab === 'appearance' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('appearance')}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Appearance
                  </Button>
                  <Button
                    variant={activeTab === 'notifications' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('notifications')}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                  <Button
                    variant={activeTab === 'account' ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('account')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Account
                  </Button>
                </div>

                <div className="space-y-4 pt-4">
                  {activeTab === 'general' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="theme-mode">Dark Mode</Label>
                        <div className="flex items-center space-x-2">
                          <Sun className="h-4 w-4" />
                          <Switch id="theme-mode" />
                          <Moon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notifications">Enable Notifications</Label>
                        <Switch id="notifications" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="message-preview">Message Preview</Label>
                        <Switch id="message-preview" defaultChecked />
                      </div>
                    </div>
                  )}

                  {activeTab === 'appearance' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Default', 'Dark', 'Light', 'System'].map((theme) => (
                            <Button
                              key={theme}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              {theme}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Density</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Compact', 'Normal', 'Comfortable'].map((density) => (
                            <Button
                              key={density}
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              {density}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="message-notifications">New Messages</Label>
                          <Switch id="message-notifications" defaultChecked />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get notified when you receive new messages
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="mention-notifications">Mentions</Label>
                          <Switch id="mention-notifications" defaultChecked />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Get notified when someone mentions you
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sound-notifications">Sound</Label>
                          <Switch id="sound-notifications" defaultChecked />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Play sound for new notifications
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'account' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name || 'User'}</p>
                          <p className="text-xs text-muted-foreground">{user.email || ''}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline" className="w-full">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Help & Support
                      </Button>
                      {onSignOut && (
                        <Button 
                          variant="outline" 
                          className="w-full text-destructive"
                          onClick={onSignOut}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={onNewChat}
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>

                <div className="space-y-1">
                  <button
                    className="flex items-center w-full px-2 py-1.5 text-sm font-medium rounded-md hover:bg-accent"
                    onClick={() => toggleSection('recent')}
                  >
                    {isExpanded.recent ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    Recent Chats
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded.recent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 pl-6">
                          {filteredSessions.length > 0 ? (
                            filteredSessions.map((session) => (
                              <div
                                key={session.id}
                                className={cn(
                                  'flex items-center justify-between group px-2 py-1.5 rounded-md',
                                  'text-sm hover:bg-accent',
                                  currentSession?.id === session.id && 'bg-accent font-medium'
                                )}
                                onClick={() => onSelectSession(session.id)}
                              >
                                <div className="flex items-center min-w-0">
                                  <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate">{session.title}</span>
                                </div>
                                <button
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1"
                                  onClick={(e) => handleDeleteSession(e, session.id)}
                                  aria-label="Delete conversation"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No conversations found
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1">
                  <button
                    className="flex items-center w-full px-2 py-1.5 text-sm font-medium rounded-md hover:bg-accent"
                    onClick={() => toggleSection('favorites')}
                  >
                    {isExpanded.favorites ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    Favorites
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded.favorites && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 py-1 text-sm text-muted-foreground">
                          No favorite chats
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleClearConversations}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Chats
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.email || 'user@example.com'}
                  </p>
                </div>
              </div>
              {onSignOut && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onSignOut}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
