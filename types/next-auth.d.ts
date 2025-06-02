import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      rememberMe?: boolean;
    };
    rememberMe?: boolean;
    expires: string;
    debug?: {
      tokenExpires: string;
      rememberMe: boolean;
      timestamp: string;
    };
  }

  /**
   * Extend the built-in user types
   */
  interface User extends DefaultUser {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    rememberMe?: boolean;
  }

  /**
   * Extend the JWT token type
   */
  interface JWT {
    id: string;
    email?: string;
    name?: string | null;
    rememberMe: boolean;
    exp?: number;
    iat?: number;
    jti?: string;
  }
}
