import { EDI837Generator, type EnhancedClaim } from '../lib/claims/edi';
import { ClaimStatus, type Claim } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('EDI837Generator', () => {
  let generator: EDI837Generator;
  let sampleClaim: EnhancedClaim;

  beforeEach(() => {
    generator = new EDI837Generator();
    
    // Create a sample claim for testing that matches the EnhancedClaim interface
    const now = new Date();
    sampleClaim = {
      id: 'test-claim-123',
      userId: 'user-123',
      reportId: null,
      insurancePlanId: 'ins-123',
      claimNumber: 'CLM-2023-001',
      status: 'SUBMITTED',
      totalCharge: 1250.75,
      allowedAmount: null,
      paidAmount: null,
      patientResponsibility: null,
      denialReason: null,
      notes: 'Test claim for EDI generation',
      controlNumber: 'CTRL123',
      
      // Service dates
      serviceDate: now,
      serviceStartDate: new Date('2023-01-15'),
      serviceEndDate: new Date('2023-01-15'),
      billDate: new Date('2023-01-20'),
      
      // Patient information
      patientFirstName: 'John',
      patientLastName: 'Doe',
      patientDob: new Date('1980-05-15'),
      patientGender: 'M',
      patientAddress: '123 Main St',
      patientCity: 'Anytown',
      patientState: 'CA',
      patientZip: '90210',
      patientPhone: '555-123-4567',
      
      // Insurance information
      memberId: 'MEMBER123',
      groupNumber: 'GROUP123',
      groupName: 'Test Group',
      relationshipCode: '18', // Self
      
      // Provider information
      provider: 'Dr. Jane Smith',
      providerNpi: '1234567890',
      providerTaxId: '123456789',
      providerAddress: '123 Medical Dr',
      providerCity: 'Anytown',
      providerState: 'CA',
      providerZip: '90210',
      providerPhone: '555-987-6543',
      providerTaxonId: '1234567890',
      
      // Place of service
      placeOfService: '11', // Office
      
      // Claim lines
      claimLines: [
        {
          id: 'line-1',
          claimId: 'test-claim-123',
          lineNumber: 1,
          cptCode: '80053',
          description: 'Comprehensive metabolic panel',
          charge: 125.00,
          units: 1,
          modifier: null,
          serviceDate: now,
          diagnosisPointers: '1',
          allowedAmount: null,
          paidAmount: null,
          status: 'SERVICE_LINE_STATUS',
          diagnosisCodes: ['E78.5'],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'line-2',
          claimId: 'test-claim-123',
          lineNumber: 2,
          cptCode: '85025',
          description: 'Complete blood count',
          charge: 45.50,
          units: 1,
          modifier: null,
          serviceDate: now,
          diagnosisPointers: '1',
          allowedAmount: null,
          paidAmount: null,
          status: 'SERVICE_LINE_STATUS',
          diagnosisCodes: ['D64.9'],
          createdAt: now,
          updatedAt: now,
        }
      ],
      
      // Insurance plan information
      insurancePlan: {
        id: 'ins-123',
        userId: 'user-123',
        payerId: 'payer-123',
        payerName: 'Test Insurance Co',
        planName: 'Gold PPO',
        memberId: 'MEMBER123',
        groupNumber: 'GROUP123',
        groupName: 'Test Group',
        subscriberName: 'John Doe',
        subscriberDOB: new Date('1980-05-15'),
        relationToInsured: 'self',
        effectiveDate: new Date('2022-01-01'),
        expirationDate: new Date('2023-12-31'),
        createdAt: now,
        updatedAt: now,
      },
      
      // Timestamps
      createdAt: now,
      updatedAt: now
    } as unknown as EnhancedClaim; // Cast to bypass TypeScript type checking for test data
  });

  describe('generateEDI', () => {
    // Helper function to run the test with detailed logging
    async function runEDIGenerationTest() {
      console.log('\n===== Starting EDI Generation Test =====');
      
      // Generate EDI content
      console.log('\n[1/3] Generating EDI content...');
      const startTime = Date.now();
      const ediContent = await generator.generateEDI(sampleClaim);
      const generationTime = Date.now() - startTime;
      
      console.log(`✅ EDI Generation completed in ${generationTime}ms`);
      
      // Basic validation
      console.log('\n[2/3] Running validations...');
      
      // Check if content is defined and a string
      if (!ediContent) {
        throw new Error('❌ EDI content is undefined');
      }
      
      console.log(`📄 EDI Content Type: ${typeof ediContent}`);
      console.log(`📏 EDI Content Length: ${ediContent.length} characters`);
      
      // Basic type and content checks
      expect(ediContent).toBeDefined();
      expect(ediContent).toBeTruthy();
      expect(typeof ediContent).toBe('string');
      
      // Check segment terminators
      console.log('\n[3/3] Validating segment structure...');
      if (!ediContent.endsWith('~')) {
        console.log('❌ EDI content does not end with segment terminator (~)');
        expect(ediContent.endsWith('~')).toBe(true);
      } else {
        console.log('✅ EDI content has correct segment terminator');
      }
      
      // Check for required segments
      const requiredSegments = [
        { segment: 'ISA*', description: 'ISA Segment' },
        { segment: 'GS*HC*', description: 'GS Segment' },
        { segment: 'ST*837*', description: 'ST Segment' },
        { segment: 'BHT*0019*00*', description: 'BHT Segment' },
        { segment: 'HL*1**20*1~', description: 'HL Segment' },
        { segment: 'CLM*CLM-2023-001', description: 'CLM Segment with claim number' },
        { segment: 'LX*1~', description: 'LX Segment' },
        { segment: 'SV1*HC:80053', description: 'SV1 Segment with CPT code' },
        { segment: 'SE*', description: 'SE Segment' },
        { segment: 'GE*', description: 'GE Segment' },
        { segment: 'IEA*', description: 'IEA Segment' }
      ];
      
      console.log('\n🔍 Checking for required segments:');
      let allSegmentsFound = true;
      
      // Check each required segment
      for (const { segment, description } of requiredSegments) {
        const isPresent = ediContent.includes(segment);
        console.log(`   ${isPresent ? '✅' : '❌'} ${description.padEnd(30)} (${segment})`);
        
        if (!isPresent) {
          allSegmentsFound = false;
          console.log(`   Missing required segment: ${description} (${segment})`);
        }
      }
      
      if (!allSegmentsFound) {
        throw new Error('One or more required segments are missing from the EDI content');
      }
      
      console.log('\n✅ All required segments found');
      
      // Return the generated content for further inspection if needed
      return ediContent;
    }
    
    it('should generate valid EDI 837 content', async () => {
      try {
        const ediContent = await runEDIGenerationTest();
        
        // If we get here, all validations passed
        console.log('\n✨ All EDI validations passed successfully!');
        
        // Log a sample of the EDI content for verification
        console.log('\n📋 Sample of generated EDI content:');
        console.log(ediContent.substring(0, 200) + '...');
        
      } catch (error) {
        console.log('\n❌ Test failed with error:', error);
        throw error;
      }
    });

    it('should include all required segments', async () => {
      const ediContent = await generator.generateEDI(sampleClaim);
      const segments = ediContent.split('~');
      
      // Check for required segments
      const segmentTypes = segments.map(s => s.split('*')[0].trim()).filter(Boolean);
      
      // Helper to check if a segment type exists (case-insensitive and ignoring whitespace)
      const hasSegmentType = (type: string) => 
        segmentTypes.some(t => t.trim().toUpperCase() === type.trim().toUpperCase());
      
      expect(hasSegmentType('ISA')).toBe(true);
      expect(hasSegmentType('GS')).toBe(true);
      expect(hasSegmentType('ST')).toBe(true);
      expect(hasSegmentType('BHT')).toBe(true);
      expect(hasSegmentType('HL')).toBe(true);
      expect(hasSegmentType('NM1')).toBe(true);
      expect(hasSegmentType('CLM')).toBe(true);
      expect(hasSegmentType('LX')).toBe(true);
      expect(hasSegmentType('SV1')).toBe(true);
      expect(hasSegmentType('DTP')).toBe(true);
      expect(hasSegmentType('SE')).toBe(true);
      expect(hasSegmentType('GE')).toBe(true);
      expect(hasSegmentType('IEA')).toBe(true);
    });

    it('should handle missing optional fields gracefully', async () => {
      // Create a minimal valid claim with only required fields
      const minimalClaim: EnhancedClaim = {
        ...sampleClaim,
        // Remove optional fields
        groupName: undefined,
        providerPhone: undefined,
        patientPhone: undefined,
        // Ensure required fields are present
        patientFirstName: 'John',
        patientLastName: 'Doe',
        patientDob: new Date('1980-05-15'),
        patientGender: 'M',
        patientAddress: '123 Main St',
        patientCity: 'Anytown',
        patientState: 'CA',
        patientZip: '90210',
        provider: 'Dr. Jane Smith',
        providerNpi: '1234567890',
        providerTaxId: '123456789',
        providerAddress: '456 Medical Dr',
        providerCity: 'Anytown',
        providerState: 'CA',
        providerZip: '90210',
        memberId: 'M123456789',
        groupNumber: 'GRP-12345',
        relationshipCode: '18',
        placeOfService: '11',
        claimLines: [{
          id: 'line-1',
          claimId: 'test-claim-123',
          lineNumber: 1,
          cptCode: '80053',
          description: 'Comprehensive metabolic panel',
          icd10Codes: ['E78.5'],
          charge: 125.00,
          units: 1,
          modifier: null,
          serviceDate: new Date('2023-01-15'),
          diagnosisPointers: '1',
          diagnosisCodes: ['E78.5'],
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      } as unknown as EnhancedClaim; // Cast needed because we're not including all required fields
      
      const ediContent = await generator.generateEDI(minimalClaim);
      expect(ediContent).toBeDefined();
      // Should still contain required segments
      expect(ediContent).toContain('ISA*');
      expect(ediContent).toContain('CLM*CLM-2023-001');
    });

    it('should throw error for invalid claim data', async () => {
      // Create an invalid claim (missing required fields)
      const invalidClaim = { ...sampleClaim };
      // @ts-ignore - Intentionally breaking the type for testing
      invalidClaim.patientFirstName = undefined;
      
      await expect(generator.generateEDI(invalidClaim as any)).rejects.toThrow();
    });
  });

  describe('generateControlNumber', () => {
    it('should generate a 9-digit control number', () => {
      const controlNumber = generator['generateControlNumber']();
      expect(controlNumber).toMatch(/^\d{9}$/);
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYYMMDD', () => {
      const date = new Date('2023-01-15T00:00:00Z');
      expect(generator['formatDate'](date)).toBe('20230115');
    });
  });

  describe('formatTime', () => {
    it('should format time as HHmm', () => {
      const date = new Date('2023-01-15T14:30:00Z');
      expect(generator['formatTime'](date)).toMatch(/^14[0-5][0-9]$/);
    });
  });
});
