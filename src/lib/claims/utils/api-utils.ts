import { NextRequest } from 'next/server';
import { ClaimsError, ValidationError } from '../types/claims.types';

/**
 * Validates the request body against a schema
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error: any) {
    // Format Zod validation errors into a more user-friendly format
    if (error.name === 'ZodError') {
      const fieldErrors = error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', fieldErrors);
    }
    throw new ClaimsError('Invalid request body', 'INVALID_REQUEST', 400);
  }
}

/**
 * Creates a standardized API response
 */
export function createApiResponse<T = any>(
  data: T,
  status = 200,
  options: { headers?: Record<string, string> } = {}
): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Creates an error response
 */
export function createErrorResponse(
  error: Error & { statusCode?: number; code?: string; field?: string },
  defaultMessage = 'An error occurred'
): Response {
  console.error('API Error:', error);
  
  const statusCode = error.statusCode || 500;
  const errorResponse: any = {
    error: {
      message: error.message || defaultMessage,
      code: error.code || 'INTERNAL_ERROR',
    },
  };

  // Add field validation errors if available
  if (error instanceof ValidationError && error.field) {
    errorResponse.error.field = error.field;
  }

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Validates user authentication
 */
export function validateAuth(userId: string | null): asserts userId is string {
  if (!userId) {
    throw new ClaimsError('Authentication required', 'UNAUTHORIZED', 401);
  }
}

/**
 * Validates user authorization for a resource
 */
export function validateOwnership(
  resourceUserId: string,
  currentUserId: string
): void {
  if (resourceUserId !== currentUserId) {
    throw new ClaimsError('Access denied', 'FORBIDDEN', 403);
  }
}
