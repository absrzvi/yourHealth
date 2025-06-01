'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const isDismissed = localStorage?.getItem('promoBannerDismissed');
    if (isDismissed !== 'true') {
      // Show banner after a delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      
      // Cleanup
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Check if mobile device
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    // Store dismissal in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('promoBannerDismissed', 'true');
    }
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  // Don't render on mobile
  if (isMobile) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary to-primary-dark text-white z-50 shadow-lg`}
          initial={{ y: '100%' }}
          animate={isClosing ? { y: '100%' } : { y: 0 }}
          exit={{ y: '100%' }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-white/10 mr-4">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Limited Time Offer!</h3>
                    <p className="text-sm text-white/90">
                      Get <span className="font-bold">20% off</span> your first 3 months when you sign up today.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex space-x-3">
                <a
                  href="/pricing"
                  className="flex items-center justify-center px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Claim Offer
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-shrink-0 inline-flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200"
                  aria-label="Dismiss"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
