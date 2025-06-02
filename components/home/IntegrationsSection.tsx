'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

interface IntegrationCard {
  title: string;
  description: string;
  icon: string;
  status: 'coming-soon' | 'available' | 'beta';
  logos?: string[];
}

const integrationCards: IntegrationCard[] = [
  {
    title: 'Wearable Devices',
    description: 'Sync data from your favorite fitness trackers and smartwatches for comprehensive health insights.',
    icon: '⌚',
    status: 'available',
    logos: ['fitbit', 'apple', 'garmin', 'whoop', 'oura'],
  },
  {
    title: 'Healthcare Providers',
    description: 'Connect with your healthcare providers to share your health data and get personalized recommendations.',
    icon: '🏥',
    status: 'coming-soon',
    logos: ['epic', 'cerner', 'allscripts', 'athena'],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function IntegrationsSection() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, you would send this to your backend
      // const response = await fetch('/api/waitlist', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, just show success
      setHasSubmitted(true);
      setEmail('');
      toast.success('You\'ve been added to the waitlist!', {
        description: 'We\'ll keep you updated on our progress.'
      });
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setHasSubmitted(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Something went wrong', {
        description: 'Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <section id="integrations" className="py-20 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
      {/* Animated DNA Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 15 + Math.random() * 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <Badge 
            variant="secondary" 
            className="mb-4 text-sm font-medium py-1 px-3 bg-white/10 hover:bg-white/20 border-0 text-white/90 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            COMING SOON
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-montserrat">
            Seamless Health Data Integration
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Connect your favorite health and fitness apps to get a complete picture of your wellbeing in one place.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {integrationCards.map((card, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-colors duration-300">
                <div className="p-8 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-3xl">
                      {card.icon}
                    </div>
                    {card.status === 'coming-soon' && (
                      <Badge 
                        variant="outline" 
                        className="bg-accent/10 text-accent border-accent/30 py-1 px-3 text-xs font-medium"
                      >
                        Coming Soon
                      </Badge>
                    )}
                    {card.status === 'available' && (
                      <Badge 
                        variant="outline" 
                        className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 py-1 px-3 text-xs font-medium"
                      >
                        Available
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {card.title}
                  </h3>
                  <p className="text-white/70 mb-6 flex-grow">
                    {card.description}
                  </p>
                  
                  {card.logos && (
                    <div className="mt-auto pt-6 border-t border-white/10">
                      <p className="text-xs font-medium text-white/80 mb-3 tracking-wide">COMPATIBLE WITH</p>
                      <div className="flex flex-wrap gap-3">
                        {card.logos.map((logo, i) => (
                          <motion.div
                            key={i}
                            className="bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 text-sm text-white/80 transition-colors duration-200 cursor-pointer"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {logo.split('-').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-16 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {!hasSubmitted ? (
              <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white/50 focus-visible:ring-offset-0 h-12"
                  />
                  <Button 
                    type="submit" 
                    className="h-12 px-6 bg-white text-primary hover:bg-white/90 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Joining...
                      </>
                    ) : 'Join Waitlist'}
                  </Button>
                </div>
                <p className="text-white/60 text-sm text-center">
                  Be the first to know when new integrations are available
                </p>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-6 bg-white/5 rounded-xl backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">You're on the list!</h3>
                <p className="text-white/70">
                  Thanks for your interest. We'll be in touch soon!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
