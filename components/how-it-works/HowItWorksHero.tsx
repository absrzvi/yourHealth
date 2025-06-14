'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { BookOpen, Settings, Users, Database, ArrowRight } from 'lucide-react';
import { fadeIn, hoverScale, slideIn, staggerContainer } from '@/lib/animations';

const featureCards = [
  {
    icon: BookOpen,
    title: 'Workflow Guide',
    description: 'Understand each stage of claims processing',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    icon: Settings,
    title: 'System Operations',
    description: 'Learn to manage and monitor your claims',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    icon: Database,
    title: 'Integrations',
    description: 'Understand LIS and insurance connections',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    icon: Users,
    title: 'Best Practices',
    description: 'Optimize your claims management workflow',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  }
];

export function HowItWorksHero() {
  return (
    <motion.section 
      className="py-20 px-6 overflow-hidden"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeIn}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div variants={slideIn('up')}>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Claims Management
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {" "}System Guide
              </span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-12"
            variants={slideIn('up')}
            transition={{ delay: 0.1 }}
          >
            Learn how to effectively operate your claims management system. This guide covers 
            workflows, system integrations, and best practices for managing your healthcare claims processing.
          </motion.p>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12"
            variants={staggerContainer}
          >
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div 
                  key={feature.title}
                  variants={fadeIn}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card className="h-full p-6 group hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-100">
                    <div className={`${feature.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-7 w-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{feature.description}</p>
                    <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div 
            className="mt-16 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 relative overflow-hidden"
            variants={fadeIn}
          >
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-200 rounded-full opacity-20"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-200 rounded-full opacity-20"></div>
            
            <motion.div 
              className="relative z-10 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Get Started with Our Interactive Guide
              </h2>
              <p className="text-gray-600 mb-6">
                Follow our step-by-step guide to master the claims management system. Click on any section below to learn more.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                Start Learning <ArrowRight className="h-4 w-4 ml-2" />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
