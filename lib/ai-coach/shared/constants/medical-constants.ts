/**
 * Medical Constants
 * 
 * Defines constants used across the AI Coach implementation.
 * Centralizing constants improves maintainability and consistency [CA].
 */

import { MedicalDomain } from '../types/ai-coach-types';

/**
 * Emergency keywords for detecting potential medical emergencies
 */
export const EMERGENCY_KEYWORDS = [
  'emergency', 'urgent', 'immediate help', 'severe pain',
  'chest pain', 'heart attack', 'stroke', 'can\'t breathe',
  'difficulty breathing', 'unconscious', 'suicide',
  'bleeding heavily', 'seizure', 'anaphylaxis', 'allergic reaction'
];

/**
 * Medical disclaimers to be included in responses
 */
export const MEDICAL_DISCLAIMERS = {
  GENERAL: 'This information is for educational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider for medical concerns.',
  EMERGENCY: 'If you are experiencing a medical emergency, please call emergency services (911 in the US) immediately or go to your nearest emergency room.',
  MEDICATIONS: 'Do not change your medication regimen without consulting your healthcare provider. Medication information provided is general and may not account for your specific health situation.',
  LABORATORY: 'Laboratory test results should be interpreted by a healthcare professional in the context of your complete health history and physical examination.',
  GENETICS: 'Genetic information provided is for educational purposes only. Consult with a genetic counselor or specialist for interpretation of genetic test results.',
};

/**
 * Domain-specific medical knowledge sources with reliability ratings
 */
export const MEDICAL_KNOWLEDGE_SOURCES = {
  [MedicalDomain.CARDIOLOGY]: [
    { name: 'American Heart Association', reliability: 0.95 },
    { name: 'American College of Cardiology', reliability: 0.95 },
    { name: 'European Society of Cardiology', reliability: 0.94 },
  ],
  [MedicalDomain.ENDOCRINOLOGY]: [
    { name: 'American Diabetes Association', reliability: 0.93 },
    { name: 'Endocrine Society', reliability: 0.92 },
  ],
  [MedicalDomain.NEUROLOGY]: [
    { name: 'American Academy of Neurology', reliability: 0.94 },
    { name: 'National Institute of Neurological Disorders', reliability: 0.95 },
  ],
  [MedicalDomain.GENETICS]: [
    { name: 'National Human Genome Research Institute', reliability: 0.96 },
    { name: 'American College of Medical Genetics', reliability: 0.95 },
  ],
  [MedicalDomain.NUTRITION]: [
    { name: 'Academy of Nutrition and Dietetics', reliability: 0.90 },
    { name: 'Harvard T.H. Chan School of Public Health', reliability: 0.92 },
  ],
  [MedicalDomain.LABORATORY]: [
    { name: 'American Association for Clinical Chemistry', reliability: 0.93 },
    { name: 'College of American Pathologists', reliability: 0.94 },
  ],
  [MedicalDomain.PHARMACOLOGY]: [
    { name: 'American Society of Health-System Pharmacists', reliability: 0.92 },
    { name: 'U.S. Food and Drug Administration', reliability: 0.93 },
  ],
  [MedicalDomain.MICROBIOME]: [
    { name: 'American Gut Project', reliability: 0.85 },
    { name: 'International Human Microbiome Standards', reliability: 0.86 },
    { name: 'National Institutes of Health Human Microbiome Project', reliability: 0.90 },
  ],
};

/**
 * Default emergency contacts
 */
export const DEFAULT_EMERGENCY_CONTACTS = [
  { service: 'Emergency Services', number: '911' },
  { service: 'Poison Control', number: '1-800-222-1222' },
  { service: 'Crisis Text Line', number: 'Text HOME to 741741' },
  { service: 'National Suicide Prevention Lifeline', number: '1-800-273-8255' },
];

/**
 * Medical query classification patterns for categorizing user questions
 */
export const QUERY_CLASSIFICATION_PATTERNS = {
  LAB_INTERPRETATION: ['blood test', 'lab result', 'biomarker', 'cholesterol', 'glucose', 'a1c', 'vitamin', 'deficiency'],
  GENETICS: ['gene', 'genetic', 'dna', 'mutation', 'snp', 'variant', 'genome', 'hereditary'],
  MICROBIOME: ['gut', 'microbiome', 'bacteria', 'probiotic', 'prebiotic', 'digestion', 'flora', 'intestinal'],
  SYMPTOMS: ['symptom', 'pain', 'feeling', 'discomfort', 'ache', 'hurt', 'burning', 'itching'],
  MEDICATIONS: ['medication', 'drug', 'prescription', 'pill', 'dosage', 'side effect', 'interact', 'pharmacy'],
  NUTRITION: ['diet', 'nutrition', 'food', 'supplement', 'vitamin', 'mineral', 'protein', 'carbohydrate', 'fat'],
};

/**
 * Configuration for CPU-optimized model paths and settings
 */
export const CPU_MODEL_CONFIG = {
  EMBEDDING: {
    MODEL_NAME: 'all-MiniLM-L6-v2',
    MAX_LENGTH: 384,
    DIMENSION: 384,
  },
  MEDICAL_LLM: {
    MODEL_NAME: 'medical-orca-mini-3b-onnx',
    MAX_LENGTH: 2048,
    TEMPERATURE: 0.7,
  },
  ONNX_RUNTIME: {
    THREADS: 4,
    EXECUTION_PROVIDER: 'CPUExecutionProvider',
  },
};

/**
 * RAG configuration settings
 */
export const RAG_CONFIG = {
  COLLECTION_NAME: 'medical_knowledge',
  QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
  VECTOR_DIMENSION: 384,
  TOP_K: 5,
  SCORE_THRESHOLD: 0.75,
};

/**
 * Medical domains to filter and enhance retrieval
 */
export const MEDICAL_DOMAINS = Object.values(MedicalDomain);

/**
 * Performance monitoring thresholds for CPU optimization
 */
export const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME_MS: 5000,
  MEMORY_USAGE_MB: 2048,
  MAX_CONCURRENT_REQUESTS: 4,
};

/**
 * Interface styles for AI Coach
 */
export const AI_COACH_UI = {
  AVATAR_URL: '/assets/images/aria-avatar.png',
  THEME_COLOR: '#0078D7',
  MESSAGE_COLORS: {
    USER: '#F0F4F8',
    ASSISTANT: '#EDFAFD',
    SYSTEM: '#F8F0F0',
    EMERGENCY: '#FDE8E8',
  },
};
