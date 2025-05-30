import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * API route to set/clear session tracking cookies
 * 
 * This is needed because HttpOnly cookies can't be set from client-side JavaScript
 * The route handles setting browser-session cookies for non-remembered sessions
 * and clearing them for remembered sessions [SF, SFT]
 */
export async function POST(req: NextRequest) {
  try {
    console.log('track-session API called');
    
    // Verify that the request is authenticated [SFT]
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Get request body first so we can see what was attempted even if auth fails
    let body;
    try {
      body = await req.json();
      console.log('Request body:', { ...body, sessionId: body?.sessionId ? '[PRESENT]' : '[MISSING]' });
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new NextResponse(JSON.stringify({ error: 'Invalid JSON in request body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Now check authentication
    if (!token) {
      console.log('Unauthorized request to track-session API');
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { sessionId, rememberMe } = body;
    
    if (!sessionId) {
      console.error('Session ID is missing in request');
      return new NextResponse(JSON.stringify({ error: 'Session ID is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create response with appropriate headers
    const response = NextResponse.json({ 
      success: true,
      message: rememberMe ? 'Cleared browser session cookie' : 'Set browser session cookie',
      sessionId: sessionId.substring(0, 5) + '...' // Only log prefix for security
    });
    
    // Session cookie name [CMV]
    const cookieName = 'next-auth.browser-session';
    
    if (rememberMe === true) {
      // For remembered sessions, we clear the browser session cookie
      // by setting it with an expiration date in the past
      console.log('Setting remembered session (clearing browser session cookie)');
      response.cookies.set(cookieName, '', {
        expires: new Date(0), // Set expiration to epoch time (1970-01-01)
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      });
    } else {
      // For non-remembered sessions, set a browser-session cookie (no expiry)
      // This will be automatically deleted when the browser is closed
      console.log('Setting non-remembered session (with browser session cookie)');
      response.cookies.set(cookieName, sessionId, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
        // No expiry = browser session cookie
      });
    }
    
    // Log all cookies being set for debugging
    console.log('Cookies in response:', response.cookies.getAll().map(c => c.name));
    
    return response;
  } catch (error) {
    console.error('Error in track-session API route:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
