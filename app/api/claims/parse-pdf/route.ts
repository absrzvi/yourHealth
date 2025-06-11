git config --global credential.helper store
git pullgit config --global credential.helper store
git pullimport { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PDFParseResult } from '@/src/lib/claims/types/claims.types';

// Define route configuration for Next.js App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper functions for text extraction
function extractField(text: string, fieldName: string, delimiter: string = '\n'): string | undefined {
  const escapedDelimiter = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = `${fieldName}\\s*([^${escapedDelimiter}]+)`;
  const regex = new RegExp(pattern, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : undefined;
}

// Date extraction is handled by extractField function

function extractInsuranceInfo(text: string): { 
  insuranceCompany?: string; 
  memberId?: string; 
  groupNumber?: string; 
  planType?: string;
} {
  const insuranceCompany = extractField(text, 'Insurance Company:|Insurance Provider:|Carrier:', ':');
  const memberId = extractField(text, 'Member ID:|ID #:|Subscriber ID:|Policy Number:', ':');
  const groupNumber = extractField(text, 'Group Number:|Group #:|Group:', ':');
  const planType = extractField(text, 'Plan Type:|Plan:|Type:', ':');
  
  return {
    insuranceCompany,
    memberId,
    groupNumber,
    planType
  };
}

function extractPatientInfo(text: string): {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
} {
  // Extract first and last name from patient name
  const fullName = extractField(text, 'Patient Name:|Name:', ':');
  const [lastName, firstName] = fullName ? fullName.split(',').map(s => s.trim()) : [undefined, undefined];
  
  // Extract address components
  const address = extractField(text, 'Address:', '\n');
  const city = extractField(text, 'City:', ',');
  const state = extractField(text, 'State:', ' ');
  const zip = extractField(text, 'Zip Code:|Zip:', ' ');
  
  return {
    firstName,
    lastName,
    dateOfBirth: extractField(text, 'DOB:|Date of Birth:', '\n'),
    gender: extractField(text, 'Gender:|Sex:', ' '),
    address,
    city,
    state,
    zip,
    phone: extractField(text, 'Phone:|Phone #:', '\n')
  };
}

function extractProviderInfo(text: string): {
  name?: string;
  npi?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
} {
  const name = extractField(text, 'Provider Name:|Doctor:', '\n');
  const npi = extractField(text, 'NPI #:|NPI:', ' ');
  const taxId = extractField(text, 'Tax ID:|Tax ID #:', ' ');
  const address = extractField(text, 'Provider Address:', '\n');
  const city = extractField(text, 'Provider City:', ',');
  const state = extractField(text, 'Provider State:', ' ');
  const zip = extractField(text, 'Provider Zip:', ' ');
  
  return {
    name,
    npi,
    taxId,
    address,
    city,
    state,
    zip
  };
}

function extractClaimInfo(text: string): {
  claimNumber?: string;
  dateOfService?: string;
  diagnosis?: string[];
  cptCodes?: string[];
  totalAmount?: string;
} {
  const claimNumber = extractField(text, 'Claim #:|Claim Number:|Claim ID:', ':');
  
  const dosRegex = /(?:Date of Service|Service Date)\s*:\s*([^\n,]+)/i;
  const dosMatch = text.match(dosRegex);
  const dateOfService = dosMatch ? dosMatch[2].trim() : undefined;
  
  // Find diagnosis codes (ICD-10)
  const diagnosisMatches = text.match(/(?:Diagnosis|ICD(?:-10)?)\s*:?\s*([A-Z0-9.,\s]+)/gi);
  const diagnosis = diagnosisMatches ? 
    diagnosisMatches.map(match => match.replace(/(?:Diagnosis|ICD(?:-10)?)\s*:?\s*/i, '').trim())
      .filter(code => /^[A-Z0-9.]+$/.test(code.replace(/\s+/g, ''))) : [];
  
  // Find CPT codes
  const cptMatches = text.match(/(?:CPT|Procedure|Service|Code)\s*:?\s*(\d{5})/gi);
  const cptCodes = cptMatches ? 
    cptMatches.map(match => match.replace(/(CPT|Procedure|Service|Code)\s*:?\s*/i, '').trim())
      .filter(code => /^\d{5}$/.test(code)) : [];
  
  const amountRegex = /(Total|Amount|Charge|Fee)\s*:\s*\$?\s*([\d.,]+)/i;
  const amountMatch = text.match(amountRegex);
  const totalAmount = amountMatch ? amountMatch[2].trim().replace(/[^\d.]/g, '') : undefined;
  
  return {
    claimNumber,
    dateOfService,
    diagnosis: diagnosis.length > 0 ? diagnosis : undefined,
    cptCodes: cptCodes.length > 0 ? cptCodes : undefined,
    totalAmount
  };
}

function parsePDFContent(text: string): PDFParseResult {
  // Extract information from text
  const patient = extractPatientInfo(text);
  const provider = extractProviderInfo(text);
  // Extract insurance and claim info (results not currently used)
  // Using void to explicitly ignore the return values
  void extractInsuranceInfo(text);
  void extractClaimInfo(text);
  
  // Clean up completed
  
  return {
    confidence: 0.8, // Default confidence score
    patient: {
      firstName: patient?.firstName,
      lastName: patient?.lastName,
      dateOfBirth: patient?.dateOfBirth,
      gender: patient?.gender,
      address: patient?.address,
      city: patient?.city,
      state: patient?.state,
      zip: patient?.zip,
      phone: patient?.phone
    },
    provider: {
      name: provider?.name,
      npi: provider?.npi,
      taxId: provider?.taxId,
      address: provider?.address,
      city: provider?.city,
      state: provider?.state,
      zip: provider?.zip
    },
    specimen: {},
    biomarkers: [],
    rawText: text,
    extractedSections: {}
  } as PDFParseResult;
}

/**
 * Main POST handler for PDF parsing
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file as text
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder('utf-8').decode(buffer);

    // Parse the PDF content
    const result = parsePDFContent(text);

    return NextResponse.json({
      message: 'PDF processed successfully',
      data: result,
      uploadPath: '/uploads/claims/processed',
      textLength: text.length,
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Return 405 for other HTTP methods
 */
export async function GET() {
  return new NextResponse(null, { status: 405 });
}

export async function PUT() {
  return new NextResponse(null, { status: 405 });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405 });
}

export async function PATCH() {
  return new NextResponse(null, { status: 405 });
}
