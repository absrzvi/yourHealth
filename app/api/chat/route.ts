import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
// Import both OpenAI and local chat functions for fallback capability
import { streamChatCompletion } from '@/lib/ai/chat';
import { streamLocalChatCompletion, checkLocalApiAvailability } from '@/lib/ai/local-chat';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
};

// Maximum number of messages to include in the chat context
const MAX_CONTEXT_MESSAGES = 20;

// Helper function to handle errors consistently
const handleApiError = (error: unknown, message: string) => {
  console.error(message, error);
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
};

// Default system message for the AI assistant
const SYSTEM_MESSAGE: ChatMessage = {
  role: 'system',
  content: `You are a knowledgeable and empathetic health coach named Aria. Your goal is to help users understand their health data and make informed decisions about their well-being.

Guidelines:
- Be supportive, encouraging, and non-judgmental
- Provide evidence-based information
- Keep responses concise and actionable
- Ask clarifying questions when needed
- Reference the user's specific health data when available
- Maintain a professional yet friendly tone
- If you don't know something, be honest and offer to help find the information`,
};

// Helper to create a streaming response
const createStreamingResponse = (stream: ReadableStream) => {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};

// Helper to handle errors consistently
const handleError = (error: unknown, message: string) => {
  console.error(`${message}:`, error);
  return NextResponse.json(
    { error: message, details: error instanceof Error ? error.message : 'Unknown error' }, 
    { status: 500 }
  );
};

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { message, chatSessionId } = body;
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' }, 
        { status: 400 }
      );
    }

    // Create or get chat session
    let chatSession;
    try {
      if (chatSessionId) {
        // Find existing chat session
        chatSession = await prisma.chatSession.findUnique({ 
          where: { 
            id: chatSessionId,
            user: { email: session.user.email } // Ensure user owns the session
          } 
        });

        if (!chatSession) {
          return NextResponse.json(
            { error: 'Chat session not found or access denied' }, 
            { status: 404 }
          );
        }
        
        // Update the session's updatedAt timestamp
        await prisma.chatSession.update({
          where: { id: chatSessionId },
          data: { updatedAt: new Date() },
        });
      } else {
        // Create a new chat session
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Extract a title from the first message (first 30 chars)
        const title = message.length > 30 
          ? `${message.substring(0, 27)}...` 
          : message;
          
        chatSession = await prisma.chatSession.create({
          data: {
            title,
            userId: user.id,
          },
        });
      }
    } catch (error) {
      return handleApiError(error, 'Failed to create or retrieve chat session');
    }

    // Save the user message to the database
    try {
      await prisma.chatMessage.create({
        data: {
          content: message,
          role: 'USER',
          chatSessionId: chatSession.id,
        },
      });
    } catch (error) {
      return handleApiError(error, 'Failed to save user message');
    }

    // Get previous messages for context
    let previousMessages: any[] = [];
    try {
      previousMessages = await prisma.chatMessage.findMany({
        where: { 
          chatSessionId: chatSession.id,
          role: { in: ['USER', 'ASSISTANT'] } // Only include user and assistant messages
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_CONTEXT_MESSAGES,
        select: {
          content: true,
          role: true,
        },
      });
      
      // Reverse to get chronological order
      previousMessages.reverse();
      
    } catch (error) {
      console.warn('Failed to retrieve previous messages:', error);
      // Continue without context if we can't get previous messages
    }

    // Format messages for the AI model
    const formattedMessages: ChatMessage[] = [
      SYSTEM_MESSAGE,
      ...previousMessages.map(msg => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = '';
        let useLocalBackend = true;
        
        // Send initial SSE format
        controller.enqueue(encoder.encode('event: start\ndata: {}\n\n'));
        
        try {
          // Check if local API is available
          useLocalBackend = await checkLocalApiAvailability();
          console.log(`Using ${useLocalBackend ? 'local' : 'OpenAI'} backend for chat`);
          
          // Extract user profile data if available (for local backend)
          let userProfile = {};
          // Extract user profile data from database if available
          try {
            const userRecord = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { 
                id: true,
                name: true,
                // Only include fields that exist in the User model
                // Add other fields as needed, ensure they exist in the Prisma schema
              },
            });
            
            if (userRecord) {
              userProfile = userRecord;
            }
          } catch (error) {
            console.warn('Could not fetch user profile data:', error);
          }
          
          // Process the AI response stream
          if (useLocalBackend) {
            // Use local FastAPI backend with Ollama
            for await (const chunk of streamLocalChatCompletion(
              message, 
              userProfile,
              chatSession.id
            )) {
              fullResponse += chunk;
              
              // Send the chunk to the client with source indicator
              const data = JSON.stringify({ content: chunk, source: 'ollama' });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          } else {
            // Fallback to OpenAI
            for await (const chunk of streamChatCompletion(formattedMessages)) {
              fullResponse += chunk;
              
              // Send the chunk to the client with source indicator
              const data = JSON.stringify({ content: chunk, source: 'openai' });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          
          // Save the assistant's response to the database
          if (fullResponse.trim()) {
            await prisma.chatMessage.create({
              data: {
                content: fullResponse,
                role: 'ASSISTANT',
                chatSessionId: chatSession.id,
              },
            });
          }
          
          // Send completion signal
          const doneData = JSON.stringify({ done: true, source: useLocalBackend ? 'ollama' : 'openai' });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          controller.close();
          
        } catch (error) {
          console.error(`Error in ${useLocalBackend ? 'local' : 'OpenAI'} chat stream:`, error);
          const errorData = JSON.stringify({ 
            error: 'An error occurred while generating the response',
            details: error instanceof Error ? error.message : String(error)
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
      cancel() {
        // Handle cancellation
        console.log('Chat stream was cancelled');
      },
    });

    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    return handleApiError(error, 'Failed to process chat message');
  }
}

// Get chat history
interface ChatHistoryResponse {
  messages: Array<{
    id: string;
    content: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    createdAt: Date;
    updatedAt: Date;
    chatSessionId: string;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const chatSessionId = searchParams.get('chatSessionId');

    if (!chatSessionId) {
      return NextResponse.json(
        { error: 'chatSessionId is required' }, 
        { status: 400 }
      );
    }
    
    // Verify user owns the chat session
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: chatSessionId,
        user: { email: session.user.email },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found or access denied' },
        { status: 404 }
      );
    }

    // Get chat messages
    const messages = await prisma.chatMessage.findMany({
      where: { 
        chatSessionId,
        role: { in: ['USER', 'ASSISTANT'] } // Only include user and assistant messages
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
        chatSessionId: true,
      },
    });

    // Map to the expected response type
    const response: ChatHistoryResponse = {
      messages: messages.map(msg => ({
        ...msg,
        role: msg.role as 'USER' | 'ASSISTANT',
        updatedAt: new Date() // Add a default updatedAt since it's not in the database
      }))
    };

    return NextResponse.json(response);
    
  } catch (error) {
    return handleApiError(error, 'Failed to fetch chat history');
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from Prisma:', disconnectError);
    }
  }
}
