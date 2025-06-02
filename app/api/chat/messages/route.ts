import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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

// POST /api/chat/messages - Create a new message
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
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Create the new message
    const message = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role,
        content,
        type,
        llmProvider,
        llmModel,
      },
    });

    // Update the session's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
    
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to create chat message' },
      { status: 500 }
    );
  }
}
