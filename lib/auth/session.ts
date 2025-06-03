/**
 * Authentication Session Management
 * 
 * This module provides functions for handling user sessions
 * in both server and client contexts.
 */

import { getServerSession } from 'next-auth/next';
import { cookies } from 'next/headers';

/**
 * Get the current user session from server components
 */
export async function getSession() {
  try {
    // For demo purposes, return a mock session with user ID
    // In production, this would validate the session from cookies or tokens
    return {
      user: {
        id: 'sample-user-id',
        name: 'Demo User',
        email: 'demo@example.com'
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get a specific session value by key
 */
export async function getSessionValue(key: string) {
  const session = await getSession();
  if (!session) return null;
  
  return (session as any)[key] || null;
}

/**
 * Get the current user ID from the session
 */
export async function getUserId() {
  const session = await getSession();
  return session?.user?.id || null;
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Get session data on the client side
 */
export function getClientSession() {
  // This would typically use a client-side method like useSession() from next-auth
  // For demo purposes, return a mock session
  return {
    user: {
      id: 'sample-user-id',
      name: 'Demo User',
      email: 'demo@example.com'
    },
    isAuthenticated: true
  };
}
