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

## 3. Database Setup and Management

### 3.1 Database Schema (Prisma)
### 3.1.1 Schema Overview

The database schema is defined using Prisma and includes the following models:

- **User**: Stores user account information and authentication details
- **Report**: Tracks uploaded health reports (blood tests, DNA, microbiome)
- **Biomarker**: Stores individual biomarker measurements from reports
- **WeeklyInsight**: Contains AI-generated health insights and recommendations
- **ChatMessage**: Stores conversation history with the AI health assistant
- **AuditLog**: Tracks important user actions for security and debugging

### 3.1.2 Schema Definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
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

### 3.2 Database Initialization

#### 3.2.1 First-Time Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. Apply database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Seed the database with test data:
   ```bash
   npm run db:seed
   ```

#### 3.2.2 Database Connection

The database connection is managed in `lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 3.3 Common Database Operations

#### Querying Data

```typescript
// Get user with their reports
const userWithReports = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    reports: true,
    insights: {
      orderBy: { generatedAt: 'desc' },
      take: 1
    },
    chatMessages: {
      orderBy: { timestamp: 'desc' },
      take: 10
    }
  }
});

// Get latest biomarker values
const latestBiomarkers = await prisma.biomarker.findMany({
  where: {
    report: { userId },
    name: { in: ['Hemoglobin A1c', 'LDL Cholesterol', 'CRP'] }
  },
  orderBy: { report: { testDate: 'desc' } },
  distinct: ['name']
});
```

#### Creating Records

```typescript
// Create a new report with biomarkers
const newReport = await prisma.report.create({
  data: {
    userId: user.id,
    type: 'BLOOD_TEST',
    fileName: 'blood_test_20230530.pdf',
    filePath: '/uploads/blood_test_20230530.pdf',
    testDate: new Date('2023-05-30'),
    biomarkers: {
      create: [
        {
          name: 'Hemoglobin A1c',
          value: 5.2,
          unit: '%',
          range: '4.0-5.6',
          flag: 'Normal',
          category: 'Diabetes'
        },
        // More biomarkers...
      ]
    }
  },
  include: {
    biomarkers: true
  }
});
```

### 3.4 Database Maintenance

#### Running Migrations

To create a new migration after schema changes:

```bash
npx prisma migrate dev --name add_new_feature
```

#### Resetting the Database

To reset the database and re-seed it:

```bash
npx prisma migrate reset
npm run db:seed
```

#### Database Inspection

Use Prisma Studio to inspect and modify data:

```bash
npx prisma studio
```

### 3.5 Backup and Recovery

#### Creating a Backup

```bash
# Create a timestamped backup
cp prisma/dev.db prisma/backups/dev_$(date +%Y%m%d_%H%M%S).db
```

#### Restoring from Backup

```bash
# Stop the application
# Restore the backup
cp prisma/backups/dev_20230530_123456.db prisma/dev.db
# Restart the application
```

## 4. Core Features Implementation

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
    where: { userId },
    include: { parsedData: true }
  });
  
  const dnaData = reports.find(r => r.type === 'DNA')?.parsedData;
  const microbiomeData = reports.find(r => r.type === 'MICROBIOME')?.parsedData;
  const bloodData = reports.find(r => r.type === 'BLOOD_TEST')?.parsedData;
  
  return {
    cardiovascularScore: calculateCardiovascularRisk(dnaData, bloodData, microbiomeData),
    metabolicScore: calculateMetabolicEfficiency(dnaData, bloodData, microbiomeData),
    inflammationScore: calculateInflammationProfile(dnaData, bloodData, microbiomeData),
    recommendations: generateRecommendations(dnaData, bloodData, microbiomeData)
  };
}

function calculateCardiovascularRisk(dna: any, blood: any, microbiome: any): number {
  let score = 50; // baseline
  
  // Genetic factors (40% weight)
  if (dna?.variants?.rs429358 === 'CC') score += 15; // APOE4 risk
  if (dna?.variants?.rs1065852 === 'TT') score += 10; // CYP2D6 poor metabolizer
  
  // Blood biomarkers (40% weight)
  if (blood?.ldl > 160) score += 20;
  if (blood?.hdl < 40) score += 15;
  if (blood?.triglycerides > 200) score += 10;
  
  // Microbiome factors (20% weight)
  if (microbiome?.diversity < 3.0) score += 8; // Low Shannon diversity
  if (microbiome?.firmicutesBacteroidetesRatio > 3.0) score += 7;
  
  return Math.min(Math.max(score, 0), 100);
}
```

### 3.3 AI Weekly Report Generation

