import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

interface AuthToken {
  exp?: number;
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
  iat?: number;
  jti?: string;
  rememberMe?: boolean; // Added for Remember Me functionality
}

// Add debug logging in development
const debug = process.env.NODE_ENV === 'development' ? console.log : () => {}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiAuthRoute = pathname.startsWith('/api/auth/')
  const isPublicFile = /\.[^/]+$/.test(pathname)
  const isDev = process.env.NODE_ENV === 'development'
  // Public routes
  const publicPaths = [
    '/auth/login', 
    '/auth/register', 
    '/auth/error', 
    '/auth/debug-login', // Add our debug login page
    '/_error'
  ]
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // DEVELOPMENT ONLY: Allow access to all paths during development for testing
  // if (isDev) {
  //   console.log('Development mode: Allowing access to all paths for testing (TEMP DISABLED FOR DEMO AUTH TEST)');
  //   return NextResponse.next();
  // }
  
  debug('Middleware processing:', { 
    pathname, 
    isApiAuthRoute, 
    isPublicFile, 
    isPublicPath,
    url: request.url 
  })

  debug(`[Path Check for ${pathname}]: isApiAuthRoute=${isApiAuthRoute}, startsWithNext=${pathname.startsWith('/_next')}, isPublicFile=${isPublicFile}`);

  // Skip middleware for NextAuth API routes, static files (except ocr-test.html), and _next paths
  if (isApiAuthRoute || pathname.startsWith('/_next') || (isPublicFile && pathname !== '/ocr-test.html')) {
    debug('Skipping middleware for NextAuth API, static, or _next path:', pathname);
    return NextResponse.next();
  }

  // Declare token variable outside the try block so it's available throughout the middleware
  let token: AuthToken | null = null;
  
  // Get token with more detailed debugging
  try {
    // Get raw token string for debugging purposes
    const rawToken = await getToken({ 
      req: request,
      // HIPAA-SECURITY-ISSUE: In production, use only environment variable
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-replace-in-production',
      secureCookie: process.env.NODE_ENV === 'production',
      raw: true
    });
    
    debug('Raw token value:', rawToken);
    debug('Request cookies:', request.cookies.getAll());
    
    // Attempt to get parsed token
    token = await getToken({ 
      req: request,
      // HIPAA-SECURITY-ISSUE: In production, use only environment variable
      secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-replace-in-production',
      secureCookie: process.env.NODE_ENV === 'production'
    }) as AuthToken | null;
    
    debug('Parsed token:', token);
  } catch (error) {
    debug('Error getting token:', error);
    // Check if token exists and handle protected routes
  }
  
  debug('Token info:', { 
    hasToken: !!token,
    expires: token?.exp ? new Date(token.exp * 1000).toISOString() : 'No expiration',
    rememberMe: token?.rememberMe,
    currentUrl: request.url,
    pathname,
    isPublicPath
  })

  // Handle token expiration for session management
  if (token?.exp) {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const isExpired = token.exp < currentTimestamp;
    
    // Enhanced session security - check if this is a non-remembered session from a previous browser session
    // This implements browser-session-only cookies for non-remembered sessions
    const browserSessionKey = 'next-auth.browser-session';
    const storedSessionId = request.cookies.get(browserSessionKey)?.value;
    const userIdentifierFromToken = token.sub; // User's ID from token (standard JWT subject claim)

    // Condition for invalidating session on protected paths if rememberMe is false
    const shouldInvalidateSession = token.rememberMe === false && 
                              !isPublicPath && 
                              userIdentifierFromToken && 
                              (!storedSessionId || storedSessionId !== userIdentifierFromToken);
    
    // Log what would have happened with the normal logic
    const wouldInvalidate = token.rememberMe === false && 
                           !isPublicPath && 
                           userIdentifierFromToken && 
                           (!storedSessionId || storedSessionId !== userIdentifierFromToken);
    
    debug('Session validation:', { 
      isExpired, 
      shouldInvalidateSession,
      userIdentifierInToken: userIdentifierFromToken, 
      browserSessionId: storedSessionId, 
      rememberMe: token.rememberMe 
    });
    
    // Only redirect to login if token is expired or should be invalidated
    if (isExpired || shouldInvalidateSession) {
      debug('Token expired or session invalidated, redirecting to login');
      const callbackUrl = new URL('/auth/login', request.url);
      if (isExpired) {
        callbackUrl.searchParams.set('error', 'SessionExpired');
      }
      callbackUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(callbackUrl);
    }
  }

  // If token doesn't exist and route requires auth, redirect to login
  if (!token && !isPublicPath) {
    debug('No token found, redirecting to login');
    // Get the callback URL for post-login redirect 
    const callbackUrl = new URL('/auth/login', request.url);
    callbackUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(callbackUrl);
  }

  // Handle auth pages
  if (isPublicPath) {
    // Skip session validation for public paths like login/register
    // But still redirect to dashboard if logged in (unless we're invalidating the session)
    if (token) {
      // === BEGIN NEW LOGIC ===
      const browserSessionKey = 'next-auth.browser-session';
      const storedSessionId = request.cookies.get(browserSessionKey)?.value;
      const userIdentifierFromToken = token.sub; // User's ID from token (standard JWT subject claim)

      const mustInvalidateNonRememberedSession = 
        token.rememberMe === false && 
        userIdentifierFromToken && 
        !storedSessionId;

      if (mustInvalidateNonRememberedSession) {
        debug('Non-remembered session on public path without browser cookie. Invalidating and staying on page.');
        const response = NextResponse.next(); // Stay on the current public page

        // Determine session token cookie name based on environment
        const sessionTokenCookieName = process.env.NODE_ENV === 'production' 
          ? '__Secure-next-auth.session-token' 
          : 'next-auth.session-token';

        response.cookies.delete(sessionTokenCookieName);
        response.cookies.delete(browserSessionKey);
        
        return response;
      }
      // === END NEW LOGIC ===
      // We're on a public path (like login) with a token, but we need to check if we're in the
      // process of redirecting due to session invalidation
      const isRedirectingForInvalidSession = pathname === '/auth/login' && 
        request.nextUrl.searchParams.has('callbackUrl');
      
      // If we're not redirecting for session invalidation, and we have a token on a public path,
      // redirect to dashboard
      if (!isRedirectingForInvalidSession) {
        debug('User is logged in on public path - redirecting to dashboard');
        // Don't redirect if already on the dashboard
        if (pathname === '/dashboard') {
          return NextResponse.next()
        }
        const url = new URL('/dashboard', request.url)
        return NextResponse.redirect(url)
      }
    }
    
    // For public paths, allow access
    debug('Allowing access to public path:', pathname);
    return NextResponse.next()
  }

  // Handle protected routes
  if (!token) {
    debug('No token found, redirecting to login')
    // Store the current URL for redirecting back after login
    const loginUrl = new URL('/auth/login', request.url)
    if (pathname !== '/' && pathname !== '/dashboard') {
      loginUrl.searchParams.set('callbackUrl', pathname)
      debug('Setting callback URL:', pathname)
    } else {
      loginUrl.searchParams.set('callbackUrl', '/dashboard')
    }
    debug('Redirecting to login:', loginUrl.toString())
    return NextResponse.redirect(loginUrl)
  }

  // Check token expiration
  if (token?.exp) {
    const now = Math.floor(Date.now() / 1000)
    const buffer = 5 * 60 // 5 minute buffer for clock skew
    
    debug('Token expiration check:', {
      now: new Date(now * 1000).toISOString(),
      expires: new Date(token.exp * 1000).toISOString(),
      isExpired: token.exp < now - buffer
    })
    
    if (token.exp < now - buffer) {
      // Token has expired, clear it and redirect to login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'SessionExpired')
      loginUrl.searchParams.set('callbackUrl', pathname)
      
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete({
        name: '__Secure-next-auth.session-token',
        path: '/',
      })
      
      return response
    }
  }

  // Add security headers to all responses
  let response: NextResponse
  
  // Handle dashboard redirect
  if (pathname === '/') {
    debug('Root path requested, redirecting to dashboard')
    response = NextResponse.redirect(new URL('/dashboard', request.url))
  } else {
    response = NextResponse.next()
  }
  
  // Security headers - less restrictive for development
  const securityHeaders = isDev ? {
    // Development headers - more permissive
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  } : {
    // Production headers - more strict
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    // More permissive CSP for NextAuth to work properly
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http://localhost:3000;"
  }

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (All API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon\.ico).*)',
  ],
}
