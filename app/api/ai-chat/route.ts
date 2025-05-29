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

  const body = await req.json();
  const { message, provider = 'openai', model: userModel } = body;
  const userId = session.user.id;

  try {
    // Get user's health data context
    const userReports = await prisma.report.findMany({
      where: { userId },
      select: { parsedData: true, type: true, createdAt: true, fileName: true }
    });

    // Format context for the AI
    const context = formatReportsForLLM(userReports);

    // Set a default model in case we can't connect to Ollama
    let model = process.env.OLLAMA_MODEL || 'phi3';
    
    // Try a basic connection test first
    try {
      console.log('Testing basic Ollama connection...');
      const pingResponse = await fetch('http://localhost:11434/', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      console.log(`Ollama ping response: ${pingResponse.status} ${pingResponse.statusText}`);
      
      if (pingResponse.ok) {
        const pingText = await pingResponse.text();
        console.log('Ollama response content:', pingText);
      }
    } catch (pingError) {
      console.error('Ollama ping failed:', pingError);
    }
    
    // Create an AbortController to handle timeout for model fetching
    const modelController = new AbortController();
    const modelTimeoutId = setTimeout(() => modelController.abort(), 8000); // 8 second timeout
    
    // Try to fetch available models from Ollama
    try {
      const modelsResponse = await fetch('http://localhost:11434/api/tags', {
        signal: modelController.signal
      });
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        if (modelsData.models && modelsData.models.length > 0) {
          model = modelsData.models[0].name;
          console.log(`Using Ollama model: ${model}`);
        }
      }
    } catch (error) {
      console.log('Could not fetch models from Ollama, using default:', model);
    } finally {
      clearTimeout(modelTimeoutId);
    }
    
    let data;
    try {
      if (provider === 'openai') {
        // OpenAI GPT-3.5 Turbo
        const openaiApiKey = process.env.OPENAI_API_KEY;
        const openaiModel = userModel || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        if (!openaiApiKey) throw new Error('OPENAI_API_KEY is not set');
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              { role: 'system', content: `You are Dr. Anna, an AI Health Coach. Here is the user's health context: ${context}` },
              { role: 'user', content: message }
            ],
            max_tokens: 512,
            temperature: 0.7
          })
        });
        if (!openaiRes.ok) throw new Error(`OpenAI error: ${openaiRes.status} ${openaiRes.statusText}`);
        const openaiData = await openaiRes.json();
        data = { response: openaiData.choices[0].message.content };
      } else if (provider === 'anthropic') {
        // Anthropic Claude
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        const anthropicModel = userModel || process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307';
        if (!anthropicApiKey) throw new Error('ANTHROPIC_API_KEY is not set');
        const anthropicPayload = {
          model: anthropicModel,
          max_tokens: 512,
          temperature: 0.7,
          system: `You are Dr. Anna, an AI Health Coach. Here is the user's health context: ${context}`,
          messages: [
            { role: 'user', content: message }
          ]
        };
        console.log('Anthropic payload:', JSON.stringify(anthropicPayload, null, 2));
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(anthropicPayload)
        });
        if (!anthropicRes.ok) {
          const errText = await anthropicRes.text();
          console.error('Anthropic error response:', errText);
          throw new Error(`Anthropic error: ${anthropicRes.status} ${anthropicRes.statusText} - ${errText}`);
        }
        const anthropicData = await anthropicRes.json();
        data = { response: anthropicData.content?.[0]?.text || anthropicData.content || 'No response from Claude.' };

      } else if (provider === 'ollama') {
        // Local Ollama
        const ollamaModel = userModel || process.env.OLLAMA_MODEL || 'phi3:latest';
        const ollamaRes = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: ollamaModel,
            prompt: buildPrompt(message, context),
            stream: false
          })
        });
        if (!ollamaRes.ok) throw new Error(`Ollama error: ${ollamaRes.status} ${ollamaRes.statusText}`);
        // Handle NDJSON streaming response
        const reader = ollamaRes.body?.getReader();
        let result = '';
        if (reader) {
          const decoder = new TextDecoder();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            result += decoder.decode(value, { stream: true });
          }
          result += decoder.decode(); // flush
        }
        const lines = result.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        data = JSON.parse(lastLine);
        data = { response: data.response || data.message || 'No response from Ollama.' };
      } else {
        throw new Error('Unknown provider');
      }
    } catch (llmError) {
        console.error('OpenAI error:', llmError);
        // Use fallback response if OpenAI is not available
        data = {
          response: generateFallbackResponse(message, context)
        };
        console.log('Using fallback response mechanism');
      }
      
      // Save chat history
      await prisma.$transaction([
        prisma.chatMessage.create({
          data: {
            userId,
            content: message,
            role: 'user',
          }
        }),
        prisma.chatMessage.create({
          data: {
            userId,
            content: data.response,
            role: 'assistant',
          }
        })
      ]);

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

