'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatInterface from './ChatInterface';
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Heart, 
  Activity,
  TrendingUp,
  Shield,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedChatInterfaceProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  showDebug?: boolean;
}

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  prompt: string;
  color: string;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  isOpen,
  onClose,
  className = '',
  showDebug = false
}) => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const chatRef = useRef<any>(null);

  // Quick action suggestions
  const quickActions: QuickAction[] = [
    {
      id: 'symptoms',
      icon: <Heart className="w-5 h-5" />,
      label: 'Symptom Analysis',
      prompt: 'I need help understanding my symptoms',
      color: 'bg-red-500'
    },
    {
      id: 'biomarkers',
      icon: <Activity className="w-5 h-5" />,
      label: 'Biomarker Review',
      prompt: 'Can you analyze my recent lab results?',
      color: 'bg-blue-500'
    },
    {
      id: 'genetics',
      icon: <Brain className="w-5 h-5" />,
      label: 'Genetic Insights',
      prompt: 'What do my genetic markers tell me about my health?',
      color: 'bg-purple-500'
    },
    {
      id: 'prevention',
      icon: <Shield className="w-5 h-5" />,
      label: 'Prevention Tips',
      prompt: 'What preventive measures should I take based on my health data?',
      color: 'bg-green-500'
    },
    {
      id: 'trends',
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Health Trends',
      prompt: 'Show me my health trends over the past months',
      color: 'bg-orange-500'
    },
    {
      id: 'risks',
      icon: <AlertCircle className="w-5 h-5" />,
      label: 'Risk Assessment',
      prompt: 'What are my current health risks based on my data?',
      color: 'bg-yellow-500'
    }
  ];

  // Welcome message animation
  const welcomeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const handleQuickAction = useCallback((action: QuickAction) => {
    setSelectedTopic(action.id);
    setShowWelcome(false);
    
    // You would trigger sending the prompt to the chat here
    // For now, we'll just log it
    console.log('Quick action selected:', action.prompt);
  }, []);

  useEffect(() => {
    // Hide welcome screen after first interaction
    const timer = setTimeout(() => {
      if (showWelcome) {
        setShowWelcome(false);
      }
    }, 30000); // Auto-hide after 30 seconds

    return () => clearTimeout(timer);
  }, [showWelcome]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* AI Status Indicator */}
      <div className="absolute top-4 left-4 z-20">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-full text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Active</span>
        </motion.div>
      </div>

      {/* Welcome Overlay */}
      <AnimatePresence>
        {showWelcome && isOpen && (
          <motion.div
            variants={welcomeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-gradient-to-b from-blue-50/90 to-white/90 backdrop-blur-sm z-10 p-6 overflow-y-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-4"
              >
                <div className="relative">
                  <Brain className="w-16 h-16 text-blue-600" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-blue-400 rounded-full opacity-20 blur-xl"
                  />
                </div>
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Your AI Health Assistant
              </h2>
              <p className="text-gray-600 max-w-sm mx-auto">
                I'm here to help analyze your health data and provide personalized insights.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg text-white
                      ${action.color} hover:opacity-90 transition-all
                      shadow-md hover:shadow-lg
                    `}
                  >
                    <div className="bg-white/20 p-2 rounded-lg">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-left">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <button
                onClick={() => setShowWelcome(false)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Skip and start chatting
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Chat Interface */}
      <div className={`w-full h-full ${showWelcome ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        <ChatInterface
          ref={chatRef}
          isOpen={isOpen}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          showDebug={showDebug}
        />
      </div>

      {/* Connection Quality Indicator */}
      <AnimatePresence>
        {isHovered && !showWelcome && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute bottom-20 left-4 z-20"
          >
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium">
              <Zap className="w-3 h-3" />
              <span>Fast Response Mode</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Tips */}
      {!showWelcome && selectedTopic && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-4 right-4 z-20"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-blue-800">
              <strong>Tip:</strong> You can upload your lab results, DNA data, or health device exports for deeper analysis.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedChatInterface;