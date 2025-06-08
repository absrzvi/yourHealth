'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, Bot, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import ChatHistorySidebar from './components/ChatHistorySidebar';
import AIAgentsSidebar from './components/AIAgentsSidebar';
import ChatInput from './components/ChatInput';
import { useAICoachInitializer } from '@/hooks/useAICoachInitializer';

// Error boundary for the chat interface
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ChatInterface error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            We&apos;re having trouble loading the chat interface. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dynamically import the chat interface with no SSR
const DynamicChatInterface = dynamic(
  () => import('@/components/ai-coach/ChatInterface'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }
);

export default function AiCoachPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  
  // Initialize the AI Coach store safely
  const { initialized } = useAICoachInitializer();
  
  // Check if screen is mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowLeftSidebar(false);
        setShowRightSidebar(false);
      } else {
        setShowLeftSidebar(true);
        setShowRightSidebar(true);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/ai-coach');
    }
  }, [status, router]);

  // Show loading state while checking auth status
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading your AI Coach session...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, we'll be redirected by the useEffect
  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="w-full px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                className="mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Bot className="h-7 w-7 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">AI Health Coach</h1>
          </div>
          
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowRightSidebar(!showRightSidebar)}
            >
              <Bot className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      {/* Main Content with Three-Column Layout */}
      <div className="flex flex-1 h-[calc(100vh-64px)]">
        {/* Left Sidebar - Chat History */}
        {(!isMobile || showLeftSidebar) && (
          <div 
            className={`${isMobile ? 'fixed inset-y-0 left-0 z-40 bg-white w-64 shadow-lg' : 'w-64 border-r'}
              h-full overflow-y-auto p-4`}
          >
            <ChatHistorySidebar />
          </div>
        )}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
            }>
              {initialized ? (
                <>
                  <div className="flex-1 overflow-hidden">
                    <DynamicChatInterface />
                  </div>
                  <ChatInput />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-muted-foreground">Initializing chat...</span>
                </div>
              )}
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Right Sidebar - AI Agents */}
        {(!isMobile || showRightSidebar) && (
          <div 
            className={`${isMobile ? 'fixed inset-y-0 right-0 z-40 bg-white w-64 shadow-lg' : 'w-64 border-l'}
              h-full overflow-y-auto p-4`}
          >
            <AIAgentsSidebar />
          </div>
        )}
      </div>
      
      <Toaster />
    </div>
  );
}
