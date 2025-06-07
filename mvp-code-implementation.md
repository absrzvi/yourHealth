For Your Health MVP - Complete Implementation Code
WINDSURF INSTRUCTIONS
IMPORTANT: Use the code provided below exactly as written. Only generate new code if absolutely necessary for connecting components. This is an UPDATE to an existing application, not a new build. Follow the checkpoints and pause for testing at each one.

## Claims/EDI Features Update (2025-06-06)

### Claim Update & UI Enhancements
- Fixed 400 Bad Request error when updating claims
  - Made `claimLines` optional for updates using `isUpdate` flag in validation
  - Modified PUT endpoint to allow partial updates and keeping the same status
  - Refined frontend to send only necessary fields for updates
- Added status transition UI features
  - Created color-coded status transition legend showing valid workflow transitions
  - Implemented color-coded claim rows in the claims table based on status
  - Improved visual clarity for claim status workflow compliance

### EDI 837 File Generation & Viewing
- Implemented EDI 837 file generation for healthcare claims
  - Created `EDI837Generator` class to build compliant X12 837P segments
  - Added formatting utilities for EDI dates, times, and control numbers
  - Implemented proper segment building with required loops and fields

- Added in-app EDI viewer modal with tabbed interface
  - Created Dialog component using Radix UI primitives
  - Implemented Tabs component with formatted and raw EDI views
  - Added download functionality for generated EDI files
  - Provided clear loading/error states and user feedback
  
- Implemented new API endpoints for EDI management
  - Added `/api/claims/[id]/edi` endpoint to fetch existing EDI content
  - Added `/api/claims/[id]/generate-edi` endpoint to create new EDI files
  - Enhanced error handling with descriptive messages
  - Added database storage for EDI files to avoid regeneration

- Updated database schema for EDI file storage
  - Added `EdiFile` model to Prisma schema
  - Created relationship between claims and EDI files
  - Applied database migrations for the new model

### EDI File Download
- Added `/api/claims/download-edi/[fileName]` API endpoint for secure EDI file downloads.
  - Only serves `.edi` files from the `edi-files` directory.
  - Validates file names and restricts access to authenticated users.
  - Returns 404 if file not found, 400 if invalid request.

### ClaimsToolsPanel UI
- Updated EDI tab to:
  - Show a download button after EDI file generation, linking to the new endpoint.
  - Log all downloads via `/api/claims/log-edi-download` for audit/compliance.
  - Show errors if download or logging fails.

### Audit Logging
- `/api/claims/log-edi-download` API endpoint records all EDI downloads as `ClaimEvent` entries.
- Ensures HIPAA compliance and full traceability of access to PHI.

### Security & Compliance
- All endpoints require authentication.
- File serving and logging are designed for HIPAA compliance (no direct PHI exposure, full event audit trail).

Phase 1: Foundation & Core Infrastructure

### Checkpoint: Backend Type Safety & Metadata Enforcement (2025-06-06)
- Strict DocumentMetadata typing (url/domain fields)
- All backend usages refactored for type safety
- API return types made robust
- All main backend type errors resolved

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

Phase 2: OCR Normalization Enhancements
Checkpoint 2.1: Implement SafeOcrNormalizer and Refactor OcrNormalizer
File: lib/parsers/ocrNormalizer.ts
Status: Completed
Details:
- Moved substitution rules to `protected static readonly substitutions` in `OcrNormalizer`.
- Implemented `SafeOcrNormalizer` class with chunk-based processing logic, which calls static methods of `OcrNormalizer` for individual normalization steps or uses its own chunking for large inputs.
- Removed leftover debugging code and stray lines from `OcrNormalizer.fixCharacterSubstitutions`.
- Verified that all `OcrNormalizer` methods called by `SafeOcrNormalizer` are static.
- `SafeOcrNormalizer` unit tests were confirmed to be passing as part of the full test suite execution.
Next Steps:
- Monitor performance and error rates with diverse production data.
- Continuously refine substitution rules and chunking parameters as needed.
🛑 CHECKPOINT 2.1: `SafeOcrNormalizer` implemented and basic integration tested.

