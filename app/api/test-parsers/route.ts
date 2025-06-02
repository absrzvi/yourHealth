import { NextRequest, NextResponse } from 'next/server';
import { BloodTestParser } from '@/lib/parsers/bloodTestParser';
import { DNAParser } from '@/lib/parsers/dnaParser';
import { MicrobiomeParser } from '@/lib/parsers/microbiomeParser';
import { ParserFactory } from '@/lib/parsers/parserFactory';
import fs from 'fs';
import path from 'path';

// Simple API route to test our parsers with the sample data
export async function GET(request: NextRequest) {
  try {
    const testResults: Record<string, any> = {};
    const sampleDir = path.join(process.cwd(), 'test-data');
    
    // Make sure the test data directory exists
    if (!fs.existsSync(sampleDir)) {
      return NextResponse.json({ 
        error: 'Test data directory not found',
        path: sampleDir
      }, { status: 404 });
    }

    // Get all sample files
    const samples = {
      bloodTest: path.join(sampleDir, 'blood-test-sample.txt'),
      dna: path.join(sampleDir, 'dna-sample.txt'),
      microbiome: path.join(sampleDir, 'microbiome-sample.txt')
    };

    // Test each parser with its sample data
    for (const [type, filePath] of Object.entries(samples)) {
      try {
        if (!fs.existsSync(filePath)) {
          testResults[type] = { error: `Sample file not found: ${filePath}` };
          continue;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);
        
        // Create a mock File object (needed for parser API)
        const mockFile = new File([content], fileName, {
          type: 'text/plain'
        });

        // Test type detection
        const detectedType = await ParserFactory.detectReportType(mockFile, content);
        
        // Map sample types to parser types
        const parserTypes = {
          bloodTest: 'BLOOD_TEST',
          dna: 'DNA',
          microbiome: 'MICROBIOME'
        };
        
        // Create and run the appropriate parser
        const parserType = parserTypes[type as keyof typeof parserTypes];
        const parser = await ParserFactory.createParser(mockFile, parserType, content);
        const parsingResult = await parser.parse();
        
        testResults[type] = {
          detectedType,
          parsingResult,
          fileName
        };
      } catch (error) {
        testResults[type] = { 
          error: `Error testing ${type}: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    }

    return NextResponse.json({
      results: testResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test-parsers API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
