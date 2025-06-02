'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the 3D scene with SSR disabled
const Scene = dynamic(
  () => import('@/components/3d/Scene').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    )
  }
);

export default function DemoHomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Add a small delay before showing content to ensure the 3D scene is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowContent(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="text-lg font-medium">Loading experience...</p>
          </div>
        </div>
      )}
      
      {/* Content Overlay */}
      <div 
        className={`relative z-10 min-h-screen transition-opacity duration-1000 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="container mx-auto flex min-h-screen flex-col justify-center px-4 py-16">
          <div className="max-w-2xl">
            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              Unlock Your <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Genetic Potential</span>
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              Discover personalized health insights powered by AI and advanced genetic analysis.
              Take control of your wellbeing with data-driven recommendations.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6 text-lg font-semibold hover:opacity-90"
              >
                <Link href="/signup">Start Your Journey</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white/20 bg-white/5 px-8 py-6 text-lg font-semibold backdrop-blur-sm hover:bg-white/10"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            
            <p className="mt-6 text-sm text-gray-400">
              Join thousands of users already optimizing their health with our platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
