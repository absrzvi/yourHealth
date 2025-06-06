import { NextRequest, NextResponse } from 'next/server';
import { ClaimsError, ValidationError } from '../types/claims.types';
import { createErrorResponse } from '../utils/api-utils';

type Handler = (request: NextRequest, context: any) => Promise<NextResponse>;

export function withApiHandler(handler: Handler) {
  return async (request: NextRequest, context: any) => {
    try {
      // Set CORS headers
      const response = await handler(request, context);
      
      // Add CORS headers to the response
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    } catch (error: any) {
      // Handle known error types
      if (error instanceof ClaimsError) {
        return createErrorResponse(error);
      }
      
      // Handle validation errors
      if (error.name === 'ZodError') {
        const validationError = new ValidationError(
          'Validation failed',
          error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
        return createErrorResponse(validationError);
      }
      
      // Handle Prisma errors
      if (error.code === 'P2002') {
        return createErrorResponse(
          new ValidationError('A record with this identifier already exists')
        );
      }
      
      // Handle other unexpected errors
      console.error('Unhandled API error:', error);
      return createErrorResponse(
        new ClaimsError('An unexpected error occurred', 'INTERNAL_SERVER_ERROR', 500)
      );
    }
  };
}

/**
 * Creates a GET handler with error handling
 */
export function createGetHandler<T>(
  handler: (req: NextRequest, context: any) => Promise<T>
) {
  return withApiHandler(async (req, context) => {
    const data = await handler(req, context);
    return NextResponse.json({ data });
  });
}

/**
 * Creates a POST handler with validation and error handling
 */
export function createPostHandler<T, S>(
  schema: { parse: (data: unknown) => S },
  handler: (data: S, req: NextRequest, context: any) => Promise<T>
) {
  return withApiHandler(async (req, context) => {
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await handler(validatedData, req, context);
    return NextResponse.json({ data }, { status: 201 });
  });
}

/**
 * Creates a PATCH handler with validation and error handling
 */
export function createPatchHandler<T, S>(
  schema: { parse: (data: unknown) => S },
  handler: (id: string, data: S, req: NextRequest, context: any) => Promise<T>
) {
  return withApiHandler(async (req, context) => {
    const { id } = context.params;
    const body = await req.json();
    const validatedData = schema.parse(body);
    const data = await handler(id, validatedData, req, context);
    return NextResponse.json({ data });
  });
}

/**
 * Creates a DELETE handler with error handling
 */
export function createDeleteHandler<T>(
  handler: (id: string, req: NextRequest, context: any) => Promise<T>
) {
  return withApiHandler(async (req, context) => {
    const { id } = context.params;
    const data = await handler(id, req, context);
    return NextResponse.json({ data });
  });
}
