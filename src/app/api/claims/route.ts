import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db';
import { ClaimsService } from '@/lib/claims';
import { ClaimsFilter, ClaimsPaginationOptions } from '@/lib/claims/types/claims.types';

export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const orderDirection = searchParams.get('orderDirection') === 'asc' ? 'asc' : 'desc';
    
    // Parse filter parameters
    const status = searchParams.get('status');
    const insurancePlanId = searchParams.get('insurancePlanId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const searchTerm = searchParams.get('search');

    const filter: ClaimsFilter = { userId };
    const pagination: ClaimsPaginationOptions = {
      page,
      pageSize,
      orderBy: orderBy as any,
      orderDirection,
    };

    if (status) filter.status = status as any;
    if (insurancePlanId) filter.insurancePlanId = insurancePlanId;
    if (dateFrom) filter.dateFrom = new Date(dateFrom);
    if (dateTo) filter.dateTo = new Date(dateTo);
    if (searchTerm) filter.searchTerm = searchTerm;

    const claimsService = new ClaimsService(prisma);
    const result = await claimsService.findClaims(filter, pagination, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const claimsService = new ClaimsService(prisma);
    
    // Add the userId from the session to the claim data
    const claimData = {
      ...body,
      userId, // Ensure the claim is associated with the authenticated user
    };

    const claim = await claimsService.createClaim(claimData, userId);
    
    return NextResponse.json(claim, { status: 201 });
  } catch (error: any) {
    console.error('Error creating claim:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }
    
    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function HEAD() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function OPTIONS() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
