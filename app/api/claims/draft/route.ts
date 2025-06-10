import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ClaimStatus } from '@prisma/client';

// Define TypeScript interfaces for the request body
interface DraftRequest {
  id?: string;
  claimNumber?: string;
  status?: string;
  insurancePlanId?: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientDOB?: string;
  patientGender?: string;
  patientAddress?: string;
  patientCity?: string;
  patientState?: string;
  patientZip?: string;
  patientPhone?: string;
  providerName?: string;
  providerNPI?: string;
  providerTaxId?: string;
  providerAddress?: string;
  providerCity?: string;
  providerState?: string;
  providerZip?: string;
  specimenId?: string;
  collectionDate?: string;
  receivedDate?: string;
  biomarkers?: any[];
  claimLines?: any[];
  [key: string]: any; // For any additional fields
}

// Helper function to validate draft data
function validateDraftData(data: DraftRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields validation
  if (!data.patientFirstName?.trim()) {
    errors.push('Patient first name is required');
  }
  
  if (!data.patientLastName?.trim()) {
    errors.push('Patient last name is required');
  }
  
  if (!data.insurancePlanId?.trim()) {
    errors.push('Insurance plan is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const data: DraftRequest = await req.json();
    
    // Validate the request data
    const { isValid, errors } = validateDraftData(data);
    if (!isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors 
        }, 
        { status: 400 }
      );
    }
    
    // Prepare the draft data for Prisma
    const draftData = {
      userId,
      draftName: data.claimNumber ? `Draft: ${data.claimNumber}` : 'Untitled Draft',
      draftData: data,
      lastEditedSection: 'general',
      
      // Patient information
      patientFirstName: data.patientFirstName,
      patientLastName: data.patientLastName,
      patientDOB: data.patientDOB ? new Date(data.patientDOB) : null,
      patientGender: data.patientGender,
      patientAddress: data.patientAddress,
      patientCity: data.patientCity,
      patientState: data.patientState,
      patientZip: data.patientZip,
      patientPhone: data.patientPhone,
      
      // Provider information
      providerName: data.providerName,
      providerNPI: data.providerNPI,
      providerTaxId: data.providerTaxId,
      providerAddress: data.providerAddress,
      providerCity: data.providerCity,
      providerState: data.providerState,
      providerZip: data.providerZip,
      
      // Specimen information
      specimenId: data.specimenId,
      collectionDate: data.collectionDate ? new Date(data.collectionDate) : null,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
      
      // Claim information
      insurancePlanId: data.insurancePlanId,
      
      // Store complex data as JSON
      biomarkers: data.biomarkers || null,
      claimLines: data.claimLines || [],
      draftData: data as any // Store as Prisma.JsonValue
    };
    
    let draft;
    
    // Handle update or create
    if (data.id) {
      // Verify the draft belongs to the user
      const existingDraft = await prisma.claimDraft.findFirst({
        where: {
          id: data.id,
          userId: userId
        }
      });
      
      if (!existingDraft) {
        return NextResponse.json(
          { error: 'Draft not found or access denied' }, 
          { status: 404 }
        );
      }
      
      // Update existing draft
      const updateData: any = {
        ...draftData,
        updatedAt: new Date(),
        lastAutoSave: new Date(),
        biomarkers: data.biomarkers || null,
        claimLines: data.claimLines || [],
        draftData: data as any
      };
      
      // Remove undefined values to avoid Prisma errors
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      
      draft = await prisma.claimDraft.update({
        where: { id: data.id },
        data: updateData
      });
    } else {
      // Create new draft
      const createData: any = {
        ...draftData,
        lastAutoSave: new Date(),
        biomarkers: data.biomarkers || null,
        claimLines: data.claimLines || [],
        draftData: data as any
      };
      
      // Remove undefined values to avoid Prisma errors
      Object.keys(createData).forEach(key => createData[key] === undefined && delete createData[key]);
      
      draft = await prisma.claimDraft.create({
        data: createData
      });
    }
    
    return NextResponse.json({ 
      id: draft.id,
      message: 'Draft saved successfully',
      updatedAt: draft.updatedAt
    });
    
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save draft', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET handler to retrieve user's drafts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const drafts = await prisma.claimDraft.findMany({
      where: { 
        userId: session.user.id,
        // Optionally filter out drafts older than 30 days
        // updatedAt: {
        //   gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        // }
      },
      orderBy: { 
        updatedAt: 'desc' 
      },
      select: {
        id: true,
        draftName: true,
        updatedAt: true,
        lastAutoSave: true,
        insurancePlanId: true,
        patientFirstName: true,
        patientLastName: true,
        patientDOB: true
      }
    });
    
    return NextResponse.json(drafts);
    
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch drafts', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
