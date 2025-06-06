import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized access' }),
        { status: 401 }
      );
    }

    const claimId = params.id;
    
    // Fetch claim to verify ownership
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      select: {
        userId: true,
        ediFileLocation: true,
      }
    });

    if (!claim) {
      return new NextResponse(
        JSON.stringify({ message: 'Claim not found' }),
        { status: 404 }
      );
    }

    // Ensure the claim belongs to the user
    if (claim.userId !== session.user.id) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized access to this claim' }),
        { status: 403 }
      );
    }

    // If no EDI file exists yet
    if (!claim.ediFileLocation) {
      return new NextResponse(
        JSON.stringify({ message: 'No EDI file exists for this claim' }),
        { status: 404 }
      );
    }

    // Fetch EDI content from EDI file table
    // @ts-ignore - Using type casting to handle new model that TypeScript may not recognize yet
    const ediFile = await (prisma as any).ediFile.findFirst({
      where: { 
        claimId: claimId 
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!ediFile) {
      return new NextResponse(
        JSON.stringify({ message: 'EDI file reference exists but content not found' }),
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'EDI file retrieved successfully', 
      ediContent: ediFile.content,
      filePath: ediFile.filePath,
      fileName: ediFile.fileName,
      createdAt: ediFile.createdAt
    });
  } catch (error: any) {
    console.error('Error fetching EDI content:', error);
    return new NextResponse(
      JSON.stringify({ 
        message: 'Failed to fetch EDI content', 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