**Report Generator**:
```typescript
// lib/ai/reportGenerator.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateWeeklyReport(userId: string) {
  const metrics = await calculateHealthMetrics(userId);
  const previousWeek = await getPreviousWeekMetrics(userId);
  
  const prompt = `
Generate a personalized health report based on the following data:

Current Metrics:
- Cardiovascular Score: ${metrics.cardiovascularScore}/100
- Metabolic Score: ${metrics.metabolicScore}/100  
- Inflammation Score: ${metrics.inflammationScore}/100

Previous Week Comparison:
${previousWeek ? `
- Cardiovascular: ${previousWeek.cardiovascularScore} → ${metrics.cardiovascularScore}
- Metabolic: ${previousWeek.metabolicScore} → ${metrics.metabolicScore}
- Inflammation: ${previousWeek.inflammationScore} → ${metrics.inflammationScore}
` : 'First week - no previous data'}

Format the report as JSON with:
{
  "summary": "2-3 sentence overview",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "trendsAnalysis": "paragraph about changes from last week"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a personalized health AI assistant. Provide actionable, evidence-based health insights."
      },
      {
        role: "user", 
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 800
  });
  
  const reportData = JSON.parse(completion.choices[0].message.content!);
  
  // Save to database
  await prisma.weeklyInsight.create({
    data: {
      userId,
      weekNumber: getCurrentWeekNumber(),
      year: new Date().getFullYear(),
      cardiovascularScore: metrics.cardiovascularScore,
      metabolicScore: metrics.metabolicScore,
      inflammationScore: metrics.inflammationScore,
      recommendations: reportData
    }
  });
  
  return reportData;
}
```

### 3.4 AI Chatbot

**Simple Non-Conversational Bot**:
```typescript
// app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { question, userId } = await request.json();
  
  // Get user's latest reports and insights
  const userReports = await prisma.report.findMany({
    where: { userId },
    include: { parsedData: true }
  });
  
  const latestInsight = await prisma.weeklyInsight.findFirst({
    where: { userId },
    orderBy: { generatedAt: 'desc' }
  });
  
  const context = `
User's Health Data Summary:
${userReports.map(r => `${r.type}: ${JSON.stringify(r.parsedData)}`).join('\n')}

Latest Health Scores:
- Cardiovascular: ${latestInsight?.cardiovascularScore}/100
- Metabolic: ${latestInsight?.metabolicScore}/100
- Inflammation: ${latestInsight?.inflammationScore}/100

User Question: ${question}

Provide a specific answer based ONLY on the user's uploaded data. Do not provide general health advice.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You explain health reports based strictly on uploaded user data. No general advice."
      },
      {
        role: "user",
        content: context
      }
    ],
    max_tokens: 300
  });
  
  return NextResponse.json({ 
    answer: completion.choices[0].message.content 
  });
}
```

## 4. UI Components

### 4.1 Dashboard Layout
```typescript
// app/dashboard/page.tsx
import { HealthMetricsChart } from '@/components/charts/HealthMetrics';
import { UploadCard } from '@/components/upload/UploadCard';
import { RecentReports } from '@/components/reports/RecentReports';
import { ChatBot } from '@/components/chat/ChatBot';

export default async function Dashboard() {
  const metrics = await getCurrentUserMetrics();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      <div className="lg:col-span-2">
        <HealthMetricsChart data={metrics} />
        <RecentReports />
      </div>
      <div className="space-y-6">
        <UploadCard />
        <ChatBot />
      </div>
    </div>
  );
}
```

### 4.2 File Upload Component
```typescript
// components/upload/UploadCard.tsx
'use client';
import { useDropzone } from 'react-dropzone';
import { useState } from 'react';

export function UploadCard() {
  const [uploading, setUploading] = useState(false);
  const [reportType, setReportType] = useState<'DNA' | 'MICROBIOME' | 'BLOOD_TEST'>('DNA');
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/plain': ['.txt']
    },
    onDrop: async (files) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('type', reportType);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          // Refresh page or update state
          window.location.reload();
        }
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setUploading(false);
      }
    }
  });
  
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div className="mb-4">
        <select 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value as any)}
          className="w-full p-2 border rounded"
        >
          <option value="DNA">DNA Report</option>
          <option value="MICROBIOME">Microbiome Report</option>
          <option value="BLOOD_TEST">Blood Test</option>
        </select>
      </div>
      
      <div {...getRootProps()} className="cursor-pointer text-center">
        <input {...getInputProps()} />
        {uploading ? (
          <p>Uploading...</p>
        ) : (
          <p>Drop files here or click to upload</p>
        )}
      </div>
    </div>
  );
}
```

## 5. Deployment Configuration

