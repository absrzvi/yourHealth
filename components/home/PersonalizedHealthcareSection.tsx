'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '🧬',
    title: 'DNA-Based Nutrition',
    description: 'Your genes tell us how you process nutrients, react to foods, and metabolize medications.',
  },
  {
    icon: '🦠',
    title: 'Microbiome Optimization',
    description: 'Your gut bacteria influence everything from mood to immunity. We help you cultivate the right balance.',
  },
  {
    icon: '💉',
    title: 'Biomarker Tracking',
    description: 'Regular blood work reveals how your lifestyle choices impact your health in real-time.',
  },
  {
    icon: '📱',
    title: 'Activity Integration',
    description: 'Connect your devices to see how movement, sleep, and stress affect your biomarkers.',
  },
];

const ecosystemItems = [
  'DNA Profile',
  'Gut Health',
  'Blood Markers',
  'Sleep Data',
  'Activity Levels',
  'Stress Metrics',
  'Nutrition',
  'AI Insights',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

export function PersonalizedHealthcareSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-neutral-50 to-white relative overflow-hidden">
      {/* Animated Background Pattern */}
      <motion.div 
        className="absolute top-[-50%] right-[-20%] w-[60%] h-[200%] bg-gradient-radial from-primary/5 to-transparent transform rotate-45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {/* Text Content */}
          <motion.div variants={itemVariants}>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mb-6 font-montserrat text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Your Health Is{' '}
              <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                Uniquely Yours
              </span>
            </motion.h2>
            <motion.p 
              className="text-xl text-neutral-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Everybody is different. By monitoring your personalized metrics through DNA, 
              Microbiome, Blood works and activity tracking, you truly follow a lifestyle 
              that works for YOU!
            </motion.p>
            
            <motion.div className="space-y-6" variants={containerVariants}>
              {features.map((feature, index) => (
                <motion.div 
                  key={index} 
                  className="flex gap-4"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div>
                    <h4 className="text-lg font-semibold text-primary mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-neutral-600">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          {/* Visual Ecosystem */}
          <motion.div 
            className="flex justify-center"
            variants={itemVariants}
          >
            <Card className="p-8 bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <motion.div 
                className="w-40 h-40 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-2xl font-bold"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                YOU
              </motion.div>
              <h3 className="text-xl font-semibold text-center mb-6 text-primary">
                Your Personal Health Ecosystem
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {ecosystemItems.map((item, index) => (
                  <motion.div
                    key={index}
                    className="bg-neutral-50 hover:bg-primary hover:text-white transition-all duration-300 p-3 rounded-lg text-center text-sm cursor-pointer"
                    whileHover={{ 
                      y: -5,
                      scale: 1.05,
                      backgroundColor: '#1A3A6D',
                      color: 'white'
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item}
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
