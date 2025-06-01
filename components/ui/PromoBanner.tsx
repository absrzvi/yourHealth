'use client';

import { useState, useEffect } from 'react';
import { X, Gift, ArrowRight } from 'lucide-react';
import { Button } from './button';
import { motion, AnimatePresence } from 'framer-motion';

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Handle initial mount and visibility state
  useEffect(() => {
    setIsMounted(true);
    
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const dismissed = localStorage.getItem('promoBannerDismissed');
    if (dismissed) {
      const dismissedTime = new Date(dismissed).getTime();
      const currentTime = new Date().getTime();
      // Show again after 24 hours if previously dismissed
      if (currentTime - dismissedTime >= 24 * 60 * 60 * 1000) {
        localStorage.removeItem('promoBannerDismissed');
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(true);
    }
  }, []);
  
  // Don't render anything on server-side to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in local storage with timestamp
    if (typeof window !== 'undefined') {
      localStorage.setItem('promoBannerDismissed', new Date().toISOString());
    }
  };

  // Animation variants
  const bannerVariants = {
    hidden: { opacity: 0, y: 100, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      y: 100,
      scale: 0.95,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={bannerVariants}
        className="fixed right-6 bottom-6 z-50"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="relative bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-2xl shadow-2xl overflow-hidden w-80 sm:w-96 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full mix-blend-overlay"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/5 rounded-full mix-blend-overlay"></div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 z-10"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Banner content */}
          <div className="relative z-10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <motion.div 
                  className="bg-yellow-300 text-blue-600 rounded-2xl p-3"
                  animate={isHovered ? { rotate: [0, -10, 10, -5, 0] } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <Gift className="h-6 w-6" />
                </motion.div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-montserrat font-bold text-xl">Special Offer!</h3>
                  <motion.span
                    animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    🎉
                  </motion.span>
                </div>
                <p className="text-sm text-white/90 mb-4 leading-relaxed">
                  <span className="font-semibold">Get 20% OFF</span> your first DNA test kit.
                </p>
                <p className="text-xs font-medium text-yellow-200 mb-4 flex items-center">
                  <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                  Limited time only!
                </p>
                <Button 
                  variant="secondary"
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold transition-all duration-300 group"
                  size="sm"
                  onClick={() => window.location.href = '/products'}
                >
                  Claim Your Discount
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
