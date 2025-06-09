import { ClaimsProcessor, ClaimStatus } from '../../lib/claims/processor';
import { EDI837Generator } from '../../lib/claims/edi';
import { Report, Biomarker, Claim, ClaimLine, InsurancePlan } from '@prisma/client';

// Mock the logger to prevent console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Claims Processing Integration', () => {
  let processor: ClaimsProcessor;
  let ediGenerator: EDI837Generator;
  
  // Sample test data
  const mockReport = {
    id: 'report123',
    userId: 'user123',
    title: 'Blood Test Report',
    type: 'BLOOD_TEST',
    source: 'Lab',
    fileUrl: 'https://example.com/report.pdf',
    parsedData: JSON.stringify({
      biomarkers: [
        { name: 'Glucose', value: '120', unit: 'mg/dL', referenceRange: '70-99' },
        { name: 'Cholesterol', value: '220', unit: 'mg/dL', referenceRange: '0-200' },
        { name: 'HDL', value: '45', unit: 'mg/dL', referenceRange: '40-60' },
        { name: 'LDL', value: '150', unit: 'mg/dL', referenceRange: '0-100' },
        { name: 'Triglycerides', value: '180', unit: 'mg/dL', referenceRange: '0-150' }
      ]
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
    biomarkers: [
      {
        id: 'bio1',
        reportId: 'report123',
        name: 'Glucose',
        category: 'Metabolic',
        value: '120',
        unit: 'mg/dL',
        referenceRange: '70-99',
        isAbnormal: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bio2',
        reportId: 'report123',
        name: 'Cholesterol',
        category: 'Lipid',
        value: '220',
        unit: 'mg/dL',
        referenceRange: '0-200',
        isAbnormal: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bio3',
        reportId: 'report123',
        name: 'HDL',
        category: 'Lipid',
        value: '45',
        unit: 'mg/dL',
        referenceRange: '40-60',
        isAbnormal: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bio4',
        reportId: 'report123',
        name: 'LDL',
        category: 'Lipid',
        value: '150',
        unit: 'mg/dL',
        referenceRange: '0-100',
        isAbnormal: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'bio5',
        reportId: 'report123',
        name: 'Triglycerides',
        category: 'Lipid',
        value: '180',
        unit: 'mg/dL',
        referenceRange: '0-150',
        isAbnormal: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  } as unknown as Report & { biomarkers: Biomarker[] };
  
  const mockClaim = {
    id: '12345',
    userId: 'user123',
    reportId: 'report123',
    insurancePlanId: 'plan123',
    claimNumber: 'CLM12345',
    status: ClaimStatus.DRAFT,
    totalCharge: 0, // Will be calculated
    allowedAmount: null,
    paidAmount: null,
    patientResponsibility: null,
    provider: 'Test Provider',
    providerId: '1234567890',
    providerAddress: '123 Provider St',
    providerCity: 'Provider City',
    providerState: 'PS',
    providerZip: '12345',
    patientFirstName: 'John',
    patientLastName: 'Doe',
    patientAddress: '456 Patient St',
    patientCity: 'Patient City',
    patientState: 'PS',
    patientZip: '67890',
    patientDob: new Date('1980-01-01'),
    patientGender: 'M',
    memberId: 'MEM12345',
    relationshipCode: '18',
    createdAt: new Date(),
    updatedAt: new Date(),
    claimLines: [] // Empty initially
  } as unknown as Claim & { claimLines: ClaimLine[] };
  
  const mockInsurancePlan = {
    id: 'plan123',
    userId: 'user123',
    name: 'Test Insurance',
    payerId: '12345',
    planType: 'PPO',
    memberId: 'MEM12345',
    groupNumber: 'GRP12345',
    createdAt: new Date(),
    updatedAt: new Date()
  } as InsurancePlan;
  
  beforeEach(() => {
    processor = new ClaimsProcessor();
    ediGenerator = new EDI837Generator();
  });
  
  it('should process a blood test report and generate valid EDI 837 content', async () => {
    // Step 1: Generate CPT codes from the report
    const cptCodes = await processor.generateCPTCodes(mockReport);
    
    // Verify CPT codes were generated correctly
    expect(cptCodes.length).toBeGreaterThan(0);
    expect(cptCodes[0]).toHaveProperty('cpt');
    expect(cptCodes[0]).toHaveProperty('diagnoses');
    
    // Step 2: Create claim lines from CPT codes
    const claimLines = cptCodes.map((cptCode, index) => ({
      id: `line${index + 1}`,
      claimId: mockClaim.id,
      lineNumber: index + 1,
      cptCode: cptCode.cpt,
      description: cptCode.description,
      charge: 85.00, // Default charge
      units: cptCode.units,
      serviceDate: new Date(),
      diagnosisCodes: cptCode.diagnoses,
      diagnosisPointers: cptCode.diagnoses.map((_, i) => i + 1).join(":").slice(0, 4),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Step 3: Add claim lines to the claim
    mockClaim.claimLines = claimLines;
    mockClaim.totalCharge = claimLines.reduce((sum, line) => sum + (line.charge || 0), 0);
    
    // Step 4: Generate EDI content from the claim
    const ediContent = await ediGenerator.generate({
      ...mockClaim,
      insurancePlan: mockInsurancePlan,
      report: mockReport
    });
    
    // Verify EDI content was generated correctly
    expect(ediContent).toBeDefined();
    expect(typeof ediContent).toBe('string');
    
    // Check for key EDI segments
    expect(ediContent).toContain('ISA*');
    expect(ediContent).toContain('GS*HC*');
    expect(ediContent).toContain('ST*837*');
    expect(ediContent).toContain('BHT*0019*');
    expect(ediContent).toContain('NM1*85*2*Test Provider*');
    expect(ediContent).toContain('NM1*IL*1*Doe*John*');
    expect(ediContent).toContain('CLM*CLM12345*');
    
    // Check for service lines
    cptCodes.forEach(cptCode => {
      expect(ediContent).toContain(`SV1*HC:${cptCode.cpt}*`);
    });
    
    // Check for diagnosis codes
    const allDiagnoses = Array.from(
      new Set(cptCodes.flatMap(code => code.diagnoses))
    );
    allDiagnoses.forEach(diagnosisCode => {
      expect(ediContent).toContain(`HI*BK:${diagnosisCode}`);
    });
    
    expect(ediContent).toContain('SE*');
    expect(ediContent).toContain('GE*');
    expect(ediContent).toContain('IEA*');
  });
  
  it('should generate EDI content directly from a claim and report without claim lines', async () => {
    // Use the generateBloodTestClaim method to create synthetic claim lines
    const ediContent = await ediGenerator.generateBloodTestClaim(
      mockClaim,
      mockReport,
      mockInsurancePlan
    );
    
    // Verify EDI content was generated correctly
    expect(ediContent).toBeDefined();
    expect(typeof ediContent).toBe('string');
    
    // Check for key EDI segments
    expect(ediContent).toContain('ISA*');
    expect(ediContent).toContain('GS*HC*');
    expect(ediContent).toContain('ST*837*');
    expect(ediContent).toContain('BHT*0019*');
    expect(ediContent).toContain('NM1*85*2*Test Provider*');
    expect(ediContent).toContain('NM1*IL*1*Doe*John*');
    expect(ediContent).toContain('CLM*CLM12345*');
    
    // Check for service lines (should have been generated from biomarkers)
    expect(ediContent).toContain('SV1*HC:');
    
    // Check for diagnosis codes
    expect(ediContent).toContain('HI*BK:');
    
    expect(ediContent).toContain('SE*');
    expect(ediContent).toContain('GE*');
    expect(ediContent).toContain('IEA*');
  });
});