### 5.1 Environment Variables
```bash
# .env.local
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-key
DATABASE_URL="file:./dev.db"
```

### 5.2 Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "next-auth": "^4.24.0",
    "openai": "^4.24.0",
    "react-dropzone": "^14.2.3",
    "recharts": "^2.10.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.4.7",
    "pdf-parse": "^1.1.1"
  }
}
```

## 6. Development Phases with Checkpoints

### Phase 1 (Weeks 1-4): Foundation & Core Infrastructure

#### Milestone 1.1: Project Setup (Days 1-3)
**Git Commit**: `feat: initial project setup`
- [ ] Create Next.js 14 project with TypeScript
- [ ] Install and configure Tailwind CSS
- [ ] Set up shadcn/ui components
- [ ] Create basic folder structure
- [ ] Initialize Git repository with .gitignore

**Test Checkpoint**: 
- ✅ `npm run dev` starts without errors
- ✅ Tailwind classes render correctly
- ✅ Basic page routing works

#### Milestone 1.2: Database Foundation (Days 4-6)
**Git Commit**: `feat: database schema and prisma setup`
- [ ] Install Prisma and SQLite
- [ ] Create complete database schema
- [ ] Generate Prisma client
- [ ] Create database seed file
- [ ] Set up database connection utilities

**Test Checkpoint**:
- ✅ `npx prisma db push` executes successfully
- ✅ Database file created in project root
- ✅ Prisma client connects without errors
- ✅ Seed data populates correctly

#### Milestone 1.3: Authentication System (Days 7-10)
**Git Commit**: `feat: nextauth authentication system`
- [ ] Install and configure NextAuth.js
- [ ] Create login/register pages
- [ ] Set up session management
- [ ] Create protected route middleware
- [ ] Build basic user profile page

**Test Checkpoint**:
- ✅ User can register new account
- ✅ User can login/logout
- ✅ Session persists across page reloads
- ✅ Protected routes redirect properly
- ✅ User data saves to database

#### Milestone 1.4: File Upload Infrastructure (Days 11-14)
**Git Commit**: `feat: file upload system with local storage`
- [ ] Create file upload API endpoint
- [ ] Build drag-and-drop upload component
- [ ] Set up local file storage system
- [ ] Add file type validation
- [ ] Create upload progress indicators

**Test Checkpoint**:
- ✅ Files upload successfully to `/public/uploads/`
- ✅ File metadata saves to database
- ✅ Upload progress shows correctly
- ✅ File type validation works
- ✅ Error handling displays properly

### Phase 2 (Weeks 5-8): Data Processing & Parsing

#### Milestone 2.1: Blood Test Parser (Days 15-21)
**Git Commit**: `feat: blood test report parsing engine`
- [ ] Install pdf-parse library
- [ ] Create blood test parsing functions
- [ ] Build regex patterns for common biomarkers
- [ ] Handle LabCorp/Quest report formats
- [ ] Create parsed data visualization

**Test Checkpoint**:
- ✅ PDF blood test uploads parse correctly
- ✅ Key biomarkers extracted (LDL, HDL, HbA1c)
- ✅ Parsed data displays in dashboard
- ✅ Error handling for unparseable files
- ✅ Manual test with 3 different lab formats

#### Milestone 2.2: DNA Data Parser (Days 22-28)
**Git Commit**: `feat: DNA raw data parsing system`
- [ ] Create 23andMe raw data parser
- [ ] Build SNP extraction for priority variants
- [ ] Handle AncestryDNA format differences
- [ ] Create genetic variant interpretation
- [ ] Add DNA data dashboard component

**Test Checkpoint**:
- ✅ 23andMe .txt files parse successfully
- ✅ Priority SNPs extracted correctly
- ✅ Genetic variants display in UI
- ✅ Handle malformed DNA files gracefully
- ✅ Test with actual 23andMe download

#### Milestone 2.3: Microbiome Parser (Days 29-35)
**Git Commit**: `feat: microbiome report parsing`
- [ ] Create microbiome PDF parser
- [ ] Extract diversity metrics
- [ ] Parse bacterial composition data
- [ ] Handle multiple microbiome test formats
- [ ] Build microbiome visualization charts

**Test Checkpoint**:
- ✅ Microbiome PDFs parse key metrics
- ✅ Diversity scores calculate correctly
- ✅ Bacterial ratios display properly
- ✅ Charts render microbiome data
- ✅ Test with Viome/uBiome reports

#### Milestone 2.4: Health Metrics Engine (Days 36-42)
**Git Commit**: `feat: correlation engine and health scoring`
- [ ] Build cardiovascular risk calculator
- [ ] Create metabolic efficiency scorer
- [ ] Implement inflammation profile
- [ ] Cross-reference genetic and lab data
- [ ] Create metrics dashboard component

**Test Checkpoint**:
- ✅ All 3 health scores calculate correctly
- ✅ Scores update when new data added
- ✅ Correlation logic works across data types
- ✅ Edge cases handled (missing data)
- ✅ Manual verification of score accuracy

### Phase 3 (Weeks 9-12): AI Integration & Polish

#### Milestone 3.1: OpenAI Integration (Days 43-49)
**Git Commit**: `feat: openai integration for reports`
- [ ] Set up OpenAI API client
- [ ] Create report generation prompts
- [ ] Build weekly report scheduler
- [ ] Handle API rate limiting
- [ ] Create report storage system

**Test Checkpoint**:
- ✅ OpenAI API connects successfully
- ✅ Reports generate with user data
- ✅ Report quality is readable/useful
- ✅ API errors handled gracefully
- ✅ Generated reports save to database

#### Milestone 3.2: AI Chatbot (Days 50-56)
**Git Commit**: `feat: ai chatbot for report explanations`
- [ ] Create chat API endpoint
- [ ] Build chat UI component
- [ ] Implement context-aware responses
- [ ] Add chat history storage
- [ ] Create typing indicators

**Test Checkpoint**:
- ✅ Chat responds to user questions
- ✅ Answers based on user's data only
- ✅ Chat history persists
- ✅ UI is responsive and intuitive
- ✅ No general health advice given

#### Milestone 3.3: Dashboard & Visualization (Days 57-63)
**Git Commit**: `feat: complete dashboard with charts`
- [ ] Build comprehensive dashboard layout
- [ ] Create health metrics charts (Recharts)
- [ ] Add trend analysis over time
- [ ] Build responsive mobile layout
- [ ] Add data export functionality

**Test Checkpoint**:
- ✅ Dashboard loads all user data
- ✅ Charts render correctly on all devices
- ✅ Trends show historical changes
- ✅ Mobile experience is usable
- ✅ Data exports work properly

#### Milestone 3.4: Final Polish & Testing (Days 64-70)
**Git Commit**: `feat: production ready mvp`
- [ ] Add loading states throughout app
- [ ] Implement error boundaries
- [ ] Create user onboarding flow
- [ ] Add email notifications for reports
- [ ] Performance optimization

**Test Checkpoint**:
- ✅ All features work end-to-end
- ✅ No broken states or error pages
- ✅ Onboarding guides new users
- ✅ Email notifications send correctly
- ✅ App performs well under load

#### Milestone 3.5: Friends & Family Beta (Days 71-84)
**Git Commit**: `feat: beta deployment and user feedback`
- [ ] Deploy to Vercel production
- [ ] Create user invitation system
- [ ] Set up user feedback collection
- [ ] Monitor app performance
- [ ] Iterate based on feedback

**Test Checkpoint**:
- ✅ 10+ friends/family using app
- ✅ No critical bugs reported
- ✅ Users completing full workflow
- ✅ Positive feedback on core features
- ✅ Performance metrics within targets

## 7. Continuous Testing Strategy

### Daily Testing Protocol
```bash
# Run before each commit
npm run test              # Unit tests
npm run build            # Build verification
npm run db:push          # Database sync
npm run lint             # Code quality
```

### Weekly Integration Tests
- [ ] Complete user registration → upload → report flow
- [ ] All 3 data types upload and parse correctly
- [ ] Health metrics calculate with realistic data
- [ ] AI responses are relevant and helpful
- [ ] Mobile experience works on 3+ devices

### Git Workflow
```bash
# Feature branch workflow
git checkout -b feat/milestone-x-y
# ... implement feature
git add .
git commit -m "feat: descriptive commit message"
git push origin feat/milestone-x-y
# ... test thoroughly
git checkout main
git merge feat/milestone-x-y
git tag milestone-x.y
git push origin main --tags
```

### Rollback Strategy
- Each milestone tagged for easy rollback
- Database migrations reversible
- Feature flags for AI components
- Local backup before major changes

## 7. Cost Estimates (Monthly)

- **Vercel Pro**: $20/month
- **OpenAI API**: ~$50/month (estimated for 50 users)
- **Domain**: $10/year
- **Total**: ~$70/month

## 8. Success Metrics

- **Technical**: 95%+ file parsing success rate
- **User Engagement**: 80%+ weekly report open rate
- **AI Accuracy**: User satisfaction survey >4/5
- **Performance**: <3 second page load times

This PRD provides comprehensive technical specifications for Windsurf to implement the entire platform autonomously while maintaining MVP simplicity and cost constraints.