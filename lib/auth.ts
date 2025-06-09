import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Extend the built-in types for NextAuth
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      rememberMe?: boolean;  // Made optional to match User interface
      role?: string;  // User role (ADMIN or USER)
      active?: boolean; // User active status
    };
    rememberMe?: boolean;  // Made optional to match User interface
    expires: string;
    debug?: {
      tokenExpires: string;
      rememberMe: boolean;
      timestamp: string;
    };
  }

  /**
   * Extend the built-in user type
   */
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    rememberMe?: boolean;  // Made optional to match Session interface
    role?: string;  // User role (ADMIN or USER)
    active?: boolean; // User active status
  }

  /**
   * The shape of the JWT token
   */
  interface JWT {
    id: string;
    email?: string;
    name?: string | null;
    rememberMe: boolean;
    role?: string;  // User role (ADMIN or USER)
    active?: boolean; // User active status
    exp?: number;
    iat?: number;
    jti?: string;
    sub?: string;
    [key: string]: any; // Allow additional properties
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Add debug mode in development
  debug: true, // Force debug mode to see detailed logs
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember me", type: "checkbox" } // Good to define it here
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check if user is active
        if (user.active === false) {
          console.log(`Login attempt for inactive account: ${credentials.email}`);
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

        // Log the received rememberMe value from credentials
        console.log(`Authorize: Credentials received rememberMe: ${credentials.rememberMe}`);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          active: user.active,
          // Pass rememberMe from credentials; ensure it's a boolean
          rememberMe: String(credentials.rememberMe).toLowerCase() === 'true'
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Define a type-safe token interface
      interface SafeToken {
        id: string;
        email: string;
        name: string | null;
        rememberMe: boolean;
        role: string;
        active: boolean;
        exp: number;
        sub?: string;
        [key: string]: any; // Allow other properties
      }

      // Initial sign in
      if (user) {
        console.log('JWT callback - User signed in:', { 
          userId: user.id, 
          rememberMe: user.rememberMe,
          hasToken: !!token
        });
        
        // Create a new token object with proper typing and explicit type checking
        const safeToken: SafeToken = {
          ...token,
          // Ensure id is always a string
          id: (() => {
            if (typeof user.id === 'string') return user.id;
            if (typeof token.id === 'string') return token.id;
            if (typeof token.sub === 'string') return token.sub;
            return '';
          })(),
          // Ensure email is always a string
          email: (() => {
            if (typeof user.email === 'string') return user.email;
            if (typeof token.email === 'string') return token.email;
            return '';
          })(),
          // Name can be string or null
          name: (() => {
            if (typeof user.name === 'string') return user.name;
            if (token.name === null || typeof token.name === 'string') return token.name;
            return null;
          })(),
          // Remember me flag with explicit type checking
          rememberMe: (() => {
            if (typeof user.rememberMe === 'boolean') return user.rememberMe;
            if (typeof token.rememberMe === 'boolean') return token.rememberMe;
            return false;
          })(),
          // User role with explicit type checking
          role: (() => {
            if (typeof user.role === 'string') return user.role;
            if (typeof token.role === 'string') return token.role;
            return 'USER'; // Default role
          })(),
          // User active status with explicit type checking
          active: (() => {
            if (typeof user.active === 'boolean') return user.active;
            if (typeof token.active === 'boolean') return token.active;
            return true; // Default active status
          })(),
          // Expiration will be set below
          exp: 0,
          // Subject (sub) with fallback to id if available
          sub: (() => {
            if (typeof token.sub === 'string') return token.sub;
            if (typeof user.id === 'string') return user.id;
            if (typeof token.id === 'string') return token.id;
            return '';
          })()
        };
        
        // Set token expiration based on rememberMe
        const maxAge = safeToken.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
        safeToken.exp = Math.floor(Date.now() / 1000) + maxAge;
        
        console.log('JWT callback - Token created:', {
          userId: safeToken.id,
          rememberMe: safeToken.rememberMe,
          expiresIn: maxAge / (24 * 60 * 60) + ' days',
          expiresAt: new Date(safeToken.exp * 1000).toISOString()
        });
        
        return safeToken;
      }
      
      // For subsequent requests, ensure required fields exist with proper typing
      const safeToken: SafeToken = {
        ...token,
        // Ensure id is always a string
        id: (() => {
          if (typeof token.id === 'string') return token.id;
          if (typeof token.sub === 'string') return token.sub;
          return '';
        })(),
        // Ensure email is always a string
        email: typeof token.email === 'string' ? token.email : '',
        // Name can be string or null
        name: typeof token.name === 'string' ? token.name : null,
        // Remember me flag with default to false
        rememberMe: typeof token.rememberMe === 'boolean' ? token.rememberMe : false,
        // User role with default to USER
        role: typeof token.role === 'string' ? token.role : 'USER',
        // User active status with default to true
        active: typeof token.active === 'boolean' ? token.active : true,
        // Expiration time with default to 0
        exp: typeof token.exp === 'number' ? token.exp : 0,
        // Subject (sub) with fallback to id if available
        sub: (() => {
          if (typeof token.sub === 'string') return token.sub;
          if (typeof token.id === 'string') return token.id;
          return '';
        })()
      };
      
      // Handle session updates
      if (trigger === 'update' && session) {
        console.log('JWT callback - Updating session:', { session });
        
        // Update token with session data
        if (typeof session.rememberMe === 'boolean') {
          safeToken.rememberMe = session.rememberMe;
        }
        
        // Update other session properties if needed
        if (session.email) safeToken.email = session.email;
        if (session.name !== undefined) safeToken.name = session.name;
        
        // Update expiration if rememberMe changed
        if (session.rememberMe !== undefined) {
          const maxAge = session.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
          safeToken.exp = Math.floor(Date.now() / 1000) + maxAge;
        }
      }
      
      // Ensure token has valid expiration
      if (!safeToken.exp || safeToken.exp < Math.floor(Date.now() / 1000)) {
        const maxAge = safeToken.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
        safeToken.exp = Math.floor(Date.now() / 1000) + maxAge;
      }
      
      // Ensure required fields
      safeToken.sub = safeToken.sub || safeToken.id;
      
      console.log('JWT callback - Returning token:', {
        userId: safeToken.id,
        email: safeToken.email,
        rememberMe: safeToken.rememberMe,
        expires: new Date(safeToken.exp * 1000).toISOString(),
        hasSub: !!safeToken.sub
      });
      
      return safeToken;
    },
    async session({ session, token }) {
      // Log the start of session callback
      console.log('Session callback - Starting with token:', {
        hasToken: !!token,
        tokenSub: token?.sub,
        tokenRememberMe: token?.rememberMe,
        tokenExp: token?.exp ? new Date((token.exp as number) * 1000).toISOString() : 'No expiration'
      });

      // Create a type-safe token object with defaults using explicit type casting
      const safeToken = {
        // Subject (sub) with fallback to id if available
        sub: (() => {
          if (typeof token.sub === 'string') return token.sub;
          if (typeof token.id === 'string') return token.id;
          console.warn('Session callback - No valid sub or id found in token');
          return '';
        })(),
        // Ensure email is always a string
        email: (() => {
          if (typeof token.email === 'string') return token.email;
          console.warn('Session callback - No valid email found in token');
          return '';
        })(),
        // Name can be string or null
        name: (() => {
          if (typeof token.name === 'string') return token.name;
          if (token.name === null) return null;
          return null;
        })(),
        // Handle picture/avatar
        picture: (() => {
          if (typeof token.picture === 'string') return token.picture;
          if (token.image && typeof token.image === 'string') return token.image;
          return null;
        })(),
        // Remember me flag with explicit type checking
        rememberMe: (() => {
          if (typeof token.rememberMe === 'boolean') return token.rememberMe;
          return false;
        })(),
        // Expiration time with validation
        exp: (() => {
          if (typeof token.exp === 'number' && token.exp > 0) return token.exp;
          // Default to 1 day if no valid expiration
          return Math.floor(Date.now() / 1000) + (24 * 60 * 60);
        })()
      } as const;

      // Log the safe token values
      console.log('Session callback - Safe token values:', {
        sub: safeToken.sub,
        email: safeToken.email ? `${safeToken.email.substring(0, 3)}...` : 'No email',
        hasName: !!safeToken.name,
        hasPicture: !!safeToken.picture,
        rememberMe: safeToken.rememberMe,
        expiresAt: new Date(safeToken.exp * 1000).toISOString()
      });

      // Initialize or update session.user with type-safe values
      const userData = {
        id: safeToken.sub,
        email: safeToken.email,
        name: safeToken.name,
        image: safeToken.picture,
        rememberMe: safeToken.rememberMe,
        role: safeToken.role,
        active: safeToken.active
      };

      if (!session.user) {
        session.user = userData;
        console.log('Session callback - Created new session.user');
      } else {
        Object.assign(session.user, userData);
        console.log('Session callback - Updated existing session.user');
      }
      
      // Add rememberMe to session root for easier access
      session.rememberMe = safeToken.rememberMe;
      
      // Calculate session expiration
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = safeToken.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      const expiresAt = safeToken.exp > currentTime ? safeToken.exp : currentTime + maxAge;
      session.expires = new Date(expiresAt * 1000).toISOString();
      
      // Log the final session expiration
      console.log('Session callback - Session expiration set:', {
        rememberMe: safeToken.rememberMe,
        expiresAt: session.expires,
        isPersistent: safeToken.rememberMe ? '30 days' : '1 day (browser session)'
      });
      
      // Add debug information in development
      if (process.env.NODE_ENV === 'development') {
        const debugInfo = {
          tokenExpires: safeToken.exp > 0 ? new Date(safeToken.exp * 1000).toISOString() : 'No expiration',
          rememberMe: safeToken.rememberMe,
          timestamp: new Date().toISOString()
        };
        
        // Log additional debug info to console without adding to session
        console.debug('Session debug info:', {
          ...debugInfo,
          sessionId: session.user?.id || 'no-session-id',
          userEmail: session.user?.email ? `${session.user.email.substring(0, 3)}...` : 'no-email',
          userRememberMe: session.user?.rememberMe,
          sessionRememberMe: session.rememberMe
        });
        
        session.debug = debugInfo;
      }
      
      // Final session validation
      if (!session.user || !session.user.id) {
        console.error('Session callback - Invalid session: Missing user or user.id');
        throw new Error('Invalid session: Missing user information');
      }
      
      // Log the final session details (redacting sensitive information)
      const loggableSession = {
        userId: session.user.id,
        email: session.user.email ? `${session.user.email.substring(0, 3)}...` : 'no-email',
        rememberMe: session.rememberMe,
        expires: session.expires,
        hasDebug: !!session.debug,
        userProperties: Object.keys(session.user).filter(k => k !== 'email' && k !== 'id')
      };
      
      console.log('Session callback - Session ready:', loggableSession);
      
      // Ensure we're not returning any sensitive information
      const { debug: _, ...cleanSession } = session;
      return cleanSession;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  // HIPAA-SECURITY-ISSUE: In production, use only environment variable
  secret: process.env.NEXTAUTH_SECRET || 'development-secret-key-replace-in-production',
};

export { default } from "next-auth";
