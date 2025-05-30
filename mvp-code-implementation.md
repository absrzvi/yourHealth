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
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const reportType = formData.get("type") as "DNA" | "MICROBIOME" | "BLOOD_TEST";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    await writeFile(filePath, buffer);

    // Parse the report
    const parsedData = await parseReport(filePath, reportType);

    // Save to database
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        type: reportType,
        fileName: file.name,
        filePath: fileName,
        parsedData: parsedData as any,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      parsedData,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
File: components/upload/UploadCard.tsx
typescript"use client";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

export function UploadCard() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [reportType, setReportType] = useState<"DNA" | "MICROBIOME" | "BLOOD_TEST">("BLOOD_TEST");
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", acceptedFiles[0]);
      formData.append("type", reportType);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        router.refresh();
      } catch (error) {
        console.error("Upload failed:", error);
        setError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Health Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select
            value={reportType}
            onValueChange={(value) => setReportType(value as any)}
            disabled={uploading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BLOOD_TEST">Blood Test</SelectItem>
              <SelectItem value="DNA">DNA Report</SelectItem>
              <SelectItem value="MICROBIOME">Microbiome Report</SelectItem>
            </SelectContent>
          </Select>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300"}
              ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary"}
            `}
          >
            <input {...getInputProps()} disabled={uploading} />
            {uploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? "Drop the file here"
                    : "Drag & drop a file here, or click to select"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, PNG, JPG, or TXT (max 10MB)
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
🛑 CHECKPOINT 1.3: Test file upload functionality, then commit

Phase 2: Data Processing & Parsing
Checkpoint 2.1: Parser Foundation
File: lib/parsers/index.ts
typescriptimport { ReportType } from "@prisma/client";
import { parseBloodTestReport } from "./blood";
import { parseDNAReport } from "./dna";
import { parseMicrobiomeReport } from "./microbiome";

export async function parseReport(filePath: string, type: ReportType) {
  switch (type) {
    case "DNA":
      return parseDNAReport(filePath);
    case "MICROBIOME":
      return parseMicrobiomeReport(filePath);
    case "BLOOD_TEST":
      return parseBloodTestReport(filePath);
    default:
      throw new Error(`Unsupported report type: ${type}`);
  }
}
File: lib/parsers/blood.ts
typescriptimport { readFile } from "fs/promises";
import pdf from "pdf-parse";

interface BloodTestResult {
  biomarkers: {
    [key: string]: {
      value: number;
      unit: string;
      referenceRange?: string;
      flag?: "H" | "L" | "N";
    };
  };
  testDate?: string;
  labName?: string;
}

const BIOMARKER_PATTERNS = {
  // Lipid Panel
  ldl: /LDL.*?(\d+\.?\d*)\s*(mg\/dL)/i,
  hdl: /HDL.*?(\d+\.?\d*)\s*(mg\/dL)/i,
  triglycerides: /Triglycerides.*?(\d+\.?\d*)\s*(mg\/dL)/i,
  totalCholesterol: /Total Cholesterol.*?(\d+\.?\d*)\s*(mg\/dL)/i,
  
  // Metabolic Panel
  glucose: /Glucose.*?(\d+\.?\d*)\s*(mg\/dL)/i,
  hba1c: /(?:HbA1c|A1C|Hemoglobin A1c).*?(\d+\.?\d*)%?/i,
  insulin: /Insulin.*?(\d+\.?\d*)\s*(uIU\/mL)/i,
  
  // Inflammatory Markers
  crp: /(?:CRP|C-Reactive Protein).*?(\d+\.?\d*)\s*(mg\/L)/i,
  homocysteine: /Homocysteine.*?(\d+\.?\d*)\s*(umol\/L)/i,
  
  // Vitamins
  vitaminD: /Vitamin D.*?(\d+\.?\d*)\s*(ng\/mL)/i,
  vitaminB12: /(?:B12|Vitamin B12).*?(\d+\.?\d*)\s*(pg\/mL)/i,
  folate: /Folate.*?(\d+\.?\d*)\s*(ng\/mL)/i,
  
  // Hormones
  testosterone: /Testosterone.*?(\d+\.?\d*)\s*(ng\/dL)/i,
  tsh: /TSH.*?(\d+\.?\d*)\s*(mIU\/L)/i,
  t3: /T3.*?(\d+\.?\d*)\s*(ng\/dL)/i,
  t4: /T4.*?(\d+\.?\d*)\s*(ug\/dL)/i,
};

export async function parseBloodTestReport(filePath: string): Promise<BloodTestResult> {
  try {
    const fileBuffer = await readFile(filePath);
    const fileExt = filePath.split(".").pop()?.toLowerCase();

    let text = "";
    
    if (fileExt === "pdf") {
      const pdfData = await pdf(fileBuffer);
      text = pdfData.text;
    } else if (fileExt === "txt" || fileExt === "csv") {
      text = fileBuffer.toString("utf-8");
    } else {
      throw new Error(`Unsupported file type: ${fileExt}`);
    }

    // Extract biomarkers
    const biomarkers: BloodTestResult["biomarkers"] = {};
    
    for (const [key, pattern] of Object.entries(BIOMARKER_PATTERNS)) {
      const match = text.match(pattern);
      if (match) {
        biomarkers[key] = {
          value: parseFloat(match[1]),
          unit: match[2] || "",
        };
      }
    }

    // Extract test date
    const dateMatch = text.match(/(?:Test Date|Collection Date|Date).*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    const testDate = dateMatch ? dateMatch[1] : undefined;

    // Extract lab name
    const labMatch = text.match(/(?:LabCorp|Quest Diagnostics|BioReference)/i);
    const labName = labMatch ? labMatch[0] : undefined;

    return {
      biomarkers,
      testDate,
      labName,
    };
  } catch (error) {
    console.error("Blood test parsing error:", error);
    throw new Error("Failed to parse blood test report");
  }
}
File: lib/parsers/dna.ts
typescriptimport { readFile } from "fs/promises";
import pdf from "pdf-parse";

interface DNAResult {
  variants: {
    [rsid: string]: {
      chromosome: string;
      position: string;
      genotype: string;
      gene?: string;
      impact?: string;
    };
  };
  totalSNPs: number;
  source?: string;
}

const PRIORITY_SNPS = [
  { rsid: "rs1065852", gene: "CYP2D6", impact: "Drug metabolism" },
  { rsid: "rs4244285", gene: "CYP2C19", impact: "Drug metabolism" },
  { rsid: "rs429358", gene: "APOE", impact: "Alzheimer's risk" },
  { rsid: "rs1801133", gene: "MTHFR", impact: "Folate metabolism" },
  { rsid: "rs7412", gene: "APOE", impact: "Alzheimer's risk" },
  { rsid: "rs1800497", gene: "DRD2", impact: "Dopamine receptor" },
  { rsid: "rs1799853", gene: "CYP2C9", impact: "Warfarin metabolism" },
  { rsid: "rs8099917", gene: "IL28B", impact: "Hepatitis C treatment" },
  { rsid: "rs1801282", gene: "PPARG", impact: "Type 2 diabetes" },
  { rsid: "rs1051730", gene: "CHRNA3", impact: "Nicotine dependence" },
];

export async function parseDNAReport(filePath: string): Promise<DNAResult> {
  try {
    const fileBuffer = await readFile(filePath);
    const fileExt = filePath.split(".").pop()?.toLowerCase();
    
    if (fileExt === "txt") {
      // Parse 23andMe or AncestryDNA raw data
      const content = fileBuffer.toString("utf-8");
      const lines = content.split("\n").filter(line => !line.startsWith("#") && line.trim());
      
      const variants: DNAResult["variants"] = {};
      let totalSNPs = 0;
      
      for (const line of lines) {
        const [rsid, chromosome, position, genotype] = line.split(/\s+/);
        if (rsid && rsid.startsWith("rs")) {
          totalSNPs++;
          
          // Check if it's a priority SNP
          const prioritySNP = PRIORITY_SNPS.find(snp => snp.rsid === rsid);
          if (prioritySNP) {
            variants[rsid] = {
              chromosome,
              position,
              genotype,
              gene: prioritySNP.gene,
              impact: prioritySNP.impact,
            };
          }
        }
      }
      
      return {
        variants,
        totalSNPs,
        source: "23andMe/AncestryDNA",
      };
    } else if (fileExt === "pdf") {
      // Parse PDF reports (simplified)
      const pdfData = await pdf(fileBuffer);
      const text = pdfData.text;
      
      const variants: DNAResult["variants"] = {};
      
      // Look for priority SNPs in the text
      for (const snp of PRIORITY_SNPS) {
        const pattern = new RegExp(`${snp.rsid}.*?([ACGT]{1,2}[/\\s]?[ACGT]{1,2})`, "i");
        const match = text.match(pattern);
        if (match) {
          variants[snp.rsid] = {
            chromosome: "",
            position: "",
            genotype: match[1].replace(/[/\s]/g, ""),
            gene: snp.gene,
            impact: snp.impact,
          };
        }
      }
      
      return {
        variants,
        totalSNPs: Object.keys(variants).length,
        source: "PDF Report",
      };
    }
    
    throw new Error(`Unsupported DNA file type: ${fileExt}`);
  } catch (error) {
    console.error("DNA parsing error:", error);
    throw new Error("Failed to parse DNA report");
  }
}
File: lib/parsers/microbiome.ts
typescriptimport { readFile } from "fs/promises";
import pdf from "pdf-parse";

interface MicrobiomeResult {
  diversity: {
    shannon: number;
    simpson: number;
  };
  bacterialComposition: {
    [phylum: string]: number; // percentage
  };
  firmicutesBacteroidetesRatio?: number;
  probioticBacteria?: {
    [species: string]: number;
  };
  testDate?: string;
  labName?: string;
}

export async function parseMicrobiomeReport(filePath: string): Promise<MicrobiomeResult> {
  try {
    const fileBuffer = await readFile(filePath);
    const pdfData = await pdf(fileBuffer);
    const text = pdfData.text;
    
    // Extract diversity metrics
    const shannonMatch = text.match(/Shannon.*?(\d+\.?\d*)/i);
    const simpsonMatch = text.match(/Simpson.*?(\d+\.?\d*)/i);
    
    const diversity = {
      shannon: shannonMatch ? parseFloat(shannonMatch[1]) : 3.5,
      simpson: simpsonMatch ? parseFloat(simpsonMatch[1]) : 0.85,
    };
    
    // Extract bacterial composition (simplified)
    const bacterialComposition: MicrobiomeResult["bacterialComposition"] = {};
    
    const phylumPatterns = {
      Firmicutes: /Firmicutes.*?(\d+\.?\d*)%/i,
      Bacteroidetes: /Bacteroidetes.*?(\d+\.?\d*)%/i,
      Proteobacteria: /Proteobacteria.*?(\d+\.?\d*)%/i,
      Actinobacteria: /Actinobacteria.*?(\d+\.?\d*)%/i,
      Verrucomicrobia: /Verrucomicrobia.*?(\d+\.?\d*)%/i,
    };
    
    for (const [phylum, pattern] of Object.entries(phylumPatterns)) {
      const match = text.match(pattern);
      if (match) {
        bacterialComposition[phylum] = parseFloat(match[1]);
      }
    }
    
    // Calculate F/B ratio
    let firmicutesBacteroidetesRatio = undefined;
    if (bacterialComposition.Firmicutes && bacterialComposition.Bacteroidetes) {
      firmicutesBacteroidetesRatio = bacterialComposition.Firmicutes / bacterialComposition.Bacteroidetes;
    }
    
    // Extract probiotic bacteria
    const probioticBacteria: MicrobiomeResult["probioticBacteria"] = {};
    const probioticPatterns = {
      "Lactobacillus": /Lactobacillus.*?(\d+\.?\d*)%/i,
      "Bifidobacterium": /Bifidobacterium.*?(\d+\.?\d*)%/i,
      "Akkermansia": /Akkermansia.*?(\d+\.?\d*)%/i,
    };
    
    for (const [species, pattern] of Object.entries(probioticPatterns)) {
      const match = text.match(pattern);
      if (match) {
        probioticBacteria[species] = parseFloat(match[1]);
      }
    }
    
    // Extract test date and lab
    const dateMatch = text.match(/(?:Test Date|Collection Date).*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    const testDate = dateMatch ? dateMatch[1] : undefined;
    
    const labMatch = text.match(/(?:Viome|uBiome|Ombre|Thorne)/i);
    const labName = labMatch ? labMatch[0] : undefined;
    
    return {
      diversity,
      bacterialComposition,
      firmicutesBacteroidetesRatio,
      probioticBacteria,
      testDate,
      labName,
    };
  } catch (error) {
    console.error("Microbiome parsing error:", error);
    throw new Error("Failed to parse microbiome report");
  }
}
🛑 CHECKPOINT 2.1: Test all parsers with sample files, then commit

Checkpoint 2.2: Correlation Engine
File: lib/correlations/index.ts
typescriptimport { prisma } from "@/lib/db";

export interface HealthMetrics {
  cardiovascularScore: number;
  metabolicScore: number;
  inflammationScore: number;
  recommendations: string[];
}

export async function calculateHealthMetrics(userId: string): Promise<HealthMetrics> {
  const reports = await prisma.report.findMany({
    where: { userId },
  });

  const dnaData = reports.find((r) => r.type === "DNA")?.parsedData as any;
  const microbiomeData = reports.find((r) => r.type === "MICROBIOME")?.parsedData as any;
  const bloodData = reports.find((r) => r.type === "BLOOD_TEST")?.parsedData as any;

  const cardiovascularScore = calculateCardiovascularRisk(dnaData, bloodData, microbiomeData);
  const metabolicScore = calculateMetabolicEfficiency(dnaData, bloodData, microbiomeData);
  const inflammationScore = calculateInflammationProfile(dnaData, bloodData, microbiomeData);
  const recommendations = generateRecommendations(cardiovascularScore, metabolicScore, inflammationScore);

  return {
    cardiovascularScore,
    metabolicScore,
    inflammationScore,
    recommendations,
  };
}

function calculateCardiovascularRisk(dna: any, blood: any, microbiome: any): number {
  let score = 50; // baseline

  // Genetic factors (40% weight)
  if (dna?.variants) {
    if (dna.variants.rs429358?.genotype === "CC") score += 15; // APOE4 risk
    if (dna.variants.rs1065852?.genotype === "TT") score += 10; // CYP2D6 poor metabolizer
    if (dna.variants.rs7412?.genotype === "CC") score += 5; // APOE protective
  }

  // Blood biomarkers (40% weight)
  if (blood?.biomarkers) {
    if (blood.biomarkers.ldl?.value > 160) score += 20;
    if (blood.biomarkers.hdl?.value < 40) score += 15;
    if (blood.biomarkers.triglycerides?.value > 200) score += 10;
    if (blood.biomarkers.crp?.value > 3) score += 10;
    if (blood.biomarkers.homocysteine?.value > 15) score += 5;
  }

  // Microbiome factors (20% weight)
  if (microbiome) {
    if (microbiome.diversity?.shannon < 3.0) score += 8;
    if (microbiome.firmicutesBacteroidetesRatio > 3.0) score += 7;
    if (microbiome.probioticBacteria?.Akkermansia < 1) score += 5;
  }

  return Math.min(Math.max(score, 0), 100);
}

function calculateMetabolicEfficiency(dna: any, blood: any, microbiome: any): number {
  let score = 50; // baseline

  // Genetic factors
  if (dna?.variants) {
    if (dna.variants.rs1801133?.genotype === "TT") score += 15; // MTHFR mutation
    if (dna.variants.rs1801282?.genotype === "CC") score += 10; // PPARG diabetes risk
  }

  // Blood biomarkers
  if (blood?.biomarkers) {
    if (blood.biomarkers.glucose?.value > 100) score += 15;
    if (blood.biomarkers.hba1c?.value > 5.7) score += 20;
    if (blood.biomarkers.insulin?.value > 15) score += 10;
    if (blood.biomarkers.vitaminD?.value < 30) score += 10;
    if (blood.biomarkers.vitaminB12?.value < 400) score += 5;
  }

  // Microbiome factors
  if (microbiome) {
    if (microbiome.bacterialComposition?.Proteobacteria > 10) score += 10;
    if (microbiome.probioticBacteria?.Bifidobacterium < 3) score += 5;
  }

  return Math.min(Math.max(score, 0), 100);
}

function calculateInflammationProfile(dna: any, blood: any, microbiome: any): number {
  let score = 50; // baseline

  // Genetic factors
  if (dna?.variants) {
    if (dna.variants.rs8099917?.genotype === "TT") score += 10; // IL28B inflammation
  }

  // Blood biomarkers
  if (blood?.biomarkers) {
    if (blood.biomarkers.crp?.value > 1) score += 25;
    if (blood.biomarkers.homocysteine?.value > 10) score += 15;
    if (blood.biomarkers.vitaminD?.value < 20) score += 10;
  }

  // Microbiome factors
  if (microbiome) {
    if (microbiome.diversity?.shannon < 3.5) score += 10;
    if (microbiome.bacterialComposition?.Firmicutes > 60) score += 10;
    if (microbiome.probioticBacteria?.Lactobacillus < 2) score += 5;
  }

  return Math.min(Math.max(score, 0), 100);
}

function generateRecommendations(cardiovascular: number, metabolic: number, inflammation: number): string[] {
  const recommendations: string[] = [];

  if (cardiovascular > 70) {
    recommendations.push("Consider omega-3 supplementation for cardiovascular support");
    recommendations.push("Increase aerobic exercise to 150 minutes per week");
  }

  if (metabolic > 70) {
    recommendations.push("Implement intermittent fasting or time-restricted eating");
    recommendations.push("Consider berberine or metformin with doctor consultation");
  }

  if (inflammation > 70) {
    recommendations.push("Add turmeric/curcumin supplementation");
    recommendations.push("Increase probiotic-rich foods or supplements");
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push("Maintain current healthy lifestyle practices");
    recommendations.push("Continue monitoring biomarkers quarterly");
  }

  return recommendations;
}
🛑 CHECKPOINT 2.2: Test correlation calculations, then commit

Phase 3: AI Integration & UI
Checkpoint 3.1: OpenAI Integration
File: lib/ai/openai.ts
typescriptimport OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export { openai };
File: lib/ai/reportGenerator.ts
typescriptimport { openai } from "./openai";
import { calculateHealthMetrics } from "@/lib/correlations";
import { prisma } from "@/lib/db";

export interface WeeklyReport {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  trendsAnalysis: string;
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const metrics = await calculateHealthMetrics(userId);
  
  // Get previous week's metrics
  const previousWeek = await prisma.weeklyInsight.findFirst({
    where: { userId },
    orderBy: { generatedAt: "desc" },
  });

  const prompt = `
Generate a personalized health report based on the following data:

Current Metrics:
- Cardiovascular Score: ${metrics.cardiovascularScore}/100
- Metabolic Score: ${metrics.metabolicScore}/100  
- Inflammation Score: ${metrics.inflammationScore}/100

Previous Week Comparison:
${
  previousWeek
    ? `
- Cardiovascular: ${previousWeek.cardiovascularScore} → ${metrics.cardiovascularScore}
- Metabolic: ${previousWeek.metabolicScore} → ${metrics.metabolicScore}
- Inflammation: ${previousWeek.inflammationScore} → ${metrics.inflammationScore}
`
    : "First week - no previous data"
}

Base Recommendations:
${metrics.recommendations.join("\n")}

Format the report as JSON with:
{
  "summary": "2-3 sentence overview focusing on the most important changes or areas of concern",
  "keyFindings": ["3 specific findings from the data"],
  "recommendations": ["3 actionable recommendations based on the scores"],
  "trendsAnalysis": "A paragraph analyzing changes from last week (or noting this is the first report)"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a personalized health AI assistant. Provide actionable, evidence-based health insights based on the user's specific data. Be encouraging but honest about areas that need improvement.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: "json_object" },
  });

  const reportData = JSON.parse(completion.choices[0].message.content!);

  // Save to database
  const weekNumber = getWeekNumber(new Date());
  await prisma.weeklyInsight.create({
    data: {
      userId,
      weekNumber,
      year: new Date().getFullYear(),
      cardiovascularScore: metrics.cardiovascularScore,
      metabolicScore: metrics.metabolicScore,
      inflammationScore: metrics.inflammationScore,
      recommendations: reportData,
    },
  });

  return reportData;
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
File: app/api/insights/generate/route.ts
typescriptimport { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateWeeklyReport } from "@/lib/ai/reportGenerator";

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await generateWeeklyReport(session.user.id);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
🛑 CHECKPOINT 3.1: Test AI report generation, then commit

Checkpoint 3.2: Chat Interface
File: app/api/chat/route.ts
typescriptimport { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { openai } from "@/lib/ai/openai";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question } = await request.json();

    // Get user's latest reports and insights
    const userReports = await prisma.report.findMany({
      where: { userId: session.user.id },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const latestInsight = await prisma.weeklyInsight.findFirst({
      where: { userId: session.user.id },
      orderBy: { generatedAt: "desc" },
    });

    // Build context from user's data
    const reportsContext = userReports
      .map((r) => {
        const data = r.parsedData as any;
        if (r.type === "BLOOD_TEST" && data?.biomarkers) {
          return `Blood Test (${r.createdAt.toLocaleDateString()}): ${Object.entries(data.biomarkers)
            .map(([key, value]: [string, any]) => `${key}: ${value.value} ${value.unit}`)
            .join(", ")}`;
        }
        if (r.type === "DNA" && data?.variants) {
          return `DNA Report: ${Object.keys(data.variants).length} variants analyzed`;
        }
        if (r.type === "MICROBIOME" && data?.diversity) {
          return `Microbiome Report: Shannon diversity ${data.diversity.shannon}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");

    const context = `
User's Health Data Summary:
${reportsContext}

Latest Health Scores:
- Cardiovascular: ${latestInsight?.cardiovascularScore || "N/A"}/100
- Metabolic: ${latestInsight?.metabolicScore || "N/A"}/100
- Inflammation: ${latestInsight?.inflammationScore || "N/A"}/100

User Question: ${question}

Provide a specific answer based ONLY on the user's uploaded data. Be helpful and informative but do not provide general health advice not supported by their specific data.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a health data assistant that explains health reports based strictly on uploaded user data. Be friendly, clear, and specific to their data. Do not provide general health advice.",
        },
        {
          role: "user",
          content: context,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const answer = completion.choices[0].message.content;

    // Save to chat history
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: "user",
        content: question,
      },
    });

    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: "assistant",
        content: answer || "",
      },
    });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}
