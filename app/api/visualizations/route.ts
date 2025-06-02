import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import OpenAI from 'openai';
import { generateSampleData } from '@/lib/chartUtils';
import { prisma } from '@/lib/db';  // For future database operations

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the function schemas for OpenAI function calling
const functions = [
  {
    name: 'create_health_chart',
    description: 'Create a health data visualization chart',
    parameters: {
      type: 'object',
      properties: {
        chartType: {
          type: 'string',
          enum: ['line', 'bar', 'area', 'pie', 'radar'],
          description: 'Type of chart to create',
        },
        title: {
          type: 'string',
          description: 'Title of the chart',
        },
        xAxis: {
          type: 'string',
          description: 'Field to use for the x-axis',
        },
        yAxis: {
          type: 'string',
          description: 'Field to use for the y-axis',
        },
        timeRange: {
          type: 'string',
          enum: ['day', 'week', 'month', 'year'],
          description: 'Time range for the data',
        },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'List of metrics to include in the chart',
        },
      },
      required: ['chartType', 'title'],
    },
  },
  {
    name: 'create_health_dashboard',
    description: 'Create a health dashboard with multiple visualizations',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the dashboard',
        },
        timeRange: {
          type: 'string',
          enum: ['day', 'week', 'month', 'year'],
          description: 'Time range for the data',
        },
        charts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              chartType: {
                type: 'string',
                enum: ['line', 'bar', 'area', 'pie', 'radar'],
              },
              title: { type: 'string' },
              xAxis: { type: 'string' },
              yAxis: { type: 'string' },
              metrics: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['chartType', 'title'],
          },
        },
      },
      required: ['title', 'charts'],
    },
  },
];

// Helper function to generate sample data based on the request
const generateChartData = (params: any) => {
  const { chartType, timeRange = 'week' } = params;
  
  // In a real app, this would fetch actual data from your database
  // For now, we'll use the sample data generator
  return generateSampleData(chartType, timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365);
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

    // Call OpenAI to determine the appropriate visualization
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a health data visualization assistant. Your job is to help users visualize their health data by creating appropriate charts and dashboards based on their natural language requests.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      functions,
      function_call: 'auto',
    });

    const responseMessage = completion.choices[0].message;

    // Check if the model wants to call a function
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      if (functionName === 'create_health_chart') {
        // Generate chart data
        const chartData = generateChartData(functionArgs);
        
        return NextResponse.json({
          type: 'chart',
          data: {
            ...functionArgs,
            data: chartData,
          },
        });
      } else if (functionName === 'create_health_dashboard') {
        // Generate dashboard data
        const charts = functionArgs.charts.map((chart: any) => ({
          ...chart,
          data: generateChartData(chart),
        }));

        return NextResponse.json({
          type: 'dashboard',
          data: {
            ...functionArgs,
            charts,
          },
        });
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
    return NextResponse.json(
      { error: 'Error processing your request' },
      { status: 500 }
    );
  }
}
