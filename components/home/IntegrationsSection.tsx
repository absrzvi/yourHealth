'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  return (
    <section className="py-20 bg-gradient-to-br from-primary to-primary-dark relative overflow-hidden">
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
                      <p className="text-xs text-white/50 mb-3">COMPATIBLE WITH</p>
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
          <button className="bg-white hover:bg-gray-100 text-primary font-medium py-3 px-8 rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl">
            Join Waitlist for Early Access
          </button>
          <p className="text-white/60 text-sm mt-4">
            Be the first to know when new integrations are available
          </p>
        </motion.div>
      </div>
    </section>
  );
}
