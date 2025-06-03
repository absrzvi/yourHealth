/**
 * NLP Visualization Console Demo
 * 
 * This script demonstrates how natural language queries are processed by the NLP-visualization module
 * and converted into structured function arguments for visualization generation.
 * 
 * Run with: npx ts-node lib/ai/demo-console.ts
 */

import { recognizeVisualizationIntent, convertIntentToFunctionArgs, generatePromptTemplate } from './nlp-visualization';
import chalk from 'chalk';

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

// Mock visualization service function (simplified for demo)
const mockVisualizationService = (functionName: string, args: any) => {
  console.log(chalk.green('\n✅ Visualization generated:'));
  console.log(chalk.cyan(`Function: ${functionName}`));
  console.log(chalk.yellow('Arguments:'));
  console.log(JSON.stringify(args, null, 2));
  return { success: true, function: functionName, args };
};

// Process a single query and show the full NLP flow
const processQuery = (query: string) => {
  console.log(chalk.bold('\n-----------------------------------------------'));
  console.log(chalk.bold(`Processing query: "${query}"`));
  console.log(chalk.bold('-----------------------------------------------'));

  // Step 1: Recognize intent from natural language
  console.log(chalk.blue('\n1️⃣ INTENT RECOGNITION'));
  const intent = recognizeVisualizationIntent(query);
  console.log(`Intent Type: ${chalk.bold(intent.intentType)}`);
  console.log(`Confidence: ${chalk.bold(Math.round(intent.confidence * 100) + '%')}`);
  console.log('Recognized Entities:');
  console.log(JSON.stringify(intent.entities, null, 2));

  // Step 2: Convert intent to function arguments
  console.log(chalk.blue('\n2️⃣ CONVERSION TO FUNCTION ARGUMENTS'));
  const { functionName, args } = convertIntentToFunctionArgs(intent);
  console.log(`Function Name: ${chalk.bold(functionName)}`);
  console.log('Function Arguments:');
  console.log(JSON.stringify(args, null, 2));

  // Step 3: Decision - Direct processing or OpenAI fallback
  console.log(chalk.blue('\n3️⃣ PROCESSING DECISION'));
  if (intent.confidence >= 0.7) {
    console.log(chalk.green(`✅ Confidence (${Math.round(intent.confidence * 100)}%) meets threshold (70%)`));
    console.log(chalk.green('➡️ Direct processing without OpenAI'));
    
    // Call the appropriate visualization service function
    mockVisualizationService(functionName, args);
  } else {
    console.log(chalk.yellow(`⚠️ Confidence (${Math.round(intent.confidence * 100)}%) below threshold (70%)`));
    console.log(chalk.yellow('➡️ Falling back to OpenAI function calling'));
    
    // Generate prompt template for OpenAI
    const promptTemplate = generatePromptTemplate(intent);
    console.log(chalk.magenta('\nGenerated OpenAI Prompt:'));
    console.log(promptTemplate);
    
    console.log(chalk.gray('\nSimulating OpenAI response...'));
    setTimeout(() => {
      console.log(chalk.green('\n✅ OpenAI function call received:'));
      console.log(`Function: ${chalk.cyan(functionName)}`);
      console.log(chalk.yellow('Arguments:'));
      console.log(JSON.stringify(args, null, 2));
    }, 1000);
  }
};

// Main demo execution
const runDemo = () => {
  console.log(chalk.bgCyan.black.bold('\n 🔍 NATURAL LANGUAGE VISUALIZATION DEMO 📊 \n'));
  console.log('This demo shows how natural language queries are processed into visualizations.');
  console.log('The system will analyze each query, extract intent and entities, and generate the appropriate visualization.\n');
  
  // Process each sample query
  let queryIndex = 0;
  
  const processNextQuery = () => {
    if (queryIndex < sampleQueries.length) {
      processQuery(sampleQueries[queryIndex]);
      queryIndex++;
      setTimeout(processNextQuery, 3000); // Wait 3 seconds between queries
    } else {
      console.log(chalk.bgGreen.black.bold('\n 🎉 DEMO COMPLETE 🎉 \n'));
      console.log('This demonstrates how the NLP visualization system:');
      console.log('1. Recognizes user intent from natural language');
      console.log('2. Extracts relevant entities (metrics, time ranges, chart types)');
      console.log('3. Converts recognized intent to structured function arguments');
      console.log('4. Calls the appropriate visualization service or falls back to OpenAI');
      console.log('5. Delivers the requested visualization to the user\n');
    }
  };
  
  processNextQuery();
};

// Run the demo
runDemo();
