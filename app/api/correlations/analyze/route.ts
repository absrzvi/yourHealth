import { NextRequest, NextResponse } from 'next/server';
import { BloodTestParser } from '../../../../lib/parsers/BloodTestParser';
import { DnaReportParser } from '../../../../lib/parsers/DnaReportParser';
import { MicrobiomeReportParser } from '../../../../lib/parsers/MicrobiomeReportParser';
import { analyzeBloodTestReport } from '../../../../lib/correlations/pipeline';
import { calculateCorrelations, filterSignificantCorrelations, topCorrelations } from '../../../../lib/correlations/CorrelationEngine';

// Helper to detect report type
function detectReportType(content: string): 'BLOOD_TEST' | 'DNA' | 'MICROBIOME' | null {
  if (content.trim().startsWith('{')) return 'MICROBIOME';
  if (content.includes('rsid') && content.includes('genotype')) return 'DNA';
  if (content.includes('WBC') || content.includes('HGB')) return 'BLOOD_TEST';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const reportType = detectReportType(body);
    if (!reportType) {
      return NextResponse.json({ error: 'Unknown or unsupported report format.' }, { status: 400 });
    }

    let correlations = [];
    if (reportType === 'BLOOD_TEST') {
      correlations = await analyzeBloodTestReport(body);
    } else if (reportType === 'DNA') {
      const parser = new DnaReportParser();
      const biomarkers = await parser.parse(body);
      const allCorrelations = calculateCorrelations(biomarkers);
      correlations = topCorrelations(filterSignificantCorrelations(allCorrelations, 0.05), 5);
    } else if (reportType === 'MICROBIOME') {
      const parser = new MicrobiomeReportParser();
      const biomarkers = await parser.parse(body);
      const allCorrelations = calculateCorrelations(biomarkers);
      correlations = topCorrelations(filterSignificantCorrelations(allCorrelations, 0.05), 5);
    }

    return NextResponse.json({ correlations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error.' }, { status: 500 });
  }
}
