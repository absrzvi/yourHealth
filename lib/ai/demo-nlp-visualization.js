/**
 * NLP Visualization Demo (JavaScript)
 * 
 * This script demonstrates how natural language queries are processed 
 * and converted into structured function arguments for visualization generation.
 * 
 * Run with: node lib/ai/demo-nlp-visualization.js
 */

// Mock implementation of the NLP visualization module for demonstration purposes
const mockRecognizeVisualizationIntent = (query) => {
  query = query.toLowerCase();
  
  // Default response with unknown intent
  const intent = {
    intentType: 'unknown',
    confidence: 0,
    entities: {},
    originalQuery: query
  };
  
  // Sample intent recognition logic
  if (query.includes('heart rate')) {
    intent.intentType = 'chart';
    intent.confidence = 0.85;
    intent.entities = {
      dataSource: ['health_metrics'],
      metrics: ['Heart Rate'],
      chartType: 'line',
      timeRange: 'LAST_WEEK',
      includeReferenceRanges: true
    };
  } else if (query.includes('cholesterol')) {
    intent.intentType = 'chart';
    intent.confidence = 0.78;
    intent.entities = {
      dataSource: ['blood_test'],
      metrics: ['LDL Cholesterol', 'HDL Cholesterol', 'Total Cholesterol'],
      chartType: 'bar',
      timeRange: 'LAST_MONTH'
    };
  } else if (query.includes('sleep')) {
    intent.intentType = 'chart';
    intent.confidence = 0.72;
    intent.entities = {
      dataSource: ['sleep_data'],
      metrics: ['Sleep Duration'],
      chartType: 'area',
      timeRange: 'LAST_MONTH'
    };
  } else if (query.includes('pie') && query.includes('macro')) {
    intent.intentType = 'chart';
    intent.confidence = 0.81;
    intent.entities = {
      dataSource: ['nutrition_log'],
      metrics: ['Protein', 'Carbohydrates', 'Fat'],
      chartType: 'pie',
      timeRange: 'LAST_WEEK'
    };
  } else if (query.includes('blood pressure') && query.includes('insight')) {
    intent.intentType = 'insights';
    intent.confidence = 0.75;
    intent.entities = {
      dataSource: ['health_metrics'],
      metrics: ['Blood Pressure Systolic', 'Blood Pressure Diastolic'],
      timeRange: 'LAST_MONTH'
    };
  } else if (query.includes('weight') && query.includes('3 month')) {
    intent.intentType = 'chart';
    intent.confidence = 0.82;
    intent.entities = {
      dataSource: ['weight_log'],
      metrics: ['Weight'],
      chartType: 'line',
      timeRange: 'LAST_3_MONTHS'
    };
  } else if (query.includes('dashboard')) {
    intent.intentType = 'dashboard';
    intent.confidence = 0.79;
    intent.entities = {
      dataSource: ['health_metrics', 'sleep_data', 'weight_log', 'exercise_log'],
      timeRange: 'LAST_MONTH',
      includeReferenceRanges: true
    };
  } else if (query.includes('glucose') && query.includes('reference')) {
    intent.intentType = 'chart';
    intent.confidence = 0.83;
    intent.entities = {
      dataSource: ['health_metrics'],
      metrics: ['Glucose'],
      chartType: 'line',
      timeRange: 'LAST_MONTH',
      includeReferenceRanges: true
    };
  }
  
  return intent;
};

