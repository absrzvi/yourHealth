import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const sessionId = searchParams.get('sessionId');

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Build the search query
    const where: any = {
      userId: session.user.id,
      content: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (sessionId) {
      where.chatSessionId = sessionId;
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit results
      include: {
        chatSession: true,
      },
    });

    return NextResponse.json({ results: messages });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
