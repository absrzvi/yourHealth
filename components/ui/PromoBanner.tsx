'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed right-6 bottom-6 z-50 transition-all duration-300 transform ${
        isScrolled ? 'translate-y-0' : 'translate-y-2'
      }`}
    >
      <div className="relative bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl shadow-2xl overflow-hidden w-80">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Banner content */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="bg-yellow-300 text-blue-600 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Special Offer! 🎉</h3>
              <p className="text-sm mb-3">Get 20% off your first DNA test kit. Limited time only!</p>
              <Button 
                className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium"
                onClick={() => window.location.href = '/products'}
              >
                Claim Your Discount
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-yellow-300 rounded-full opacity-20"></div>
        <div className="absolute -top-4 -left-4 w-16 h-16 bg-pink-300 rounded-full opacity-20"></div>
      </div>
    </div>
  );
}
