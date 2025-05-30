import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { User } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./db";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
    rememberMe?: boolean;
  }
  
  // Add rememberMe to the JWT token
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
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
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

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        } as User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
      }
      
      // Handle the rememberMe flag during sign in
      if (trigger === 'signIn' && account) {
        const isRemembered = account.rememberMe === 'true';
        token.rememberMe = isRemembered;
        console.log(`JWT callback: Setting rememberMe to ${isRemembered}`);
      }
      
      // Update session if needed
      if (trigger === 'update' && session) {
        // Handle session updates if needed
        if (session.rememberMe !== undefined) {
          token.rememberMe = session.rememberMe;
          console.log(`JWT callback: Updated rememberMe to ${session.rememberMe}`);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      
      // Pass rememberMe state to the session
      session.rememberMe = token.rememberMe as boolean;
      
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
};

export { default } from "next-auth";
