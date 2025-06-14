'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, Clock, Send, DollarSign, AlertTriangle, FileText, Zap, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { fadeIn, slideIn, staggerContainer } from '@/lib/animations';

const workflowSteps = [
  {
    id: 'draft',
    title: 'DRAFT',
    description: 'Claim created from lab report',
    icon: FileText,
    color: 'bg-gray-100 text-gray-800',
    validations: ['Patient information verified', 'Lab results parsed', 'CPT codes assigned'],
    nextAction: 'Auto-validation begins'
  },
  {
    id: 'validated',
    title: 'VALIDATED',
    description: 'All requirements verified',
    icon: CheckCircle,
    color: 'bg-blue-100 text-blue-800',
    validations: ['Insurance eligibility confirmed', 'Medical necessity verified', 'Coding accuracy checked'],
    nextAction: 'EDI 837 generation'
  },
  {
    id: 'ready',
    title: 'READY',
    description: 'EDI file generated',
    icon: Zap,
    color: 'bg-green-100 text-green-800',
    validations: ['EDI 837 format validated', 'Compliance checks passed', 'Transmission ready'],
    nextAction: 'Submit to clearinghouse'
  },
  {
    id: 'submitted',
    title: 'SUBMITTED',
    description: 'Sent to insurance',
    icon: Send,
    color: 'bg-purple-100 text-purple-800',
    validations: ['Clearinghouse accepted', 'Transmission confirmed', 'Tracking number assigned'],
    nextAction: 'Await insurance response'
  },
  {
    id: 'processing',
    title: 'PROCESSING',
    description: 'Under insurance review',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    validations: ['Insurance acknowledgment received', 'Review timeline established', 'Status monitoring active'],
    nextAction: 'Insurance decision pending'
  },
  {
    id: 'paid',
    title: 'PAID',
    description: 'Payment received',
    icon: DollarSign,
    color: 'bg-emerald-100 text-emerald-800',
    validations: ['Payment posted', 'ERA processed', 'Patient balance calculated'],
    nextAction: 'Claim complete'
  },
  {
    id: 'denied',
    title: 'DENIED',
    description: 'Requires attention',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-800',
    validations: ['Denial reason identified', 'Appeal eligibility assessed', 'Corrective action planned'],
    nextAction: 'Appeal process initiated'
  }
];

const StepIndicator = ({ step, isActive, onClick }: { step: typeof workflowSteps[0], isActive: boolean, onClick: () => void }) => {
  const Icon = step.icon;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-4 rounded-lg transition-all ${
        isActive 
          ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' 
          : 'hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <div className="flex items-center">
        <motion.div 
          className={`p-2 rounded-full ${step.color} mr-4`}
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div>
          <h3 className="font-semibold text-gray-900">{step.title}</h3>
          <p className="text-sm text-gray-600">{step.description}</p>
        </div>
        <ChevronRight className={`ml-auto h-5 w-5 text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
      </div>
    </motion.button>
  );
};

export function ClaimsWorkflowSection() {
  const [selectedStep, setSelectedStep] = useState(workflowSteps[0]);
  const [direction, setDirection] = useState(0);

  const selectStep = (step: typeof workflowSteps[0]) => {
    const currentIndex = workflowSteps.findIndex(s => s.id === selectedStep.id);
    const newIndex = workflowSteps.findIndex(s => s.id === step.id);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setSelectedStep(step);
  };

  return (
    <motion.section 
      className="py-20 px-6 bg-white overflow-hidden"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      variants={fadeIn}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={slideIn('up')}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Claims Workflow Process
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Follow your claims through every stage of the process, from creation to payment. 
              Each status change includes automated validations and clear next steps.
            </p>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Workflow Steps */}
          <motion.div 
            className="md:col-span-4 space-y-4"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {workflowSteps.map((step) => (
              <motion.div 
                key={step.id}
                variants={slideIn('right')}
                transition={{ duration: 0.5 }}
              >
                <StepIndicator 
                  step={step} 
                  isActive={selectedStep.id === step.id} 
                  onClick={() => selectStep(step)} 
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Step Details */}
          <motion.div 
            className="md:col-span-8"
            key={selectedStep.id}
            initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -50 : 50 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="h-full overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                <motion.div 
                  className="flex items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div 
                    className={`p-3 rounded-full ${selectedStep.color} mr-4`}
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <selectedStep.icon className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {selectedStep.title}
                    </CardTitle>
                    <p className="text-gray-600">{selectedStep.description}</p>
                  </div>
                </motion.div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <span className="inline-block w-1.5 h-5 bg-blue-600 rounded-full mr-2"></span>
                    Validations Performed
                  </h4>
                  <ul className="space-y-3">
                    {selectedStep.validations.map((validation, index) => (
                      <motion.li 
                        key={index} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (index * 0.05) }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{validation}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div 
                  className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-start">
                    <motion.div 
                      className="flex-shrink-0 p-2 bg-blue-100 rounded-lg"
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                    </motion.div>
                    <div className="ml-4">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">Next Action</h4>
                      <p className="text-blue-700">{selectedStep.nextAction}</p>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
