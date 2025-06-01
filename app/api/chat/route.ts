import { NextRequest, NextResponse } from 'next/server';
import { openai, DEFAULT_MODEL, SYSTEM_PROMPT } from '@/lib/ai/openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Helper to create a streaming response
const streamResponse = (stream: any) => {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { message, chatSessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required and must be a string' }, { status: 400 });
    }

    // Create or get chat session
    const chatSession = chatSessionId
      ? await prisma.chatSession.findUnique({ where: { id: chatSessionId } })
      : await prisma.chatSession.create({
          data: {
            title: 'New Chat',
            user: { connect: { email: session.user.email } },
          },
        });

    if (!chatSession) {
      return NextResponse.json({ error: 'Failed to create or find chat session' }, { status: 500 });
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        content: message,
        role: 'USER',
        chatSessionId: chatSession.id,
      },
    });

    // Get chat history for context
    const chatHistory = await prisma.chatMessage.findMany({
      where: { chatSessionId: chatSession.id },
      orderBy: { createdAt: 'asc' },
      take: 10, // Last 10 messages for context
    });
    
    if (!chatHistory || chatHistory.length === 0) {
      throw new Error('Failed to retrieve chat history');
    }

    // Format messages for OpenAI
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...chatHistory.map(msg => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Create OpenAI stream
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      stream: true,
      temperature: 0.7,
    });

    // Create a stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        
        // Process the stream
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          fullResponse += content;
          
          // Send chunk to client
          controller.enqueue(
            `data: ${JSON.stringify({
              content,
              done: false,
            })}\n\n`
          );
        }

        // Save AI response to database
        await prisma.chatMessage.create({
          data: {
            content: fullResponse,
            role: 'ASSISTANT',
            chatSessionId: chatSession.id,
          },
        });

        // Send completion event
        controller.enqueue(
          `data: ${JSON.stringify({ done: true })}\n\n`
        );
        controller.close();
      },
    });

    return streamResponse(stream);

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get chat history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatSessionId = searchParams.get('chatSessionId');

    if (!chatSessionId) {
      // Return list of chat sessions
      const sessions = await prisma.chatSession.findMany({
        where: { user: { email: session.user.email } },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
      return NextResponse.json({ sessions });
    }

    // Return messages for a specific chat session
    const messages = await prisma.chatMessage.findMany({
      where: { 
        chatSessionId,
        chatSession: { user: { email: session.user.email } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
