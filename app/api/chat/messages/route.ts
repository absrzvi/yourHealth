import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { streamChatCompletion } from '@/lib/ai/chat';

// Types for chat messages
type ChatMessageRole = 'system' | 'user' | 'assistant';
type ChatMessageType = 'text' | 'chart' | 'dashboard' | 'error';
type ChatMessageStatus = 'sending' | 'sent' | 'error';

interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  name?: string;
}

// Extended type for our database message
interface DatabaseChatMessage {
  id: string;
  chatSessionId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  type: ChatMessageType;
  status: ChatMessageStatus;
  llmProvider: string | null;
  llmModel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const MAX_CONTEXT_MESSAGES = 20;

// GET /api/chat/messages - Get messages for a chat session
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
    const sessionId = searchParams.get('sessionId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify the chat session belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user: { email: session.user.email },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Get messages with cursor-based pagination
    const messages = await prisma.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: 'asc' },
      take: limit + 1, // Take one extra to check if there are more
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    // Check if there are more messages
    let nextCursor = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({
      messages,
      nextCursor,
    });
    
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/messages - Create a new message and get AI response
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { 
      sessionId, 
      content, 
      role = 'USER',
      type = 'text',
      llmProvider = null,
      llmModel = null,
    } = await req.json();

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: 'Session ID and content are required' },
        { status: 400 }
      );
    }

    // Verify the chat session belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user: { email: session.user.email },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: MAX_CONTEXT_MESSAGES,
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Create the new message using Prisma's create method
    const message = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: role as 'USER' | 'ASSISTANT' | 'SYSTEM',
        content,
        type: type as ChatMessageType,
        status: 'sent',
        llmProvider,
        llmModel,
      },
      select: {
        id: true,
        chatSessionId: true,
        role: true,
        content: true,
        type: true,
        status: true,
        llmProvider: true,
        llmModel: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update the session's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    // If this is not a user message, return the created message
    if (role !== 'USER') {
      return NextResponse.json({ message });
    }

    // For user messages, generate an AI response
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.'
      },
      ...chatSession.messages
        .filter((msg): msg is DatabaseChatMessage => 
          (msg.role === 'USER' || msg.role === 'ASSISTANT') && 
          typeof msg.content === 'string'
        )
        .map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content
        })),
      {
        role: 'user',
        content
      }
    ];

    // Create a streaming response for the AI
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullResponse = '';
        let assistantMessageId: string | null = null;
        
        try {
          // Create a placeholder for the assistant's message
          const assistantMessage = await prisma.chatMessage.create({
            data: {
              chatSessionId: sessionId,
              role: 'ASSISTANT',
              content: '',
              type: 'text',
              status: 'sending',
              llmProvider,
              llmModel,
            },
            select: {
              id: true,
            },
          });
          
          assistantMessageId = assistantMessage.id;
          
          if (!assistantMessageId) {
            throw new Error('Failed to create assistant message');
          }
          
          // Send the initial response with the message ID
          controller.enqueue(
            encoder.encode(`event: start\ndata: ${JSON.stringify({ messageId: assistantMessageId })}\n\n`)
          );
          
          // Stream the AI response
          for await (const chunk of streamChatCompletion(messages)) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
            );
          }

          // Update the assistant's message with the full response
          if (fullResponse.trim() && assistantMessageId) {
            await prisma.chatMessage.update({
              where: { id: assistantMessageId },
              data: {
                content: fullResponse,
                status: 'sent',
              },
            });
            
            // Send completion event
            controller.enqueue(
              encoder.encode(`event: done\ndata: {}\n\n`)
            );
          }
          
          controller.close();
        } catch (error) {
          console.error('Error in chat streaming:', error);
          
          // If we have an assistant message, mark it as failed
          if (assistantMessageId) {
            await prisma.chatMessage.update({
              where: { id: assistantMessageId },
              data: {
                content: 'Error generating response. Please try again.',
                type: 'error',
                status: 'error',
              },
            });
            
            // Send error event
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`)
            );
          } else {
            // If we don't have an assistant message ID, still send an error event
            controller.enqueue(
              encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Failed to initialize chat' })}\n\n`)
            );
          }
          
          controller.close();
        }
      },
      
      cancel: () => {
        // Clean up if the client disconnects
        console.log('Client disconnected from chat stream');
      }
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
    console.error('Error in chat message creation:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
