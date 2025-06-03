import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';
import {
  availableFunctions,
  functionImplementations,
} from '@/lib/ai/functions';
import {
  generateChart,
  generateDashboard,
  generateHealthInsights,
} from '@/lib/ai/visualizationService';
import {
  recognizeVisualizationIntent,
  intentToFunctionArgs,
  generateVisualizationPromptTemplate,
} from '@/lib/ai/nlp-visualization';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map function names from OpenAI to their implementations
const functionMap = {
  'generate_chart': generateChart,
  'generate_dashboard': generateDashboard,
  'generate_health_insights': generateHealthInsights,
};

export async function POST(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user from database for additional verification if needed
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // First, try to recognize the visualization intent directly from the message
    const visualizationIntent = recognizeVisualizationIntent(message);
    
    // If we have high confidence in our intent recognition, bypass OpenAI for efficiency
    if (visualizationIntent.intentType !== 'unknown' && visualizationIntent.confidence >= 0.7) {
      try {
        // Convert the recognized intent to function arguments
        const functionArgs = intentToFunctionArgs(visualizationIntent);
        
        if (functionArgs) {
          // Execute the appropriate function based on the recognized intent
          switch (visualizationIntent.intentType) {
            case 'chart':
              const chartResult = await generateChart(functionArgs, user.id);
              return NextResponse.json(chartResult);
            case 'dashboard':
              const dashboardResult = await generateDashboard(functionArgs, user.id);
              return NextResponse.json(dashboardResult);
            case 'insights':
              const insightsResult = await generateHealthInsights(functionArgs, user.id);
              return NextResponse.json(insightsResult);
          }
        }
      } catch (error) {
        console.error('Error in direct intent processing:', error);
        // Fall back to OpenAI if direct processing fails
      }
    }
    
    // If direct intent recognition fails or has low confidence, use OpenAI
    // Generate a prompt template based on any recognized intent
    const promptTemplate = generateVisualizationPromptTemplate(message);
    
    // Call OpenAI to determine the appropriate visualization
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // Use gpt-4 for better function calling capabilities
      messages: [
        {
          role: 'system',
          content: `You are Aria, a health data visualization assistant. You help users visualize their health data by creating appropriate charts and dashboards based on their natural language requests. You analyze trends in health metrics and provide insights. You can generate visualizations for various health metrics including cholesterol levels, blood pressure, glucose, weight, sleep, exercise, and nutrition data.
          
          ${promptTemplate}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      functions: availableFunctions,
      function_call: 'auto',
    });

    const responseMessage = completion.choices[0].message;

    // Check if the model wants to call a function
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      
      // Execute the appropriate function based on the model's choice
      if (functionMap[functionName as keyof typeof functionMap]) {
        const result = await functionMap[functionName as keyof typeof functionMap](functionArgs, user.id);
        
        return NextResponse.json(result);
      }
    }

    // If no function was called or recognized, return a default response
    return NextResponse.json({
      type: 'message',
      data: {
        content: 'I can help you visualize your health data. Try asking for a specific type of chart or dashboard.',
      },
    });
  } catch (error) {
    console.error('Error processing visualization request:', error);
    
    // Provide more detailed error information for debugging in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}` 
      : 'Error processing your request';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        type: 'error',
        fallback: {
          type: 'message',
          data: {
            content: "I'm having trouble generating that visualization right now. Could you try rephrasing your request?"
          }
        }
      },
      { status: 500 }
    );
  }
}
