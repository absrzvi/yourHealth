/**
 * Demonstration script for Natural Language to Visualization conversion
 * 
 * This script shows how user queries are processed to generate visualizations
 * Run with: ts-node demo-nlp-visualization.ts
 */

import { recognizeVisualizationIntent, intentToFunctionArgs } from './nlp-visualization';
import { ChartType, DataSource, TimeRange } from './functions';
import { generateChart, generateHealthInsights } from './visualizationService';

// Sample user queries to demonstrate the system
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

// Mock user ID for the demonstration
const mockUserId = "demo-user-123";

// Process each query and show the results
async function demonstrateNLPVisualization() {
  console.log("======================================================");
  console.log("NATURAL LANGUAGE TO VISUALIZATION CONVERSION DEMO");
  console.log("======================================================\n");

  for (const query of sampleQueries) {
    console.log(`\n\nUSER QUERY: "${query}"`);
    console.log("------------------------------------------------------");

    // Step 1: Recognize the intent from the query
    const intent = recognizeVisualizationIntent(query);
    console.log("RECOGNIZED INTENT:");
    console.log(`- Type: ${intent.intentType}`);
    console.log(`- Confidence: ${intent.confidence.toFixed(2)}`);
    console.log("- Entities detected:");
    
    if (intent.entities.dataSource) {
      console.log(`  • Data Source: ${intent.entities.dataSource.join(", ")}`);
    }
    
    if (intent.entities.metrics) {
      console.log(`  • Metrics: ${intent.entities.metrics.join(", ")}`);
    }
    
    if (intent.entities.chartType) {
      console.log(`  • Chart Type: ${intent.entities.chartType}`);
    }
    
    if (intent.entities.timeRange) {
      console.log(`  • Time Range: ${intent.entities.timeRange}`);
    }
    
    if (intent.entities.includeReferenceRanges !== undefined) {
      console.log(`  • Include Reference Ranges: ${intent.entities.includeReferenceRanges}`);
    }

    // Step 2: Convert intent to function arguments
    const functionArgs = intentToFunctionArgs(intent);
    console.log("\nFUNCTION ARGUMENTS:");
    console.log(JSON.stringify(functionArgs, null, 2));

    // Step 3: Generate the visualization (if confidence is high enough)
    if (intent.confidence >= 0.5) {
      console.log("\nGENERATING VISUALIZATION...");
      
      try {
        let result;
        
        if (intent.intentType === 'chart') {
          result = await generateChart(functionArgs, mockUserId);
          console.log(`Generated ${functionArgs.chartType} chart for ${functionArgs.metrics.join(", ")}`);
        } else if (intent.intentType === 'insights') {
          result = await generateHealthInsights(functionArgs, mockUserId);
          console.log(`Generated health insights for ${functionArgs.metrics ? functionArgs.metrics.join(", ") : "all metrics"}`);
        } else if (intent.intentType === 'dashboard') {
          console.log(`Would generate dashboard with multiple metrics`);
          // Dashboard generation is more complex, so we'll just simulate it
          result = { type: 'dashboard', data: { title: functionArgs.title, charts: [] }};
        }
        
        // In a real application, this result would be sent to the frontend
        console.log("\nRESULT TYPE:");
        console.log(`- ${result?.type || 'unknown'}`);
      } catch (error) {
        console.error("Error generating visualization:", error);
      }
    } else {
      console.log("\nConfidence too low, would fall back to OpenAI for processing");
    }
    
    console.log("\n======================================================");
  }
}

// Simulate the API response for a single query
async function simulateAPIResponse(userQuery: string) {
  console.log(`\n\nSIMULATING API RESPONSE FOR: "${userQuery}"`);
  console.log("------------------------------------------------------");
  
  // Step 1: Recognize intent directly
  const intent = recognizeVisualizationIntent(userQuery);
  console.log(`Intent recognized: ${intent.intentType} (confidence: ${intent.confidence.toFixed(2)})`);
  
  // Step 2: Process based on confidence
  if (intent.intentType !== 'unknown' && intent.confidence >= 0.7) {
    console.log("Confidence is high! Bypassing OpenAI for efficiency");
    
    // Convert intent to function args
    const functionArgs = intentToFunctionArgs(intent);
    
    // Generate visualization
    if (intent.intentType === 'chart') {
      const result = await generateChart(functionArgs, mockUserId);
      console.log("\nAPI RESPONSE (direct processing):");
      console.log(JSON.stringify({
        type: 'chart',
        data: {
          chartType: functionArgs.chartType,
          title: functionArgs.title,
          metrics: functionArgs.metrics,
          // Full data would be here
        }
      }, null, 2));
    } else {
      console.log(`Would generate ${intent.intentType} using direct processing`);
    }
  } else {
    console.log("Confidence is low! Would fall back to OpenAI");
    console.log("OpenAI would receive this prompt template:");
    
    // In a real scenario, we'd call OpenAI here
    const mockOpenAIResponse = {
      function_call: {
        name: "generate_chart",
        arguments: JSON.stringify({
          dataSource: "health_metrics",
          metrics: ["Heart Rate"],
          chartType: "line",
          timeRange: "LAST_WEEK"
        })
      }
    };
    
    console.log("\nMOCK OPENAI RESPONSE:");
    console.log(JSON.stringify(mockOpenAIResponse, null, 2));
    
    console.log("\nAPI RESPONSE (via OpenAI):");
    console.log(JSON.stringify({
      type: 'chart',
      data: {
        chartType: "line",
        title: "Heart Rate Chart",
        // Full data would be here
      }
    }, null, 2));
  }
}

// Run the demonstration
console.log("Starting demonstration...");

// Choose one example for a full API simulation
const exampleQuery = "Show me my heart rate trend over the last week with reference ranges";
simulateAPIResponse(exampleQuery).then(() => {
  console.log("\n\nDemonstration complete!");
});

// Uncomment to run all examples
// demonstrateNLPVisualization().then(() => {
//   console.log("\n\nDemonstration complete!");
// });

export {};
