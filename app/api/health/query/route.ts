import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import axios from 'axios';

// Environment variables
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000';

/**
 * Health query API route
 * Forwards health-specific queries to our local FastAPI backend
 */
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

    const { query, sources = [], chatSessionId } = body;
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' }, 
        { status: 400 }
      );
    }

    // Get user information for context
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        name: true,
        // Add other relevant fields as needed
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Save query to database if we have a chat session
    let userMessage;
    if (chatSessionId) {
      // Verify user owns the chat session
      const chatSession = await prisma.chatSession.findFirst({
        where: {
          id: chatSessionId,
          userId: user.id,
        },
      });

      if (!chatSession) {
        return NextResponse.json(
          { error: 'Chat session not found or access denied' },
          { status: 404 }
        );
      }

      // Save user's query as a chat message
      userMessage = await prisma.chatMessage.create({
        data: {
          content: query,
          role: 'USER',
          chatSessionId,
        },
      });
    }
    
    try {
      // Call the local FastAPI backend
      const response = await axios.post(`${FASTAPI_BASE_URL}/health/query`, {
        query,
        sources,
        context: {
          user_id: user.id,
          user_profile: {
            name: user.name,
            // Add other useful profile information
          },
          session_id: chatSessionId
        }
      });

      // Save AI response if we have a chat session
      if (chatSessionId && response.data.response) {
        await prisma.chatMessage.create({
          data: {
            content: response.data.response,
            role: 'ASSISTANT',
            chatSessionId,
          },
        });
      }

      // Return the response from the backend
      return NextResponse.json(response.data);
      
    } catch (error: any) {
      console.error('Error calling FastAPI backend:', error);
      
      // If the FastAPI server is not available or returns an error
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        return NextResponse.json({ 
          error: 'Health query service error', 
          details: error.response.data 
        }, { status: error.response.status || 500 });
      } else if (error.request) {
        // The request was made but no response was received
        return NextResponse.json({ 
          error: 'Health query service unavailable',
          details: 'Could not connect to the health AI service. Please ensure the FastAPI server is running.'
        }, { status: 503 });
      }
      
      // Something else happened in making the request
      return NextResponse.json({ 
        error: 'Failed to process health query',
        details: error.message
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error in health query endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from Prisma:', disconnectError);
    }
  }
}
