/**
 * Improved NLP Visualization Demo
 * 
 * This script demonstrates how natural language queries are processed by the NLP-visualization module
 * and converted into structured function arguments for visualization generation.
 * 
 * Run with: npx ts-node lib/ai/improved-demo.ts
 */

import { recognizeVisualizationIntent, intentToFunctionArgs, generateVisualizationPromptTemplate } from './nlp-visualization';

// Sample queries that demonstrate the system's capabilities
const sampleQueries = [
  "Show me my heart rate for the last week",
  "Create a bar chart of my cholesterol levels",
  "I'd like to see my sleep patterns over the past month",
  "Can you make a pie chart showing my macronutrient distribution?",
  "What insights do you have about my blood pressure?",
  "How has my weight changed over the last 3 months?",
  "Give me a dashboard of all my health metrics",
  "Show me my glucose levels with reference ranges"
];

// Process a single query and show the full NLP flow
function processQuery(query: string): void {
  console.log('\n-----------------------------------------------');
  console.log(`Processing query: "${query}"`);
  console.log('-----------------------------------------------');

  // Step 1: Recognize intent from natural language
  console.log('\n1️⃣ INTENT RECOGNITION');
  const intent = recognizeVisualizationIntent(query);
  console.log(`Intent Type: ${intent.intentType}`);
  console.log(`Confidence: ${Math.round(intent.confidence * 100)}%`);
  console.log('Recognized Entities:');
  console.log(JSON.stringify(intent.entities, null, 2));

  // Step 2: Convert intent to function arguments
  console.log('\n2️⃣ CONVERSION TO FUNCTION ARGUMENTS');
  const args = intentToFunctionArgs(intent);
  console.log('Function Arguments:');
  console.log(JSON.stringify(args, null, 2));

  // Step 3: Decision - Direct processing or OpenAI fallback
  console.log('\n3️⃣ PROCESSING DECISION');
  if (intent.confidence >= 0.7) {
    console.log(`✅ Confidence (${Math.round(intent.confidence * 100)}%) meets threshold (70%)`);
    console.log('➡️ Direct processing without OpenAI');
    
    // Determine function name based on intent type
    const functionName = 
      intent.intentType === 'chart' ? 'generateChart' :
      intent.intentType === 'dashboard' ? 'generateDashboard' :
      intent.intentType === 'insights' ? 'generateHealthInsights' : 'unknown';
    
    console.log(`\n✅ Would call: ${functionName}()`);
    console.log('With arguments:');
    console.log(JSON.stringify(args, null, 2));
  } else {
    console.log(`⚠️ Confidence (${Math.round(intent.confidence * 100)}%) below threshold (70%)`);
    console.log('➡️ Falling back to OpenAI function calling');
    
    // Generate prompt template for OpenAI
    const promptTemplate = generateVisualizationPromptTemplate(query);
    console.log('\nGenerated OpenAI Prompt:');
    console.log(promptTemplate);
  }
}

// Main demo execution
function runDemo(): void {
  console.log('\n 🔍 NATURAL LANGUAGE VISUALIZATION DEMO 📊 \n');
  console.log('This demo shows how natural language queries are processed into visualizations.');
  console.log('The system will analyze each query, extract intent and entities, and generate the appropriate visualization.\n');
  
  // Process each sample query
  sampleQueries.forEach((query, index) => {
    console.log(`\nQuery ${index + 1}/${sampleQueries.length}`);
    processQuery(query);
  });
  
  console.log('\n 🎉 DEMO COMPLETE 🎉 \n');
  console.log('This demonstrates how the NLP visualization system:');
  console.log('1. Recognizes user intent from natural language');
  console.log('2. Extracts relevant entities (metrics, time ranges, chart types)');
  console.log('3. Converts recognized intent to structured function arguments');
  console.log('4. Calls the appropriate visualization service or falls back to OpenAI');
  console.log('5. Delivers the requested visualization to the user\n');
}

// Run the demo
runDemo();
