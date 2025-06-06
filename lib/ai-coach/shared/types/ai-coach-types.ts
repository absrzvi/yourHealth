/**
 * AI Coach Core Types
 * 
 * This file contains shared types used across the AI Coach implementation.
 * Following clean architecture principles, these types are independent
 * of implementation details and focus on the domain model. [CA]
 */

/**
 * MedicalQueryType - Categories of health queries
 */
export enum MedicalQueryType {
  GENERAL = 'general',
  LAB_INTERPRETATION = 'lab_interpretation',
  GENETICS = 'genetics',
  MICROBIOME = 'microbiome',
  SYMPTOMS = 'symptoms',
  MEDICATIONS = 'medications',
  NUTRITION = 'nutrition',
}

/**
 * UrgencyLevel - Levels of medical urgency
 */
export enum UrgencyLevel {
  ROUTINE = 'routine',
  MODERATE = 'moderate',
  URGENT = 'urgent',
  EMERGENCY = 'emergency',
}

/**
 * MedicalDomain - Categories of medical knowledge
 */
export enum MedicalDomain {
  GENERAL = 'general',
  CARDIOLOGY = 'cardiology',
  ENDOCRINOLOGY = 'endocrinology',
  NEUROLOGY = 'neurology',
  GENETICS = 'genetics',
  NUTRITION = 'nutrition',
  IMMUNOLOGY = 'immunology',
  GASTROENTEROLOGY = 'gastroenterology',
  LABORATORY = 'laboratory',
  PHARMACOLOGY = 'pharmacology',
  MICROBIOME = 'microbiome',
}

/**
 * MedicalSource - Structure for medical information sources
 */
export interface MedicalSource {
  citation: string;
  confidence: number;
  domain: MedicalDomain;
  url?: string;
  pubDate?: string;
  authorCredentials?: string;
}

/**
 * MedicalContext - Components of medical context for personalized responses
 */
export interface MedicalContext {
  userId: string;
  currentSymptoms?: string[];
  medications?: string[];
  allergies?: string[];
  medicalHistory?: string[];
  recentTests?: MedicalTest[];
  familyHistory?: string[];
  lifestyle?: LifestyleFactors;
}

/**
 * MedicalTest - Structure for medical test results
 */
export interface MedicalTest {
  type: string;
  date: string;
  results: string | Record<string, unknown>;
  provider?: string;
  normalRanges?: Record<string, { min: number; max: number; units: string }>;
}

/**
 * LifestyleFactors - Relevant lifestyle information
 */
export interface LifestyleFactors {
  diet?: string;
  exercise?: string;
  sleep?: string;
  stress?: string;
  smoking?: boolean;
  alcohol?: string;
}

/**
 * FollowupRecommendation - Structure for medical followup suggestions
 */
export interface FollowupRecommendation {
  type: string;
  description: string;
  timeframe: string;
  urgency: UrgencyLevel;
}

/**
 * MedicalResponse - Structured medical response with metadata
 */
export interface MedicalResponse {
  text: string;
  sources: MedicalSource[];
  confidence: number;
  requires_followup: boolean;
  followup_recommendations?: FollowupRecommendation[];
  urgency?: UrgencyLevel;
  medical_domains: MedicalDomain[];
  created_at: string;
  session_id: string;
}

/**
 * EmergencyContact - Structure for emergency contact information
 */
export interface EmergencyContact {
  service: string;
  number: string;
  description?: string;
}

/**
 * AgentEvent - Events generated during the medical coach agent execution
 */
export interface AgentEvent {
  type: string;
  timestamp: string;
  content?: Record<string, unknown> | string | number | boolean | null; // Replace with more specific union as needed
  session_id?: string;
}

/**
 * LLMConfig - Configuration for the LLM service
 */
export interface LLMConfig {
  model_name: string;
  device: 'cpu' | 'cuda';
  max_tokens: number;
  temperature: number;
  use_fallback: boolean;
  fallback_threshold: number;
}

/**
 * RAGConfig - Configuration for the RAG service
 */
export interface RAGConfig {
  collection_name: string;
  embedding_model: string;
  distance_metric: string;
  top_k: number;
  score_threshold: number;
}

/**
 * ChatMessage - Structure for chat messages in the UI
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: MedicalSource[];
    requires_followup?: boolean;
    urgency?: UrgencyLevel;
    medical_domains?: MedicalDomain[];
    visualization_data?: Record<string, unknown>;

  };
}

/**
 * ChatSession - Structure for chat sessions
 */
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  active: boolean;
}