// Mock function to convert intent to function arguments
const mockIntentToFunctionArgs = (intent) => {
  switch (intent.intentType) {
    case 'chart':
      return {
        dataSource: intent.entities.dataSource?.[0] || 'health_metrics',
        metrics: intent.entities.metrics || ['Heart Rate'],
        chartType: intent.entities.chartType || 'line',
        timeRange: intent.entities.timeRange || 'LAST_MONTH',
        customStartDate: intent.entities.customStartDate,
        customEndDate: intent.entities.customEndDate,
        includeReferenceRanges: intent.entities.includeReferenceRanges || false,
        title: intent.entities.title || `${intent.entities.metrics?.[0] || 'Health Metric'} Chart`
      };
      
    case 'dashboard':
      return {
        dataSources: intent.entities.dataSource || ['health_metrics'],
        timeRange: intent.entities.timeRange || 'LAST_MONTH',
        customStartDate: intent.entities.customStartDate,
        customEndDate: intent.entities.customEndDate,
        includeReferenceRanges: intent.entities.includeReferenceRanges || true,
        title: intent.entities.title || 'Health Dashboard'
      };
      
    case 'insights':
      return {
        dataSource: intent.entities.dataSource?.[0] || 'health_metrics',
        metrics: intent.entities.metrics || undefined,
        timeRange: intent.entities.timeRange || 'LAST_MONTH',
        customStartDate: intent.entities.customStartDate,
        customEndDate: intent.entities.customEndDate,
        includeRecommendations: true,
        title: intent.entities.title || 'Health Insights'
      };
      
    default:
      return null;
  }
};

// Mock function to generate prompt template
const mockGeneratePromptTemplate = (intent) => {
  if (intent.intentType === 'chart') {
    return `
      The user is asking for a CHART visualization
      
      Use the generate_chart function with these parameters:
      - dataSource: ${intent.entities.dataSource?.[0] || 'Determine from context'}
      - metrics: ${intent.entities.metrics?.join(', ') || 'Determine from context'}
      - chartType: ${intent.entities.chartType || 'Suggest appropriate chart type'}
      - timeRange: ${intent.entities.timeRange || 'LAST_MONTH'}
      - includeReferenceRanges: ${intent.entities.includeReferenceRanges || 'false'}
    `;
  } else if (intent.intentType === 'dashboard') {
    return `
      The user is asking for a DASHBOARD visualization
      
      Use the generate_dashboard function with these parameters:
      - dataSources: ${intent.entities.dataSource?.join(', ') || 'Include relevant health data sources'}
      - timeRange: ${intent.entities.timeRange || 'LAST_MONTH'}
      - includeReferenceRanges: true
    `;
  } else if (intent.intentType === 'insights') {
    return `
      The user is asking for HEALTH INSIGHTS
      
      Use the generate_health_insights function with these parameters:
      - dataSource: ${intent.entities.dataSource?.[0] || 'Determine from context'}
      - metrics: ${intent.entities.metrics?.join(', ') || 'All relevant metrics'}
      - timeRange: ${intent.entities.timeRange || 'LAST_MONTH'}
      - includeRecommendations: true
    `;
  } else {
    return `
      Based on the user's query, determine if they're asking for a visualization of health data.
      If yes, decide which type of visualization would be most appropriate:
      - Use a CHART function when they want a single chart for one or a few metrics
      - Use a DASHBOARD function when they want a comprehensive overview with multiple charts
      - Use a HEALTH INSIGHTS function when they want analysis and recommendations
    `;
  }
};

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
function processQuery(query) {
  console.log('\n-----------------------------------------------');
  console.log(`Processing query: "${query}"`);
  console.log('-----------------------------------------------');

  // Step 1: Recognize intent from natural language
  console.log('\n1️⃣ INTENT RECOGNITION');
  const intent = mockRecognizeVisualizationIntent(query);
  console.log(`Intent Type: ${intent.intentType}`);
  console.log(`Confidence: ${Math.round(intent.confidence * 100)}%`);
  console.log('Recognized Entities:');
  console.log(JSON.stringify(intent.entities, null, 2));

  // Step 2: Convert intent to function arguments
  console.log('\n2️⃣ CONVERSION TO FUNCTION ARGUMENTS');
  const args = mockIntentToFunctionArgs(intent);
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
    const promptTemplate = mockGeneratePromptTemplate(intent);
    console.log('\nGenerated OpenAI Prompt:');
    console.log(promptTemplate);
  }
}

// Main demo execution
function runDemo() {
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