function generateFallbackResponse(message: string, context: string): string {
  // Simple keyword-based response system as fallback
  const lowercaseMsg = message.toLowerCase();
  
  // Check if health data exists
  const hasHealthData = context !== "No health reports available for this user.";
  
  if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi') || message.length < 10) {
    return "Hello! I'm Dr. Anna, your AI Health Coach. How can I help you with your health journey today?";
  }
  
  if (lowercaseMsg.includes('vitamin') || lowercaseMsg.includes('b12') || lowercaseMsg.includes('d3')) {
    return "Vitamins are essential micronutrients that your body needs in small amounts. Monitoring vitamin levels like B12 and D3 is important as deficiencies can affect energy levels, mood, and immune function. If you've uploaded blood test results, I can analyze your specific vitamin levels and provide personalized recommendations.";
  }
  
  if (lowercaseMsg.includes('tired') || lowercaseMsg.includes('fatigue') || lowercaseMsg.includes('energy')) {
    return "Fatigue can be caused by many factors including nutrient deficiencies (especially iron, B12, D), thyroid issues, poor sleep quality, stress, or underlying health conditions. A comprehensive blood panel can help identify potential causes. I recommend tracking your sleep patterns and energy levels throughout the day, and ensuring you're getting adequate hydration and balanced nutrition.";
  }
  
  if (lowercaseMsg.includes('diet') || lowercaseMsg.includes('food') || lowercaseMsg.includes('eat')) {
    return "A balanced diet rich in whole foods forms the foundation of good health. Focus on colorful vegetables, quality proteins, healthy fats, and complex carbohydrates. Without seeing your specific health data, general recommendations include: increasing plant diversity for gut health, ensuring adequate protein (0.8-1g per kg of body weight), and staying properly hydrated. Would you like more specific dietary guidance based on particular health goals?";
  }
  
  // Default response if no specific keywords match
  if (hasHealthData) {
    return "I notice you have health data uploaded to your profile. To give you the most accurate and personalized advice, could you please be more specific about what aspects of your health reports you'd like me to analyze or explain? I'm here to help interpret your data and provide actionable recommendations.";
  } else {
    return "I'd be happy to help with your health questions. For personalized recommendations, consider uploading your health reports through the data sources section. In the meantime, I can still provide general health guidance based on scientific evidence. Could you provide more details about your specific health concerns or goals?";
  }
}

function buildPrompt(message: string, context: string) {
  return `\nYou are Dr. Anna, an AI Health Coach with expertise in interpreting health data.\nYour role is to help users understand their health reports and provide personalized,\nactionable advice based on their specific health data.\n\nUSER'S HEALTH CONTEXT:\n${context}\n\nINSTRUCTIONS:\n1. Analyze the user's health data and provide relevant insights\n2. Explain biomarkers in simple, non-medical terms\n3. Identify any concerning patterns or correlations\n4. Provide specific, actionable recommendations\n5. If data is insufficient, ask clarifying questions\n6. Be empathetic, supportive, and professional\n7. Format your response with markdown for better readability\n8. If you don't know something, say so rather than guessing\n\nUSER'S QUESTION: ${message}\n\nDR. ANNA:`;
}
