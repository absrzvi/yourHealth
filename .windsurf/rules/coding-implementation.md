---
trigger: always_on
---

For Your Health MVP - Complete Implementation Code
WINDSURF INSTRUCTIONS
IMPORTANT: Use the code provided below exactly as written. Only generate new code if absolutely necessary for connecting components. This is an UPDATE to an existing application, not a new build. Follow the checkpoints and pause for testing at each one.

Phase 1: Foundation & Core Infrastructure
Checkpoint 1.1: Database Schema Update
File: prisma/schema.prisma
prismagenerator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  reports   Report[]
  insights  WeeklyInsight[]
  chatMessages ChatMessage[]
}

model Report {
  id        String   @id @default(cuid())
  userId    String
  type      ReportType
  fileName  String
  filePath  String
  parsedData Json?
  labName   String?
  testDate  DateTime?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}

model WeeklyInsight {
  id                    String   @id @default(cuid())
  userId                String
  weekNumber            Int
  year                  Int
  cardiovascularScore   Float?
  metabolicScore        Float?
  inflammationScore     Float?
  recommendations       Json
  generatedAt           DateTime @default(now())
  
  user                  User     @relation(fields: [userId], references: [id])
}

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  role      String   // 'user' or 'assistant'
  content   String
  context   Json?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}

enum ReportType {
  DNA
  MICROBIOME
  BLOOD_TEST
}
Commands to run:
bashnpx prisma migrate dev --name add_chat_and_password
npx prisma generate
🛑 CHECKPOINT 1.1: Test database migration works, then commit

Checkpoint 1.2: Authentication Update
File: app/api/auth/[...nextauth]/route.ts
typescriptimport NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
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
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    signUp: "/register",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
});

export { handler as GET, handler as POST };
File: app/api/auth/register/route.ts
typescriptimport { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
File: lib/db.ts
typescriptimport { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
File: types/next-auth.d.ts
typescriptimport { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
🛑 CHECKPOINT 1.2: Test registration and login, then commit

Checkpoint 1.3: File Upload System
File: app/api/upload/route.ts
typescriptimport { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { parseReport } from "@/lib/parsers";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSes