import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { encryptData } from './encryption';
import { logAuditEvent } from './auditLogger';

// Session timeout in minutes (configurable via environment variable, default 30 minutes)
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);
const IDLE_TIMEOUT = parseInt(process.env.IDLE_TIMEOUT_MINUTES || '15', 10);

// Track active sessions in memory (in production, consider using Redis or similar)
const activeSessions = new Map<string, { lastActivity: number; userId: string }>();

interface SessionData {
  sessionId: string;
  userId: string;
  expires: number;
  lastActivity: number;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Creates a new secure session for the user
 */
export const createSession = async (userId: string, userAgent?: string, ipAddress?: string): Promise<string> => {
  const sessionId = uuidv4();
  const now = Date.now();
  const expires = now + SESSION_TIMEOUT * 60 * 1000; // Convert minutes to milliseconds
  
  const sessionData: SessionData = {
    sessionId,
    userId,
    expires,
    lastActivity: now,
    userAgent,
    ipAddress,
  };
  
  // Encrypt session data before storing in cookie
  const encryptedSession = encryptData(sessionData);
  
  // Set secure, httpOnly cookie
  cookies().set('secure_session', encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: new Date(expires),
  });
  
  // Store in memory (or Redis in production)
  activeSessions.set(sessionId, { lastActivity: now, userId });
  
  // Log the session creation
  await logAuditEvent({
    userId,
    action: 'LOGIN',
    resourceType: 'SESSION',
    resourceId: sessionId,
    ipAddress,
    userAgent,
  });
  
  return sessionId;
};

/**
 * Validates a session and updates last activity
 */
export const validateSession = async (request: NextRequest): Promise<{ valid: boolean; userId?: string; sessionId?: string }> => {
  const sessionCookie = request.cookies.get('secure_session');
  
  if (!sessionCookie?.value) {
    return { valid: false };
  }
  
  try {
    // In a real implementation, you would decrypt the session cookie here
    // For now, we'll use next-auth's getToken
    const token = await getToken({ req: request });
    
    if (!token) {
      return { valid: false };
    }
    
    const sessionId = token.sessionId as string;
    const session = activeSessions.get(sessionId);
    const now = Date.now();
    
    // Check if session exists and is not expired
    if (!session || (token.exp && token.exp * 1000 < now)) {
      // Clean up expired session
      activeSessions.delete(sessionId);
      return { valid: false };
    }
    
    // Check idle timeout
    if (now - session.lastActivity > IDLE_TIMEOUT * 60 * 1000) {
      await endSession(sessionId, token.sub || 'unknown');
      return { valid: false };
    }
    
    // Update last activity
    session.lastActivity = now;
    activeSessions.set(sessionId, session);
    
    return { 
      valid: true, 
      userId: token.sub,
      sessionId
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false };
  }
};

/**
 * Ends a user session
 */
export const endSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    // Remove from active sessions
    activeSessions.delete(sessionId);
    
    // Clear the session cookie
    cookies().delete('secure_session');
    
    // Log the session end
    await logAuditEvent({
      userId,
      action: 'LOGOUT',
      resourceType: 'SESSION',
      resourceId: sessionId,
    });
  } catch (error) {
    console.error('Error ending session:', error);
  }
};

/**
 * Middleware to protect API routes with session validation
 */
export const withSession = (handler: Function) => {
  return async (req: NextRequest, ...args: any[]) => {
    const { valid, userId } = await validateSession(req);
    
    if (!valid) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired session' },
        { status: 401 }
      );
    }
    
    // Add userId to the request object for use in the route handler
    (req as any).userId = userId;
    
    return handler(req, ...args);
  };
};

/**
 * Gets all active sessions for a user
 */
export const getUserSessions = (userId: string) => {
  return Array.from(activeSessions.entries())
    .filter(([_, session]) => session.userId === userId)
    .map(([sessionId, session]) => ({
      sessionId,
      lastActivity: new Date(session.lastActivity),
      isCurrent: false, // Would need to compare with current session
    }));
};

/**
 * Ends all sessions for a user (useful for password resets, etc.)
 */
export const endAllUserSessions = async (userId: string) => {
  const userSessions = Array.from(activeSessions.entries())
    .filter(([_, session]) => session.userId === userId);
  
  for (const [sessionId] of userSessions) {
    await endSession(sessionId, userId);
  }
  
  return userSessions.length;
};
