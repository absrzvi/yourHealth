import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

type ChatSessionResponse = {
  id: string;
  title: string;
  updatedAt: Date;
  messageCount: number;
};

// GET /api/chat/sessions - Get all chat sessions for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const sessions = await prisma.chatSession.findMany({
      where: { 
        user: { email: session.user.email },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    // Format the response
    const response: ChatSessionResponse[] = sessions.map(session => ({
      id: session.id,
      title: session.title,
      updatedAt: session.updatedAt,
      messageCount: session._count.messages,
    }));

    return NextResponse.json({ sessions: response });
    
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions - Create a new chat session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { title = 'New Chat' } = await req.json();
    
    // Get the user
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

    // Create a new chat session
    const newSession = await prisma.chatSession.create({
      data: {
        title,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      session: {
        ...newSession,
        messageCount: 0,
      },
    });
    
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/sessions - Delete a chat session
export async function DELETE(req: NextRequest) {
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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        user: { email: session.user.email },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the chat session and all its messages (cascading delete)
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
