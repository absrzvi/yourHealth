// API route for AI Health Coach chat interface
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json();
  const userId = session.user.id;

  try {
    // Get user's health data context
    const userReports = await prisma.report.findMany({
      where: { userId },
      select: { parsedData: true, type: true, createdAt: true, fileName: true }
    });

    // Format context for the AI
    const context = formatReportsForLLM(userReports);

    // Dynamically determine the model from Ollama
    let model = process.env.OLLAMA_MODEL;
    if (!model) {
      // Fetch the list of models from Ollama and use the first one
      const modelsResponse = await fetch('http://localhost:11434/api/tags');
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        if (modelsData.models && modelsData.models.length > 0) {
          model = modelsData.models[0].name;
        } else {
          throw new Error('No models found in Ollama');
        }
      } else {
        throw new Error('Failed to fetch models from Ollama');
      }
    }
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: buildPrompt(message, context),
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Ollama');
    }

    const data = await response.json();
    
    // Save chat history
    await prisma.chatMessage.createMany({
      data: [
        {
          userId,
          content: message,
          role: 'user',
        },
        {
          userId,
          content: data.response,
          role: 'assistant',
        }
      ]
    });

    return NextResponse.json({ message: data.response });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process your request' },
      { status: 500 }
    );
  }
}

function formatReportsForLLM(reports: any[]) {
  if (!reports.length) {
    return "No health reports available for this user.";
  }

  // Group reports by type
  const reportsByType = reports.reduce((acc: any, report: any) => {
    const type = report.type || 'Unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(report);
    return acc;
  }, {});

  // Format each report type
  return Object.entries(reportsByType)
    .map(([type, typeReports]: [string, any[]]) => {
      // Get most recent report of this type
      const sortedReports = typeReports.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      let content = `Latest ${type} Report (${new Date(sortedReports[0].createdAt).toLocaleDateString()}):\n`;
      
      try {
        const data = typeof sortedReports[0].parsedData === 'string' 
          ? JSON.parse(sortedReports[0].parsedData) 
          : sortedReports[0].parsedData;
        
        if (type === 'BLOOD_TEST') {
          content += formatBloodTestData(data);
        } else if (type === 'DNA') {
          content += formatDNAData(data);
        } else if (type === 'MICROBIOME') {
          content += formatMicrobiomeData(data);
        } else {
          content += formatGenericData(data);
        }
        
        // Add historical context if multiple reports exist
        if (sortedReports.length > 1) {
          content += `\n\nHistorical Context: User has ${sortedReports.length} ${type} reports, with the oldest from ${new Date(sortedReports[sortedReports.length-1].createdAt).toLocaleDateString()}.`;
        }
        
      } catch (e) {
        content += "Error parsing report data";
        console.error(`Error parsing ${type} report:`, e);
      }
      
      return content;
    })
    .join('\n\n');
}

function formatBloodTestData(data: any) {
  if (!Array.isArray(data)) return JSON.stringify(data, null, 2);
  return data.map((item: any) => `- ${item.name || item.test}: ${item.value} ${item.unit || ''}`).join('\n');
}
function formatDNAData(data: any) {
  return JSON.stringify(data, null, 2);
}
function formatMicrobiomeData(data: any) {
  return JSON.stringify(data, null, 2);
}
function formatGenericData(data: any) {
  return JSON.stringify(data, null, 2);
}

function buildPrompt(message: string, context: string) {
  return `\nYou are Dr. Anna, an AI Health Coach with expertise in interpreting health data.\nYour role is to help users understand their health reports and provide personalized,\nactionable advice based on their specific health data.\n\nUSER'S HEALTH CONTEXT:\n${context}\n\nINSTRUCTIONS:\n1. Analyze the user's health data and provide relevant insights\n2. Explain biomarkers in simple, non-medical terms\n3. Identify any concerning patterns or correlations\n4. Provide specific, actionable recommendations\n5. If data is insufficient, ask clarifying questions\n6. Be empathetic, supportive, and professional\n7. Format your response with markdown for better readability\n8. If you don't know something, say so rather than guessing\n\nUSER'S QUESTION: ${message}\n\nDR. ANNA:`;
}
