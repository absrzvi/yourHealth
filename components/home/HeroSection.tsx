'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function HeroSection() {
  // State for image loading
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState('/images/pic1a.jpeg');

  // Fallback to a different image if the first one fails to load
  const handleImageError = () => {
    console.log('Image load error, falling back to placeholder');
    setImageError(true);
    setImageSrc('https://images.unsplash.com/photo-1560252829-9c3b55f81088?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
  };

  // Image paths
  const images = {
    // Main family image (using your custom image with .jpeg extension)
    family: imageError ? 'https://images.unsplash.com/photo-1560252829-9c3b55f81088?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' : imageSrc,
    // Woman climbing a cliff with ocean view (top-down angle) - using local image
    climbing: '/images/pic2.jpg',
    // Couple running together outside - using local image
    running: '/images/pic3.jpg'
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-100 py-8 lg:py-12">
      {/* Main Grid Layout */}
      <div className="w-full h-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[85vh] max-w-7xl mx-auto">
          {/* Left Column - Main Image (Family) */}
          <div className="lg:col-span-7 h-full relative rounded-2xl overflow-hidden shadow-2xl">
            {/* Image with error handling and fallback */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={images.family}
                alt="Happy family enjoying outdoor activities"
                fill
                className="object-cover w-full h-full"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                onError={handleImageError}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
            {/* Hero Content Overlay */}
            <div className="absolute inset-0 flex items-center z-10">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl lg:max-w-3xl">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Your Personalized Health Journey Starts Here
                  </h1>
                  <p className="text-lg sm:text-xl text-white/95 mb-8 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    Discover how your unique biology can guide you to better health with our advanced DNA and microbiome analysis.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/get-started" className="w-full sm:w-auto">
                      <Button 
                        className="btn btn-primary btn-lg w-full sm:w-auto"
                      >
                        Get Started
                      </Button>
                    </Link>
                    <Link href="/how-it-works" className="w-full sm:w-auto">
                      <Button 
                        variant="outline"
                        className="btn btn-outline btn-lg w-full sm:w-auto text-white border-white hover:bg-white/10 hover:border-white/80"
                      >
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Two Smaller Images */}
          <div className="lg:col-span-4 h-full flex flex-col gap-4">
            {/* Top Image (Woman Climbing) */}
            <div className="relative h-1/2 rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
              <Image
                src={images.climbing}
                alt="Woman climbing a cliff with ocean view"
                fill
                className="object-cover object-top transition-transform duration-700 hover:scale-105"
                priority
                sizes="(max-width: 1024px) 100vw, 34vw"
              />
              <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                <h2 className="text-2xl font-bold font-montserrat text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Push Your Limits</h2>
                <p className="text-sm text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Personalized fitness plans based on your DNA</p>
              </div>
            </div>

            {/* Bottom Image (Couple Running) */}
            <div className="relative h-1/2 rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
              <Image
                src={images.running}
                alt="Couple running together outside"
                fill
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
                priority
                sizes="(max-width: 1024px) 100vw, 34vw"
              />
              <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                <h2 className="text-2xl font-bold font-montserrat text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Achieve Together</h2>
                <p className="text-sm text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Shared goals for better health outcomes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <svg 
            className="w-6 h-6 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
