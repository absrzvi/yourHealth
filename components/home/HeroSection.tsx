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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-100 py-8">
      {/* Main Grid Layout */}
      <div className="container mx-auto px-4 h-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[85vh] max-w-7xl mx-auto">
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
            {/* Gradient overlay */}
            <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 font-montserrat">
                Your Health Journey<br />
                <span className="text-secondary">Starts Here</span>
              </h1>
              <p className="text-lg md:text-xl mb-6 max-w-lg opacity-90">
                Discover personalized health insights tailored to your unique biology and lifestyle.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button 
                    size="lg"
                    className="bg-secondary hover:bg-secondary-dark text-white rounded-full px-8 py-6 text-lg font-semibold shadow-lg transform hover:scale-105 transition-all"
                  >
                    Get Started
                  </Button>
                </Link>
                <Link href="/science">
                  <Button 
                    variant="outline"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-full px-8 py-6 text-lg font-semibold border-white/30"
                  >
                    Learn How It Works
                  </Button>
                </Link>
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
              <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                <h2 className="text-2xl font-bold font-montserrat">Push Your Limits</h2>
                <p className="text-sm opacity-90">Personalized fitness plans based on your DNA</p>
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
              <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                <h2 className="text-2xl font-bold font-montserrat">Achieve Together</h2>
                <p className="text-sm opacity-90">Shared goals for better health outcomes</p>
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