Checkpoint 2.1.1: Resolve Jest Mock and Memory Stability Issues
Files: 
- `lib/parsers/bloodTestParser.ts`
- `test/bloodTestParser.test.ts`
- `test/simple-parser.test.ts`
Status: Completed
Details:
- Integrated `SafeOcrNormalizer` into `BloodTestParser` by instantiating `SafeOcrNormalizer` and calling its `normalize` method. This resolved critical JavaScript heap out of memory errors during test runs with large OCR inputs.
- Refactored Jest mocks in `bloodTestParser.test.ts` and `simple-parser.test.ts` to correctly initialize mocks within the `jest.mock` factory, resolving `ReferenceError` and issues with mocking static methods.
- Corrected lint errors in `bloodTestParser.ts` related to `ExtractedBiomarker` type properties (`rawText` vs `rawLineText`).
- All Jest tests are now passing, confirming stability.
Next Steps:
- Maintain vigilance for any new Jest mock issues as the codebase evolves.
- Ensure test coverage remains high for parser components.
🛑 CHECKPOINT 2.1.1: Jest mocks fixed, memory issues resolved, and all tests passing. Commit changes.

Checkpoint 2.2: OCR Test Page UI Enhancements
File: public/ocr-test.html
Status: Completed
Details:
- Removed the 'Confidence' column from the parsed biomarkers results table.
- Implemented a client-side JavaScript dictionary (`biomarkerReferenceRanges`) for common biomarker reference ranges.
- Updated the 'Reference Range' column in the results table to use the dictionary first, then fall back to OCR-extracted data, then 'N/A'.
- Ensured the `checkValue` function (for 'Low', 'Normal', 'High' suggestions) uses the determined reference range.
- Added CSS rules to color-code the 'Suggestion' column text: green for 'Normal', orange for 'Low', and red for 'High'.
- Fixed JavaScript errors related to DOM element ID mismatches and missing variable declarations for result display tabs.
Next Steps:
- Review and update the `biomarkerReferenceRanges` dictionary with clinically accurate, lab-specific reference ranges.
- Continue testing with various blood report formats.
🛑 CHECKPOINT 2.2: OCR test page UI enhancements completed and tested. Commit changes.

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
🛑 CHECKPOINT 2.1: Test basic parsing foundation for all report types, then commit.

Checkpoint 2.1.1: Advanced Blood Test OCR Parsing Enhancements
Description: Implemented significant enhancements to blood test report parsing, moving beyond basic regex to a more robust, multi-stage OCR processing and biomarker extraction pipeline. This addresses critical issues with specific biomarker value extraction and improves overall accuracy and resilience to varying report formats, aligning with the generic parsing strategy (see MEMORY[12646bf3-9f3a-4423-a568-c15232d5ff5f] and `blood-ocr-parsing.md` - MEMORY[2133d9d4-e1b9-484b-8d31-5f696f1d4550]). The core of this is `lib/parsers/BiomarkerExtractor.ts`, supported by `lib/parsers/biomarkerDictionary.ts` and `lib/parsers/ocrNormalizer.ts`.

Key improvements include:
- **Creatinine Decimal Inference**: `BiomarkerExtractor.validateAndEnhanceBiomarkers` now includes a heuristic to infer decimal points for Creatinine values (e.g., correcting OCR-extracted "14" to "1.4" mg/dL) when the integer value is significantly above the valid range but plausible if divided by 10. A `remarkId` of `'decimal_inferred_creatinine'` is added.
- **TSH Deduplication and Prioritization**: Implemented logic in `BiomarkerExtractor.validateAndEnhanceBiomarkers` to handle multiple TSH (`Thyroid Stimulating Hormone`) entries. It prioritizes entries not suspected to be date components (via `'date_component_suspected'` `remarkId` set in `createBiomarker`) and then selects the entry with the highest confidence score. This prevents misinterpretation of date components as TSH values.
- **Enhanced `createBiomarker`**: Modified to add `'date_component_suspected'` `remarkId` and include `remarkIds` in its return type, improving contextual information for downstream processing.
- **Comprehensive Dictionary and Normalization**: Leverages an expanded `BIOMARKER_DICTIONARY` (MEMORY[4fc54a74-34bd-40ba-aad3-2f039f296a08]) and improved OCR normalization rules in `ocrNormalizer.ts` (MEMORY[5a10782b-1649-46f9-8240-7e601ce3febd]) for better biomarker recognition and value validation.

This advanced system effectively supersedes the simplistic regex-based `lib/parsers/blood.ts` outlined earlier in Checkpoint 2.1 for blood test reports.

🛑 CHECKPOINT 2.1.1: Test advanced blood test parsing, especially Creatinine and TSH extraction, then commit.

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

## Phase 5: MCP-RAG AI Coach Implementation (June 2025)

