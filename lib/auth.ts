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
      name?: string;
      image?: string;
      rememberMe?: boolean; // Add here for completeness
    };
    rememberMe?: boolean; // This is the main one for the session object itself
  }

  interface User { // This augments the base User type from next-auth
    id: string; // Explicitly include standard fields
    email?: string | null;
    name?: string | null;
    image?: string | null;
    rememberMe?: boolean; 
  }

  /**
   * The shape of the JWT token
   */
  interface JWT {
    id?: string;
    rememberMe?: boolean;
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

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Log the received rememberMe value from credentials
        console.log(`Authorize: Credentials received rememberMe: ${credentials.rememberMe}`);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          // Pass rememberMe from credentials; ensure it's a boolean
          rememberMe: String(credentials.rememberMe).toLowerCase() === 'true'
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) { // Removed 'account' as it was causing confusion here
      if (user) { // 'user' here is the object returned from 'authorize'
        token.id = user.id;
        // 'user' should now correctly have the 'rememberMe' type from the augmented interface
        token.rememberMe = user.rememberMe; // No cast needed
        console.log(`JWT callback (initial signIn): user.id=${user.id}, user.rememberMe=${user.rememberMe}. Set token.rememberMe to ${token.rememberMe}`);
      }
      
      // This handles updates if you ever implement changing rememberMe status mid-session
      if (trigger === 'update' && session?.rememberMe !== undefined) {
        token.rememberMe = session.rememberMe;
        console.log(`JWT callback (update): Updated token.rememberMe to ${session.rememberMe}`);
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      
      // Pass rememberMe state to the session
      session.rememberMe = token.rememberMe as boolean;
      // Log the rememberMe value being set on the session object
      console.log(`Session callback: Setting session.rememberMe to ${session.rememberMe} from token.rememberMe`);
      return session;
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