File: components/chat/ChatBot.tsx
typescript"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";

export function ChatBot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      if (data.answer) {
        setAnswer(data.answer);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setAnswer("Sorry, I couldn't process your question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask About Your Health Data</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask a question about your reports..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {answer && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
🛑 CHECKPOINT 3.2: Test chat functionality, then commit

Checkpoint 3.3: Dashboard UI
File: components/charts/HealthMetrics.tsx
typescript"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HealthMetricsProps {
  current: {
    cardiovascularScore: number;
    metabolicScore: number;
    inflammationScore: number;
  };
  history?: Array<{
    week: string;
    cardiovascular: number;
    metabolic: number;
    inflammation: number;
  }>;
}

export function HealthMetricsChart({ current, history }: HealthMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Cardiovascular</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{current.cardiovascularScore}/100</div>
          <p className="text-xs text-muted-foreground">
            {current.cardiovascularScore > 70 ? "Needs attention" : "Good"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Metabolic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{current.metabolicScore}/100</div>
          <p className="text-xs text-muted-foreground">
            {current.metabolicScore > 70 ? "Needs attention" : "Good"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Inflammation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{current.inflammationScore}/100</div>
          <p className="text-xs text-muted-foreground">
            {current.inflammationScore > 70 ? "Needs attention" : "Good"}
          </p>
        </CardContent>
      </Card>

      {history && history.length > 0 && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cardiovascular"
                  stroke="#ef4444"
                  name="Cardiovascular"
                />
                <Line
                  type="monotone"
                  dataKey="metabolic"
                  stroke="#10b981"
                  name="Metabolic"
                />
                <Line
                  type="monotone"
                  dataKey="inflammation"
                  stroke="#f59e0b"
                  name="Inflammation"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
File: app/dashboard/page.tsx
typescriptimport { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { HealthMetricsChart } from "@/components/charts/HealthMetrics";
import { UploadCard } from "@/components/upload/UploadCard";
import { ChatBot } from "@/components/chat/ChatBot";
import { Button } from "@/components/ui/button";
import { calculateHealthMetrics } from "@/lib/correlations";
import { prisma } from "@/lib/db";

export default async function Dashboard() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get current metrics
  const metrics = await calculateHealthMetrics(session.user.id);

  // Get historical data
  const insights = await prisma.weeklyInsight.findMany({
    where: { userId: session.user.id },
    orderBy: { generatedAt: "desc" },
    take: 8,
  });

  const history = insights
    .map((insight) => ({
      week: `Week ${insight.weekNumber}`,
      cardiovascular: insight.cardiovascularScore || 0,
      metabolic: insight.metabolicScore || 0,
      inflammation: insight.inflammationScore || 0,
    }))
    .reverse();

  // Get recent reports
  const reports = await prisma.report.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Health Dashboard</h1>
        <form action="/api/insights/generate" method="POST">
          <Button type="submit">Generate Weekly Report</Button>
        </form>
      </div>

      <HealthMetricsChart current={metrics} history={history} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
            {reports.length === 0 ? (
              <p className="text-gray-500">No reports uploaded yet</p>
            ) : (
              <ul className="space-y-2">
                {reports.map((report) => (
                  <li key={report.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{report.type}</span>
                      <span className="text-sm text-gray-500 ml-2">{report.fileName}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {report.createdAt.toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <UploadCard />
          <ChatBot />
        </div>
      </div>
    </div>
  );
}
🛑 CHECKPOINT 3.3: Test complete dashboard functionality, then commit

Checkpoint 3.4: Environment & Package Setup
File: .env.local
envNEXTAUTH_SECRET=your-secret-key-at-least-32-characters
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
DATABASE_URL=file:./dev.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
File: package.json
json{
  "name": "for-your-health-mvp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@next-auth/prisma-adapter": "^1.0.7",
    "@prisma/client": "^5.7.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.312.0",
    "next": "14.1.0",
    "next-auth": "^4.24.0",
    "openai": "^4.24.0",
    "pdf-parse": "^1.1.1",
    "react": "^18",
    "react-dom": "^18",
    "react-dropzone": "^14.2.3",
    "recharts": "^2.10.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "postcss": "^8",
    "prisma": "^5.7.0",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.7.0",
    "typescript": "^5"
  }
}
Commands to run:
bashnpm install
npx prisma generate
npm run dev
🛑 CHECKPOINT 3.4: Ensure all dependencies install and app runs, then commit

FINAL TESTING CHECKLIST

Authentication Flow

 Register new user
 Login/logout
 Protected routes work


File Upload

 Upload blood test PDF
 Upload DNA raw data
 Upload microbiome report
 Files save to /uploads directory


Data Parsing

 Blood test biomarkers extracted
 DNA variants identified
 Microbiome metrics calculated


Health Metrics

 Scores calculate correctly
 Dashboard displays metrics
 Trends chart shows history


AI Features

 Generate weekly report
 Chat responds with user data
 No general health advice


Performance

 Pages load quickly
 No console errors
 Mobile responsive



🛑 FINAL CHECKPOINT: Complete all tests, then commit
git add .
git commit -m "feat: complete MVP implementation"
git push origin main