### Checkpoint 5.1: MCP Server Setup & Hybrid Search
- Install `mcp`, `colbert-ai`, `chromadb`, `rank-bm25`, and all dependencies (CPU-only)
- Configure ColBERT-v2 for 8GB RAM, set up ChromaDB for vector storage
- Implement hybrid search: dense (ColBERT) + sparse (BM25)
- Test retrieval with sample queries

### Checkpoint 5.2: Medical Corpus Ingestion & Indexing
- Prepare medical documents/corpus for ingestion
- Preprocess and chunk content for optimal retrieval
- Ingest into vector DB (ChromaDB) with metadata
- Validate retrieval quality and document coverage

### Checkpoint 5.3: FastAPI Backend & WebSocket Integration
- Create FastAPI app with REST and WebSocket endpoints
- Implement `/query` for standard search, `/ws` for streaming
- Add request validation, error handling, markdown formatting
- Test backend locally with curl and websocket client

### Checkpoint 5.4: Agentic RAG & Lightweight Reranking
- Implement rule-based extraction for medical entities, code, protocols
- Add reranking with CPU-optimized cross-encoder model
- Integrate citation system for factual claims
- Validate output with clinical scenarios

### Checkpoint 5.5: React Frontend Integration (WebSocket Streaming)
- Build React chat component with `react-use-websocket`
- Implement real-time streaming of AI responses
- Add message formatting, typing indicator, error feedback
- Ensure accessibility and responsive design

### Checkpoint 5.6: Dockerization & Deployment
- Write Dockerfile for backend (FastAPI + MCP + models)
- Add Docker Compose for full stack (backend, ChromaDB, frontend)
- Set memory/resource limits for all services
- Document environment variables and config

### Checkpoint 5.7: Testing, Optimization & Compliance
- Write unit/integration tests for backend and frontend
- Benchmark retrieval speed and memory usage
- Optimize chunking, search params for 8GB RAM
- Review for HIPAA compliance: security, logging, env vars
- Document all endpoints and configuration in README

🛑 CHECKPOINT 5.1: MCP server and hybrid search running locally, commit and test

Checkpoint 3.5: Blood Test Parser Implementation

The blood test parser has been implemented with the following design decisions:

1. **Modular Architecture**:
   - Uses specialized components: SectionParser, BiomarkerExtractor, TextPreprocessor, RemarksExtractor, and BiomarkerValidator
   - Each component has a focused responsibility following the Single Responsibility Principle

2. **Metadata Extraction**:
   - Uses SectionParser.extractPatientInfo and SectionParser.extractLabInfo for robust data extraction
   - Updates class properties directly rather than returning objects
   - Handles multiple regex patterns for each data field to improve extraction accuracy

## Phase 4: Chat Functionality Enhancements (June 2025)

### Checkpoint 4.1: Chat Session Management

#### Backend API Updates
1. **Session Management**
   - Implemented RESTful endpoints for chat session CRUD operations
   - Added proper authentication and authorization checks
   - Optimized database queries with Prisma's query builder
   - Added proper error handling and validation

2. **Message Handling**
   - Replaced raw SQL with Prisma ORM for type safety
   - Implemented message streaming with Server-Sent Events (SSE)
   - Added proper error boundaries and retry mechanisms
   - Optimized database schema for chat messages and sessions

#### Frontend Updates
1. **Chat Interface**
   - Implemented real-time message streaming
   - Added typing indicators and loading states
   - Improved error handling and user feedback
   - Added mobile-responsive design

2. **State Management**
   - Implemented React Context for chat state
   - Added optimistic UI updates
   - Managed loading and error states
   - Added proper TypeScript types

### Checkpoint 4.2: Performance & Reliability

1. **Optimizations**
   - Implemented message pagination
   - Added database query optimization
   - Improved error handling and logging
   - Added proper cleanup for event listeners

2. **Security**
   - Added proper session validation
   - Implemented input sanitization
   - Added rate limiting
   - Improved error messages to avoid information leakage

### Checkpoint 4.3: Testing & Documentation

1. **Testing**
   - Added unit tests for chat components
   - Added integration tests for API endpoints
   - Added end-to-end tests for chat flows
   - Implemented test coverage reporting

2. **Documentation**
   - Updated API documentation
   - Added inline code documentation
   - Created user guides
   - Updated architecture diagrams

### Implementation Details

#### Database Schema Updates
```prisma
model ChatSession {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  ChatMessage[]
  user      User     @relation(fields: [userId], references: [id])
}

model ChatMessage {
  id        String   @id @default(cuid())
  sessionId String
  role      String   // 'user' or 'assistant'
  content   String
  createdAt DateTime @default(now())
  session   ChatSession @relation(fields: [sessionId], references: [id])
}
```

