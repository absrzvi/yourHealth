---
trigger: always_on
---

# For Your Health - MVP PRD: Windsurf Implementation Guide

## 1. Executive Summary & MVP Constraints

**Vision**: Build a minimal personalized health platform for friends & family (20-50 users) to upload health reports, get 3 correlation metrics, and receive AI-powered weekly insights.

**MVP Constraints**:
- Friends & family only (no public launch)
- Cost optimization priority (minimal infrastructure)
- No security/compliance requirements 
- Maximum development automation via Windsurf
- 12-week timeline to working platform

## 2. Technical Architecture Specifications

### 2.1 Frontend Stack
```
Framework: Next.js 14 with App Router
Styling: Tailwind CSS v3.4
UI Components: shadcn/ui component library
Charts: Recharts + Chart.js
File Upload: react-dropzone
State Management: Zustand (lightweight)
Authentication: NextAuth.js with simple email/password
Mobile: Responsive-first design (no native apps for MVP)
```

### 2.2 Backend Stack
```
Runtime: Next.js API routes (full-stack approach)
Database: SQLite with Prisma ORM (simple, file-based)
File Storage: Local filesystem (no S3 for MVP)
AI/LLM: OpenAI GPT-4 API only
Vector Storage: In-memory arrays (no Pinecone for MVP)
Hosting: Vercel (free tier + pro if needed)
```

### 2.3 Database Schema (Prisma)
```prisma
// prisma/schema.prisma
generator client {
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
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  reports   Report[]
  insights  WeeklyInsight[]
}

model Report {
  id        String   @id @default(cuid())
  userId    String
  type      ReportType
  fileName  String
  filePath  String
  parsedData Json?
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

enum ReportType {
  DNA
  MICROBIOME
  BLOOD_TEST
}
```

### 2.4 File Structure
```
for-your-health-mvp/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── upload/
│   │   ├── parse/
│   │   ├── insights/
│   │   └── chat/
│   ├── dashboard/
│   ├── upload/
│   ├── reports/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── charts/
│   ├── upload/
│   └── chat/
├── lib/
│   ├── db.ts (Prisma client)
│   ├── parsers/
│   ├── correlations/
│   └── ai/
├── prisma/
├── public/uploads/
└── types/
```

## 3. Core Features Implementation

### 3.1 Data Upload & Parsing Engine

**API Endpoint**: `/api/upload`
```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { parseReport } from '@/lib/parsers';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const reportType = formData.get('type') as 'DNA' | 'MICROBIOME' | 'BLOOD_TEST';
  
  // Save file locally
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filePath = `./public/uploads/${Date.now()}-${file.name}`;
  await writeFile(filePath, buffer);
  
  // Parse based on type
  const parsedData = await parseReport(filePath, reportType);
  
  // Save to database
  const report = await prisma.report.create({
    data: {
      userId: session.user.id,
      type: reportType,
      fileName: file.name,
      filePath,
      parsedData
    }
  });
  
  return NextResponse.json({ success: true, reportId: report.id });
}
```

**Parser Functions**:
```typescript
// lib/parsers/index.ts
export async function parseReport(filePath: string, type: ReportType) {
  switch (type) {
    case 'DNA':
      return parseDNAReport(filePath);
    case 'MICROBIOME':
      return parseMicrobiomeReport(filePath);
    case 'BLOOD_TEST':
      return parseBloodTestReport(filePath);
  }
}

// lib/parsers/dna.ts
export async function parseDNAReport(filePath: string) {
  // Handle both 23andMe raw data and PDF reports
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  if (extension === 'txt') {
    // Parse 23andMe/AncestryDNA raw data
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => !line.startsWith('#'));
    
    const variants = {};
    for (const line of lines) {
      const [rsid, chromosome, position, genotype] = line.split('\t');
      // Focus on key pharmacogenomic SNPs
      if (PRIORITY_SNPS.includes(rsid)) {
        variants[rsid] = { chromosome, position, genotype };
      }
    }
    return { variants, totalSNPs: Object.keys(variants).length };
  }
  
  if (extension === 'pdf') {
    // Use pdf-parse for PDF extraction
    const pdfParse = require('pdf-parse');
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    
    // Extract key genetic markers using regex patterns
    const extractedData = extractGeneticMarkers(data.text);
    return extractedData;
  }
}

const PRIORITY_SNPS = [
  'rs1065852', // CYP2D6
  'rs4244285', // CYP2C19
  'rs429358',  // APOE4
  'rs1801133', // MTHFR
  'rs7412',    // APOE
];
```

### 3.2 Correlation Engine

**Core Metrics Calculation**:
```typescript
// lib/correlations/index.ts
export interface HealthMetrics {
  cardiovascularScore: number;
  metabolicScore: number;
  inflammationScore: number;
  recommendations: string[];
}

export async function calculateHealthMetrics(userId: string): Promise<HealthMetrics> {
  const reports = await prisma.report.findMany({
    where: { userId }