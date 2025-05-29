import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { calculatePearson, calculatePValue } from '@/lib/utils/correlation';

// Define the types we'll be using
interface BiomarkerData {
  id: string;
  reportId: string;
  name: string;
  value: number;
  unit: string | null;
  range: string | null;
  flag: string | null;
  description: string | null;
  category: string | null;
}

interface BiomarkerWithDate extends BiomarkerData {
  testDate: Date | null;
}

interface BiomarkerWithDate {
  id: string;
  reportId: string;
  name: string;
  value: number;
  unit: string | null;
  range: string | null;
  flag: string | null;
  description: string | null;
  category: string | null;
  testDate: Date;
}

interface CorrelationResult {
  id: string;
  biomarker1: string;
  biomarker2: string;
  correlation: number;
  pValue: number;
  significance: string;
  observationCount: number;
  coefficient?: number;
  sampleSize?: number;
}

export async function GET() {
  console.log('Correlations endpoint called');
  
  try {
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('No session or email found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Fetching user data for:', session.user.email);
    
    // First get the user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      console.log('No user found with email:', session.user.email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all reports for the user
    const userReports = await prisma.report.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' as const }
    });

    // If no reports found, return empty result
    if (userReports.length === 0) {
      console.log('No reports found for user:', user.id);
      return NextResponse.json({
        biomarkers: [],
        correlations: [],
        message: 'No reports found for this user. Please upload some reports first.'
      });
    }

    // Get all biomarkers for the user's reports
    const reportIds = userReports.map(report => report.id);
    let allBiomarkers: BiomarkerData[] = [];
    
    if (reportIds.length > 0) {
      allBiomarkers = await prisma.$queryRaw`
        SELECT * FROM "Biomarker"
        WHERE "reportId" IN (${reportIds.join(',')})
      ` as BiomarkerData[];
    }

    // Create a map of reportId to biomarkers
    const biomarkersByReportId = allBiomarkers.reduce((acc, biomarker) => {
      if (!acc[biomarker.reportId]) {
        acc[biomarker.reportId] = [];
      }
      acc[biomarker.reportId].push(biomarker);
      return acc;
    }, {} as Record<string, typeof allBiomarkers>);

    // Log the first few biomarkers for debugging
    console.log('Sample biomarkers from database:', allBiomarkers.slice(0, 3));

    // Combine reports with their biomarkers
    const reports = userReports.map(report => {
      const reportBiomarkers = biomarkersByReportId[report.id] || [];
      console.log(`Report ${report.id} (${report.type}) has ${reportBiomarkers.length} biomarkers`);
      return {
        ...report,
        biomarkers: reportBiomarkers
      };
    });
    
    console.log(`Found ${reports.length} reports with a total of ${allBiomarkers.length} biomarkers`);
    
    if (reports.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reports found for this user',
        biomarkers: [],
        correlations: [],
        reportCount: 0,
        biomarkerCount: 0,
        correlationCount: 0
      });
    }

    // Process the biomarkers data
    const biomarkers: BiomarkerWithDate[] = [];
    const biomarkerMap = new Map<string, {values: number[], dates: Date[]}>();
    
    // Process each report and its biomarkers
    reports.forEach((report: any) => {
      const reportBiomarkers = report.biomarkers || [];
      console.log(`Processing ${reportBiomarkers.length} biomarkers for report ${report.id} (${report.type})`);
      
      reportBiomarkers.forEach((biomarker: any) => {
        try {
          const key = biomarker.name ? biomarker.name.toLowerCase().trim() : null;
          if (!key) {
            console.warn('Skipping biomarker with missing name:', biomarker);
            return;
          }
          
          const value = parseFloat(biomarker.value);
          if (isNaN(value)) {
            console.warn(`Skipping biomarker ${key} with invalid value:`, biomarker.value);
            return;
          }
          
          if (!biomarkerMap.has(key)) {
            biomarkerMap.set(key, { values: [], dates: [] });
          }
          
          const entry = biomarkerMap.get(key)!;
          entry.values.push(value);
          entry.dates.push(report.testDate || new Date(report.createdAt) || new Date());
          
          // Add to flat list for response
          biomarkers.push({
            ...biomarker,
            value,
            testDate: report.testDate || new Date(report.createdAt) || new Date()
          });
        } catch (error) {
          console.error('Error processing biomarker:', error, biomarker);
        }
      });
    });
    
    console.log(`Processed ${biomarkerMap.size} unique biomarkers`);
    
    console.log(`Processed ${biomarkers.length} biomarkers from ${reports.length} reports`);
    
    // Calculate correlations
    const biomarkerNames = Array.from(biomarkerMap.keys());
    const correlations: CorrelationResult[] = [];
    
    // Only calculate correlations if we have at least 2 biomarkers with data
    if (biomarkerNames.length >= 2) {
      for (let i = 0; i < biomarkerNames.length; i++) {
        for (let j = i + 1; j < biomarkerNames.length; j++) {
          const name1 = biomarkerNames[i];
          const name2 = biomarkerNames[j];
          const data1 = biomarkerMap.get(name1)!;
          const data2 = biomarkerMap.get(name2)!;
          
          // Only calculate if we have matching data points
          if (data1.values.length === data2.values.length && data1.values.length > 2) {
            const correlation = calculatePearson(data1.values, data2.values);
            const pValue = calculatePValue(correlation, data1.values.length);
            
            correlations.push({
              id: `${name1}-${name2}`,
              biomarker1: name1,
              biomarker2: name2,
              correlation,
              pValue,
              significance: pValue < 0.05 ? 'significant' : 'not significant',
              observationCount: data1.values.length,
              coefficient: correlation,
              sampleSize: data1.values.length
            });
          }
        }
      }
    }

    // Sort by absolute correlation strength
    const sortedCorrelations = correlations
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 50) // Limit to top 50 strongest correlations
      .map((corr, index) => ({
        id: `corr-${index}`,
        ...corr,
      }));

    return NextResponse.json({ correlations: sortedCorrelations });

  } catch (error) {
    console.error('Error fetching correlations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch correlations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
