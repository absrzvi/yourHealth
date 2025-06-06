import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EDI837Generator } from '@/lib/claims/edi/generator';

export async function POST(
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
    
    // Fetch claim with required relations
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        insurancePlan: true,
        claimLines: true
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

    // Generate EDI content
    const generator = new EDI837Generator();
    
    // Handle potential type mismatches by mapping to expected structure
    const claimForEdi = {
      ...claim,
      // Map any renamed fields as needed (like termDate to terminationDate)
      insurancePlan: {
        ...claim.insurancePlan,
        terminationDate: claim.insurancePlan.termDate
      }
    };
    
    const ediContent = generator.generateFromClaim(claimForEdi as any);

    // Create a unique filename for the EDI file
    const fileName = `claim_${claim.id}_${Date.now()}.edi`;
    const ediPath = `/edi/${fileName}`;
    
    // Check if we have an EDI model in the database schema
    let ediFile: any = null;
    try {
      // Update the claim with the EDI file location
      await prisma.claim.update({
        where: { id: claim.id },
        data: {
          ediFileLocation: ediPath,
        },
      });

      // Try to save EDI content to database using Prisma client with type casting
      // @ts-ignore - Using type casting to handle new model that TypeScript may not recognize yet
      ediFile = await (prisma as any).ediFile.create({
        data: {
          fileName,
          filePath: ediPath,
          content: ediContent,
          claimId: claim.id
        },
      });
    } catch (error) {
      console.error('Error saving EDI file to database:', error);
      // If we can't save to the EDI model, continue without it - we'll return the content anyway
    }

    return NextResponse.json({ 
      message: 'EDI file generated successfully', 
      ediContent,
      filePath: ediPath,
      fileName,
      createdAt: ediFile?.createdAt
    });
  } catch (error: any) {
    console.error('Error generating EDI:', error);
    return new NextResponse(
      JSON.stringify({ 
        message: 'Failed to generate EDI file', 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
