import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET /api/chat/sessions/[id] - Get a specific chat session by ID with its messages
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('Unauthorized access attempt to chat session');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id } = params;
    console.log(`Fetching chat session ${id} for user ${session.user.email}`);
    
    // Fetch the session with its messages
    const chatSession = await prisma.chatSession.findUnique({
      where: { 
        id,
        user: { email: session.user.email },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            role: true,
            type: true,
            status: true,
            llmProvider: true,
            llmModel: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!chatSession) {
      console.log(`Chat session ${id} not found for user ${session.user.email}`);
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Format the response to match the ChatSession type expected by the frontend
    const response = {
      id: chatSession.id,
      title: chatSession.title,
      createdAt: chatSession.createdAt,
      updatedAt: chatSession.updatedAt,
      messages: chatSession.messages,
      messageCount: chatSession.messages.length,
    };

    console.log(`Successfully fetched chat session ${id} with ${chatSession.messages.length} messages`);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching chat session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
