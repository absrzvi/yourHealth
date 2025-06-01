// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const userMessageContent = body.message; // Renamed for clarity

        if (!userMessageContent || typeof userMessageContent !== 'string') {
            return NextResponse.json({ error: 'Message is required and must be a string' }, { status: 400 });
        }

        // 1. Save User's Message
        // Assuming you have a way to identify the user, e.g., from session or a passed userId
        // For now, let's use a placeholder userId or handle it as anonymous
        const userId = 'placeholder-user-id'; // Replace with actual user ID logic
        // For now, using a placeholder. In a real app, this would come from the client
        // or be managed server-side (e.g., create a new session if none provided).
        const chatSessionId = body.chatSessionId || 'cmbdm942i0000itqiax5obb4l'; // Using actual ID from DB

        const userChatMessage = await prisma.chatMessage.create({
            data: {
                content: userMessageContent,
                role: 'USER',
                chatSessionId: chatSessionId,
                // userId: userId, // Uncomment if you have a userId field
            },
        });

        // 2. Generate Mocked AI Response
        const aiResponseContent = `Aria received: \"${userMessageContent}\". This is a mocked response.`; // Renamed for clarity

        // 3. Save AI's Message
        const aiChatMessage = await prisma.chatMessage.create({
            data: {
                content: aiResponseContent,
                role: 'ASSISTANT', // Using 'ASSISTANT' as a standard role for AI
                chatSessionId: chatSessionId,
                // userId: userId, // Associate with the same user
            },
        });

        // 4. Return AI's message
        return NextResponse.json({ 
            id: aiChatMessage.id,
            role: aiChatMessage.role,
            content: aiChatMessage.content,
            timestamp: aiChatMessage.createdAt // Assuming 'createdAt' is auto-generated
        }, { status: 200 });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        let errorMessage = 'Internal Server Error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json({ error: 'Failed to process chat message', details: errorMessage }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// You might also want a GET handler to fetch message history for a chat session,
// but let's focus on POST for now.
