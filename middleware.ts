import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { validateSession } from './lib/security/sessionManager';
import { logAuditEvent } from './lib/security/auditLogger';

// HIPAA-SECURITY-ISSUE: Rate limiting is currently disabled for MVP
// TODO: For HIPAA compliance, implement proper rate limiting with Redis
// Required for protection against brute force and DoS attacks (HIPAA 164.308(a)(1))
let rateLimiter: Ratelimit | null = null;

try {
  // Only initialize if Redis environment variables are present
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    rateLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute per IP
      analytics: true,
    });
  } else {
    console.warn('Rate limiting is disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable.');
  }
} catch (error) {
  console.error('Failed to initialize rate limiter:', error);
}

// Paths that don't require authentication
const PUBLIC_PATHS = [
  '/auth',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/assets',
  '/health',
  '/api/health',
];

// Paths that should never be cached
const NO_CACHE_PATHS = [
  '/api',
  '/dashboard',
  '/profile',
];

// Security headers to add to all responses
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || '';
  const requestId = crypto.randomUUID();

  // Add request ID to headers for tracing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // HIPAA-SECURITY-ISSUE: Temporarily disabled audit logging in middleware
  // TODO: Implement Edge-compatible audit logging solution
  // await logAuditEvent({...});

  // Apply rate limiting to API routes if rate limiter is configured
  if (rateLimiter && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const { success } = await rateLimiter.limit(ip);
    
    if (!success) {
      console.warn('Rate limit exceeded:', { ip, pathname });
      // HIPAA-SECURITY-ISSUE: Temporarily disabled rate limit logging
      // TODO: Implement Edge-compatible audit logging solution

      return new NextResponse(JSON.stringify({ 
        error: 'Too many requests',
        requestId,
      }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }


  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    return addSecurityHeaders(NextResponse.next(), pathname);
  }

  // Check for NextAuth session
  const token = await getToken({ req: request });
  console.log('Middleware session check - Token exists:', !!token);
  
  if (!token) {
    // HIPAA-SECURITY-ISSUE: Temporarily disabled unauthorized access logging
    // TODO: Implement Edge-compatible audit logging solution

    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized',
          requestId,
        }), 
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }

  // Add user context to request headers for API routes
  if (pathname.startsWith('/api/') && token?.sub) {
    requestHeaders.set('x-user-id', token.sub);
  }

  // Create response object
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add security headers
  response = addSecurityHeaders(response, pathname);

  // Add no-cache headers for sensitive paths
  if (NO_CACHE_PATHS.some(path => pathname.startsWith(path))) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  // HIPAA-SECURITY-ISSUE: Temporarily disabled request completion logging
  // TODO: Implement Edge-compatible audit logging solution

  return response;
}

// Helper function to add security headers
function addSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  // Don't add security headers to _next or static files
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return response;
  }

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CSP header (configure based on your needs)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.yourdomain.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
