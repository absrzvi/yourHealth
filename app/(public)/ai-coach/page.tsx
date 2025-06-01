'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

// Dynamically import the chat interface with no SSR
const ChatInterface = dynamic(
  () => import('@/components/ai-coach/EnhancedChatInterface').then(mod => mod.default),
  { 
    ssr: false, 
    loading: () => <div className="h-[600px] bg-neutral-100 rounded-lg animate-pulse" />
  }
);

export default function AiCoachPage() {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Aria - Your AI Health Coach
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ask me anything about your health data, and I'll help you understand it better.
              </p>
            </div>

            <div className="bg-neutral-100 rounded-2xl border border-border overflow-hidden shadow-lg">
              <div className="p-4 border-b border-border bg-gradient-to-r from-primary to-accent flex items-center">
                <div className="flex-1 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-white/80 mr-2" />
                  <div className="w-3 h-3 rounded-full bg-white/60 mr-2" />
                  <div className="w-3 h-3 rounded-full bg-white/40" />
                </div>
                <div className="ml-auto text-xs font-medium text-white">Aria v1.0</div>
              </div>
              
              <div className="h-[600px] overflow-hidden">
                <ChatInterface 
                  isOpen={true}
                  onClose={() => {}}
                  className="border-0"
                />
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p className="inline-flex items-center justify-center">
                <Sparkles className="w-4 h-4 mr-2 text-accent" />
                Try asking: &quot;Show me my recent health trends&quot; or &quot;Create a dashboard for my sleep data&quot;
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
