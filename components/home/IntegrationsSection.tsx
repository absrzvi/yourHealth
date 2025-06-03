'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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

// This would typically go in a separate API route file
async function subscribeToWaitlist(email: string): Promise<{ success: boolean; message: string }> {
  // In a real implementation, this would call your backend API
  // For demo purposes, we'll simulate a successful signup after a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        resolve({ success: false, message: 'Please enter a valid email address' });
        return;
      }
      
      // Simulated success response
      resolve({ 
        success: true, 
        message: 'Thanks for joining! You\'ll be the first to know when new integrations are available.'
      });
    }, 1000);
  });
}

// Predefined circle positions for stability
const backgroundCircles = [
  { size: 120, top: '10%', left: '5%', delay: 0, className: 'animate-float' },
  { size: 80, top: '25%', left: '80%', delay: 1, className: 'animate-float-subtle' },
  { size: 140, top: '65%', left: '15%', delay: 2, className: 'animate-float' },
  { size: 100, top: '70%', left: '75%', delay: 1.5, className: 'animate-float-subtle' },
  { size: 60, top: '40%', left: '50%', delay: 0.5, className: 'animate-float' },
];

export function IntegrationsSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  return (
    <section className="py-20 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
      {/* Animated DNA Background */}
      <div className="absolute inset-0 overflow-hidden">
        {backgroundCircles.map((circle, i) => (
          <div
            key={`circle-${i}`}
            className={`absolute rounded-full bg-white/5 ${circle.className}`}
            style={{
              width: `${circle.size}px`,
              height: `${circle.size}px`,
              top: circle.top,
              left: circle.left,
              animationDelay: `${circle.delay}s`,
              willChange: 'transform', // Performance optimization for animations
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
          style={{ willChange: 'opacity, transform' }} // Performance optimization
        >
          <Badge 
            variant="secondary" 
            className="mb-4 text-sm font-medium py-1 px-3 bg-white/10 hover:bg-white/20 border-0 text-white/90 backdrop-blur-sm animate-badge-pulse"
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
                        className="bg-accent/10 text-accent border-accent/30 py-1 px-3 text-xs font-medium animate-badge-pulse"
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
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.3 }}
        >
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Join the Waitlist</h3>
            <p className="text-white/80 mb-5">
              Be the first to know when new integrations are available and get early access.
            </p>
            
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              if (!email.trim()) return;
              
              setIsSubmitting(true);
              setSubmitResult(null);
              
              try {
                const result = await subscribeToWaitlist(email);
                setSubmitResult(result);
                if (result.success) {
                  setEmail('');
                }
              } catch (error) {
                setSubmitResult({ 
                  success: false, 
                  message: 'Something went wrong. Please try again later.'
                });
              } finally {
                setIsSubmitting(false);
              }
            }}>
              <div className="flex w-full items-center space-x-2">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-accent focus:ring-accent"
                  aria-label="Email address for waitlist"
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  className="bg-accent hover:bg-accent/80 text-white font-medium whitespace-nowrap"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </Button>
              </div>
              
              {submitResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert className={`border-0 ${submitResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-destructive/20 text-destructive-foreground'}`}>
                    <div className="flex items-center gap-2">
                      {submitResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertDescription>{submitResult.message}</AlertDescription>
                    </div>
                  </Alert>
                </motion.div>
              )}
            </form>
            
            <p className="text-white/60 text-xs mt-4">
              We respect your privacy and will never share your information with third parties.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
