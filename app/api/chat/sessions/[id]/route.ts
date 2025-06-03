import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

interface Params {
  params: {
    id: string;
  };
}

/**
 * GET /api/chat/sessions/[id]
 * Get a specific chat session with its messages
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the chat session with messages, ensuring it belongs to the user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error('Error in GET /api/chat/sessions/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PATCH /api/chat/sessions/[id]
 * Update a chat session (currently only supports changing the title)
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the request body
    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
    }

    // Update the chat session, ensuring it belongs to the user
    const updatedChatSession = await prisma.chatSession.updateMany({
      where: {
        id,
        userId: user.id,
      },
      data: {
        title,
        updatedAt: new Date(),
      },
    });

    if (updatedChatSession.count === 0) {
      return NextResponse.json({ error: 'Chat session not found or unauthorized' }, { status: 404 });
    }

    // Fetch the updated session to return
    const chatSession = await prisma.chatSession.findUnique({
      where: { id },
      include: { messages: true },
    });

    return NextResponse.json(chatSession);
  } catch (error) {
    console.error('Error in PATCH /api/chat/sessions/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/chat/sessions/[id]
 * Delete a chat session and all its messages
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the chat session, ensuring it belongs to the user
    // Messages will be automatically deleted due to the cascading delete in the Prisma schema
    const deletedChatSession = await prisma.chatSession.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (deletedChatSession.count === 0) {
      return NextResponse.json({ error: 'Chat session not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat/sessions/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
