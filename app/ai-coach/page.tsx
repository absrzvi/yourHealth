'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, MessageSquare, Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';

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
            We're having trouble loading the chat interface. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dynamically import the chat interface with no SSR
const ChatInterface = dynamic(
  () => import('@/components/ai-coach/EnhancedChatInterface').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-blue-600" />
          <p className="text-lg font-medium">Loading your AI Health Coach...</p>
        </div>
        <div className="mt-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }
);

export default function AiCoachPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const { toast } = useToast();

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
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Health Coach</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="md:hidden"
          >
            {isChatOpen ? 'Hide Chat' : 'Show Chat'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          }>
            <ChatInterface 
              isOpen={isChatOpen} 
              onClose={() => setIsChatOpen(false)}
              className="h-[calc(100vh-73px)]"
            />
          </Suspense>
        </ErrorBoundary>
      </main>
      
      {/* Floating action button for mobile */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors md:hidden"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}
      
      <Toaster />
    </div>
  );
}
