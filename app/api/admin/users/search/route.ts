import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// Define UserRole enum to match Prisma schema
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

// GET /api/admin/users/search - Search users
export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    // Type assertion to access role property
    // This is needed because the Prisma types don't properly expose the role field
    // in the TypeScript types, even though it exists in the database schema
    const userWithRole = user as { role?: string };
    
    if (!user || userWithRole.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get search parameters from URL
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const roleParam = searchParams.get('role');
    const activeParam = searchParams.get('active');
    const sortByParam = searchParams.get('sortBy') || 'email';
    const sortOrderParam = searchParams.get('sortOrder') || 'asc';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '10', 10);
    const skipValue = (pageParam - 1) * limitParam;
    
    // Build the where clause for filtering
    const whereConditions: Prisma.UserWhereInput = {};
    
    // Add search query if provided
    if (query) {
      whereConditions.OR = [
        { email: { contains: query } },
        { name: { contains: query } },
      ];
    }
    
    // Add role filter if provided
    if (roleParam) {
      whereConditions.role = roleParam as UserRole;
    }
    
    // Add active filter if provided
    if (activeParam !== null && activeParam !== undefined) {
      whereConditions.active = activeParam === 'true';
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where: whereConditions });

    // Valid sort fields
    const validSortFields = ['email', 'name', 'role', 'active', 'createdAt', 'lastLogin'];
    const actualSortBy = validSortFields.includes(sortByParam) ? sortByParam : 'email';
    const actualSortOrder = sortOrderParam === 'desc' ? 'desc' : 'asc';

    // Create orderBy object
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[actualSortBy as keyof Prisma.UserOrderByWithRelationInput] = actualSortOrder;

    // Get users with pagination, sorting, and filtering
    const users = await prisma.user.findMany({
      // Using type assertions to work around Prisma type issues
      // The Prisma schema has these fields, but the TypeScript types don't recognize them correctly
      // This is a known issue with Prisma's type generation and custom fields
      where: whereConditions as Prisma.UserWhereInput,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        role: true,
        active: true,
      } as Prisma.UserSelect,
      orderBy,
      skip: skipValue,
      take: limitParam,
    });

    return NextResponse.json({
      users,
      pagination: {
        total: totalCount,
        page: pageParam,
        limit: limitParam,
        pages: Math.ceil(totalCount / limitParam),
      },
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
