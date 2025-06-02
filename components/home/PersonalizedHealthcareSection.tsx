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
    <section className="relative py-24 lg:py-32 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Text Content - Left Column */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="inline-block px-4 py-2 bg-blue-50 text-primary font-medium rounded-full text-sm mb-6">
                Personalized Health Ecosystem
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Health Is{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Uniquely Yours
                </span>
              </h2>
              <motion.p 
                className="text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                We combine DNA analysis, microbiome testing, and AI to create a health plan as unique as you are. No more generic advice—just science-backed recommendations tailored to your biology.
              </motion.p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                {features.map((feature, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.1 * index,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    whileHover={{ y: -5 }}
                    className="h-full"
                  >
                    <Card className="h-full p-6 bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-300 rounded-xl">
                      <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
          
          {/* Visual Elements - Right Column */}
          <div className="lg:col-span-5 relative">
            <motion.div 
              className="relative z-10"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Main Card */}
              <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Health Ecosystem</h3>
                  
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {ecosystemItems.map((item, index) => (
                      <motion.div 
                        key={index}
                        className="bg-gray-50 rounded-xl p-3 text-center text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-primary transition-colors cursor-default"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{ 
                          duration: 0.4, 
                          delay: 0.5 + (index * 0.05),
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        whileHover={{ 
                          y: -3,
                          scale: 1.03,
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                      >
                        {item}
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="relative h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden border border-gray-100">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4">
                        📊
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Real-time Health Dashboard</h4>
                      <p className="text-sm text-gray-500 max-w-xs">Track all your health metrics in one place</p>
                    </div>
                  </div>
                </div>
                
                {/* Animated background elements */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
                
                {/* Floating elements */}
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-yellow-100 rounded-2xl -z-10"></div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-pink-100 rounded-full -z-10"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
