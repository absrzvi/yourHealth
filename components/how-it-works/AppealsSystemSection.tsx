'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, BarChart3, FileText, Clock, ArrowRight, Zap, Check, Sparkles, Send } from 'lucide-react';
import { fadeIn, slideIn, staggerContainer } from '@/lib/animations';

export function AppealsSystemSection() {
  const appealFeatures = [
    {
      icon: Bot,
      title: 'AI-Powered Analysis',
      description: 'Automated review of denial reasons and suggested appeal strategies based on historical success rates.'
    },
    {
      icon: BarChart3,
      title: 'Success Rate Tracking',
      description: 'Monitor appeal success rates by denial code, payer, and provider to identify patterns.'
    },
    {
      icon: FileText,
      title: 'Appeal Templates',
      description: 'Pre-built, customizable templates for common denial reasons to speed up the appeals process.'
    },
    {
      icon: Clock,
      title: 'Progress Monitoring',
      description: 'Track the status of all appeals with automated follow-up reminders and deadlines.'
    }
  ];

  return (
    <motion.section 
      className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white"
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
          viewport={{ once: true }}
        >
          <motion.div variants={slideIn('up')}>
            <div className="inline-flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Zap className="h-4 w-4 mr-2" />
              Appeals Management
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Turn Denials into Revenue
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our comprehensive appeals system helps you efficiently manage and overturn claim denials, 
              maximizing your reimbursement rates and reducing revenue loss.
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {appealFeatures.map((feature, index) => (
            <motion.div 
              key={index}
              variants={fadeIn}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Card className="group h-full border-2 border-transparent hover:border-blue-100 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <motion.div 
                    className="p-3 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    whileHover={{ rotate: 10 }}
                  >
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="mt-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-8 md:p-10">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2">
                <motion.div 
                  className="inline-flex items-center bg-white/20 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Coming Soon
                </motion.div>
                <motion.h3 
                  className="text-2xl md:text-3xl font-bold text-white mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  AI-Powered Appeals Assistant
                </motion.h3>
                <motion.p 
                  className="text-blue-100 mb-8 max-w-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Our AI assistant analyzes denial patterns, suggests the most effective appeal strategies, 
                  and drafts appeal letters automatically based on successful past appeals.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button 
                    className="px-6 py-3 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Join Waitlist for Early Access
                    <Send className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </motion.div>
              </div>
              <motion.div 
                className="mt-12 md:mt-0 md:ml-8 relative"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, type: 'spring' }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-2xl">
                  <div className="space-y-4">
                    {['Analyzing denial patterns...', 'Generating appeal strategy...', 'Drafting appeal letter...'].map((text, i) => (
                      <motion.div 
                        key={i} 
                        className="flex items-center text-blue-100 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          transition: { delay: 0.6 + (i * 0.2) }
                        }}
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                          <Check className="h-3 w-3 text-blue-200" />
                        </div>
                        {text}
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
