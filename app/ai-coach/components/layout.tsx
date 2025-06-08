'use client';

import { useEffect, useRef } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAICoachStore } from '@/stores/aiCoachStore';
import { cn } from '@/lib/utils';

interface AICoachLayoutProps {
  children: React.ReactNode;
  chatHistory: React.ReactNode;
  chatInterface: React.ReactNode;
  aiAgents: React.ReactNode;
}

export function AICoachLayout({
  children,
  chatHistory,
  chatInterface,
  aiAgents,
}: AICoachLayoutProps) {
  const {
    isSidebarOpen,
    isAgentsPanelOpen,
    isMobileView,
    setMobileView,
    toggleSidebar,
    toggleAgentsPanel,
  } = useAICoachStore();
  
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const layoutRef = useRef<HTMLDivElement>(null);

  // Update mobile view state based on screen size
  useEffect(() => {
    if (isDesktop) {
      setMobileView(false);
    } else {
      setMobileView(true);
    }
  }, [isDesktop, setMobileView]);

  // Close panels when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isDesktop && layoutRef.current && !layoutRef.current.contains(event.target as Node)) {
        // Close both panels when clicking outside on mobile
        if (isSidebarOpen) toggleSidebar();
        if (isAgentsPanelOpen) toggleAgentsPanel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDesktop, isSidebarOpen, isAgentsPanelOpen, toggleSidebar, toggleAgentsPanel]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="flex flex-1 overflow-hidden" ref={layoutRef}>
        {/* Left Sidebar - Chat History */}
        <aside
          className={cn(
            'w-64 border-r bg-card transition-all duration-300 overflow-hidden shrink-0',
            isMobileView
              ? 'absolute left-0 top-0 h-full z-50 shadow-lg transform transition-transform duration-300 ease-in-out'
              : 'relative',
            isMobileView && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'
          )}
        >
          {chatHistory}
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {chatInterface}
          {children}
        </main>

        {/* Right Sidebar - AI Agents */}
        <aside
          className={cn(
            'w-72 border-l bg-card transition-all duration-300 overflow-hidden shrink-0',
            isMobileView
              ? 'absolute right-0 top-0 h-full z-50 shadow-lg transform transition-transform duration-300 ease-in-out'
              : 'relative',
            isMobileView && !isAgentsPanelOpen ? 'translate-x-full' : 'translate-x-0'
          )}
        >
          {aiAgents}
        </aside>
      </div>
      <MobileToggleButtons />
    </div>
  );
}

// Mobile Toggle Buttons component
function MobileToggleButtons() {
  const { isSidebarOpen, isAgentsPanelOpen, toggleSidebar, toggleAgentsPanel } = useAICoachStore();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) return null;

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      <button
        onClick={toggleSidebar}
        className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label={isSidebarOpen ? 'Close chat history' : 'Open chat history'}
      >
        {isSidebarOpen ? '✕' : '💬'}
      </button>
      <button
        onClick={toggleAgentsPanel}
        className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label={isAgentsPanelOpen ? 'Close AI agents' : 'Open AI agents'}
      >
        {isAgentsPanelOpen ? '✕' : '🤖'}
      </button>
    </div>
  );
}