#### Key API Endpoints
- `GET /api/chat/sessions` - List all chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `DELETE /api/chat/sessions?sessionId=:id` - Delete chat session
- `GET /api/chat/messages?sessionId=:id` - Get messages for a session
- `POST /api/chat/messages` - Send new message

### Next Steps
1. Implement advanced AI features (context awareness, follow-up questions)
2. Add support for file uploads in chat
3. Implement message reactions and rich text formatting
4. Add voice input/output support
5. Implement multi-language support

🛑 CHECKPOINT 4.3: Chat functionality enhancements completed and tested. Commit changes.

3. **Error Handling**:
   - Implements robust error logging with detailed messages and stack traces during development
   - Logs extraction steps and results for debugging purposes
   - Error handling will be simplified in later stages after thorough testing

4. **HIPAA Compliance (Future Work)**:
   - Current implementation is HIPAA-aware but requires enhancements before production
   - Need to implement encryption for all extracted PHI
   - Must improve logging to mask or hash sensitive information
   - Should add authentication verification and role-based access
   - Future improvements include audit trails and data minimization

5. **Testing Approach**:
   - Comprehensive test suite covers all components
   - Tests for different report formats and edge cases
   - Includes both unit tests and integration tests

Blood Test Parser Usage Example:
```typescript
// Create parser instance
const parser = new BloodTestParser(null, reportContent);

// Parse content
const result = await parser.parse();

// Check success
if (result.success) {
  const data = result.data;
  console.log(`Found ${data.biomarkers.length} biomarkers`);
  console.log(`Patient: ${data.patientInfo.name}, Lab: ${data.labInfo.name}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

These decisions ensure a reliable, maintainable parser that can handle the variety of blood test report formats while preparing for future HIPAA compliance requirements.

🛑 CHECKPOINT 3.5: Verify blood test parser functionality, then commit

## Phase 5: Insurance Claims & Eligibility Features (June 2025)

### Checkpoint 5.1: Insurance Eligibility Verification

#### Implementation Overview
1. **Backend API Enhancements**
   - Fixed authentication in eligibility API endpoint using NextAuth's `getServerSession`
   - Changed enum approach to string literals for eligibility status
   - Enhanced ClaimEvent creation logic with proper error handling
   - Added conditional claim event creation based on claimId validity
   - Implemented proper database integrity with required relationship connections

2. **Frontend Component Fixes**
   - Corrected JSX syntax errors in InsuranceManager.tsx
   - Fixed dialog component nesting with proper React Fragment usage
   - Improved UI for showing eligibility status and details
   - Enhanced error handling and loading states

3. **Eligibility Check System**
   - Implemented eligibility verification with coverage details
   - Created modular eligibility checker with caching functionality
   - Added support for basic eligibility checks when real-time APIs unavailable
   - Included detailed coverage information (deductible, coinsurance, out-of-pocket max)
   - Stored eligibility check results for audit and analysis

#### Key Components Updated
- `InsuranceManager.tsx`: Fixed UI and dialog display
- `app/api/claims/eligibility/route.ts`: Corrected authentication and database operations
- `lib/claims/eligibility/checker.ts`: Core eligibility verification system

#### Security & Compliance
- Protected all endpoints with proper authentication
- Ensured all eligibility checks are logged for HIPAA compliance
- Added proper error handling and user feedback

🛑 CHECKPOINT 5.1: Insurance Eligibility Verification completed and tested. Commit changes.

### Checkpoint 5.2: Claims Management System (Pending)

1. **Claims Creation & Updates**
   - [ ] Implement claim creation with multiple service lines
   - [ ] Add validation for required claim fields
   - [ ] Implement claim status workflow
   - [ ] Create UI for claim management

2. **Security & Integration**
   - [ ] Ensure HIPAA compliance for all operations
   - [ ] Integrate with eligibility verification system
   - [ ] Add audit logging for claim modifications

### Next Steps
1. Fix 'Remember Me' functionality in authentication flow
2. Implement Claims Management System as outlined in Checkpoint 5.2
3. Enhance AI Coach with health metric feedback
4. Add support for additional health report types
5. Improve dashboard visualizations and insights

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


Insurance & Claims

 ✓ Eligibility verification works
 ✓ Coverage details display correctly
 ☐ Claim creation and submission
 ☐ Claim status workflow management


Performance

 Pages load quickly
 No console errors
 Mobile responsive



🛑 FINAL CHECKPOINT: Complete all tests, then commit
git add .
git commit -m "feat: complete MVP implementation"
git push origin main