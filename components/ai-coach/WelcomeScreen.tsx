import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Heart, 
  Activity,
  TrendingUp,
  Shield,
  AlertCircle,
  MessageSquarePlus,
  Bot,
  Lightbulb,
  Stethoscope,
  Pill
} from 'lucide-react';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
  color: string;
  bgColor: string;
}

interface WelcomeScreenProps {
  onQuickAction: (prompt: string) => void;
  className?: string;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onQuickAction, 
  className = '' 
}) => {
  const quickActions: QuickAction[] = [
    {
      id: 'symptoms',
      icon: <Heart className="w-5 h-5" />,
      title: 'Symptom Analysis',
      description: 'Get help understanding your symptoms',
      prompt: 'I need help understanding my symptoms',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10 hover:bg-red-500/20'
    },
    {
      id: 'biomarkers',
      icon: <Activity className="w-5 h-5" />,
      title: 'Lab Results',
      description: 'Analyze your latest test results',
      prompt: 'Can you analyze my recent lab results?',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10 hover:bg-blue-500/20'
    },
    {
      id: 'medication',
      icon: <Pill className="w-5 h-5" />,
      title: 'Medication Review',
      description: 'Get information about your medications',
      prompt: 'Can you tell me about my current medications?',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10 hover:bg-purple-500/20'
    },
    {
      id: 'prevention',
      icon: <Shield className="w-5 h-5" />,
      title: 'Prevention Tips',
      description: 'Personalized health recommendations',
      prompt: 'What preventive measures should I take?',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10 hover:bg-green-500/20'
    },
    {
      id: 'trends',
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Health Trends',
      description: 'View your health data over time',
      prompt: 'Show me my health trends',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10 hover:bg-orange-500/20'
    },
    {
      id: 'risks',
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'Risk Assessment',
      description: 'Understand your health risks',
      prompt: 'What are my current health risks?',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20'
    },
    {
      id: 'diagnosis',
      icon: <Stethoscope className="w-5 h-5" />,
      title: 'Condition Info',
      description: 'Learn about health conditions',
      prompt: 'Tell me about diabetes management',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20'
    },
    {
      id: 'general',
      icon: <MessageSquarePlus className="w-5 h-5" />,
      title: 'General Health',
      description: 'Ask any health-related question',
      prompt: 'What are some ways to improve my sleep?',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10 hover:bg-pink-500/20'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.8 }
    }
  };

  return (
    <motion.div 
      className={cn("w-full h-full flex flex-col items-center justify-center p-6", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="text-center mb-8 max-w-2xl mx-auto"
        variants={fadeIn}
      >
        <div className="inline-flex items-center justify-center mb-4">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { 
                duration: 20, 
                repeat: Infinity, 
                ease: "linear" 
              },
              scale: {
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl -z-10" />
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              <Brain className="h-10 w-10" />
            </div>
          </motion.div>
        </div>
        
        <motion.h2 
          className="text-2xl md:text-3xl font-bold text-foreground mb-3"
          variants={itemVariants}
        >
          How can I help you today?
        </motion.h2>
        
        <motion.p 
          className="text-muted-foreground mb-8 text-base md:text-lg"
          variants={itemVariants}
        >
          I'm your AI health assistant. Ask me anything about your health, or try one of these quick actions.
        </motion.p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-6xl mx-auto"
        variants={containerVariants}
      >
        {quickActions.map((action) => (
          <motion.button
            key={action.id}
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onQuickAction(action.prompt)}
            className={cn(
              "flex flex-col items-start p-4 rounded-xl text-left transition-all duration-200",
              "border border-border/50 hover:border-blue-500/30",
              "bg-card/50 hover:bg-card/80 backdrop-blur-sm",
              "shadow-sm hover:shadow-md",
              action.bgColor,
              "group"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg mb-3 transition-colors",
              action.color,
              "bg-white/10 group-hover:bg-white/20"
            )}>
              {action.icon}
            </div>
            <h3 className="font-medium text-foreground mb-1">{action.title}</h3>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </motion.button>
        ))}
      </motion.div>

      <motion.div 
        className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto"
        variants={fadeIn}
      >
        <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          <span>Ask me anything about your health, medications, or fitness goals</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default WelcomeScreen;
