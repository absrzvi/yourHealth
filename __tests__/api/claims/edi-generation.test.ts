import { EDI837Generator } from '@/lib/claims/edi';
import { ClaimStatus } from '@prisma/client';

// Mock the file system operations
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
}));

describe('EDI Generation', () => {
  let generator: EDI837Generator;
  
  // Create a complete test claim that matches the EnhancedClaim interface
  const serviceStartDate = new Date();
  const serviceEndDate = new Date();
  serviceEndDate.setDate(serviceStartDate.getDate() + 1);

  const sampleClaim: any = {
    id: 'claim-123',
    claimNumber: 'CLM-2023-001',
    status: 'DRAFT' as ClaimStatus,
    userId: 'user-123',
    totalCharge: 100.50,
    insurancePlanId: 'plan-123',
    
    // Required patient information
    patientFirstName: 'John',
    patientLastName: 'Doe',
    patientDob: new Date('1980-01-01'),
    patientGender: 'MALE',
    patientAddress: '123 Test St',
    patientCity: 'Test City',
    patientState: 'CA',
    patientZip: '12345',
    patientPhone: '555-123-4567',
    
    // Required provider information
    provider: 'Test Provider',
    providerNpi: '1234567890',
    
    // Service dates
    serviceStartDate,
    serviceEndDate,
    
    // Insurance information
    insurancePlan: {
      id: 'plan-123',
      name: 'Test Insurance',
      payerName: 'Test Payer',
      payerId: 'PAYER123',
      termDate: new Date('2024-12-31'),
    },
    
    // User information (for reference)
    user: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1980-01-01'),
      gender: 'MALE',
      address: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345',
      phone: '555-123-4567',
      email: 'john.doe@example.com',
    },
    
    // Provider info for EDI generation
    providerInfo: {
      name: 'Test Provider',
      npi: '1234567890',
      taxId: '123456789',
      address1: '123 Provider St',
      city: 'Provider City',
      state: 'CA',
      zip: '12345',
      phone: '555-987-6543',
    },
    // Claim lines
    claimLines: [
      {
        id: 'line-1',
        claimId: 'claim-123',
        lineNumber: 1,
        procedureCode: '80053', // Example CPT code for comprehensive metabolic panel
        modifier: '25',
        diagnosisCodePointers: ['1'],
        charges: 100.50,
        units: 1,
        icd10Codes: ['E11.65'],
        serviceFacilityName: 'Test Lab',
        serviceFacilityNpi: '9876543210',
        renderingProviderNpi: '1234567890',
        referringProviderNpi: '1122334455',
        serviceDate: new Date(),
        placeOfService: '11', // Office
        diagnosisPointers: '1',
        charge: 100.50,
      },
    ],
    
    // Additional required fields
    placeOfService: '11', // Office
    controlNumber: '123456',
    relationshipCode: '18', // Self
    subscriberFirstName: 'John',
    subscriberLastName: 'Doe',
    subscriberDob: new Date('1980-01-01'),
    subscriberGender: 'M',
    subscriberAddress: '123 Test St',
    subscriberCity: 'Test City',
    subscriberState: 'CA',
    subscriberZip: '12345',
    subscriberPhone: '555-123-4567',
    subscriberId: 'SUB123456',
    report: {
      id: 'report-123',
      userId: 'user-123',
      type: 'BLOOD_TEST',
      fileName: 'test-report.pdf',
      createdAt: new Date(),
      biomarkers: [
        {
          id: 'bm-1',
          name: 'Glucose',
          value: '100',
          unit: 'mg/dL',
          referenceRange: '70-99 mg/dL',
          status: 'HIGH',
          category: 'CHEMISTRY',
          selected: true,
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    generator = new EDI837Generator();
  });

  it('should generate valid EDI content', async () => {
    // Act
    const result = await generator.generateEDI(sampleClaim);
    
    // Assert
    expect(typeof result).toBe('string');
    expect(result).toContain('ISA*');
    expect(result).toContain('GS*');
    expect(result).toContain('ST*837');
    expect(result).toContain('CLM*');
    expect(result).toContain('SE*');
    expect(result).toContain('GE*');
    expect(result).toContain('IEA*');
  });

  it('should include claim line items in the EDI', async () => {
    // Act
    const result = await generator.generateEDI(sampleClaim);
    
    // Assert
    expect(result).toContain('LX*1');
    expect(result).toContain('SV1*HC:12345*100.5*UN*1');
  });

  it('should include patient information in the EDI', async () => {
    // Act
    const result = await generator.generateEDI(sampleClaim);
    
    // Assert
    expect(result).toContain('NM1*QC*1*Doe*John*');
    expect(result).toContain('DMG*D8*19800101*M');
  });

  it('should include provider information in the EDI', async () => {
    // Act
    const result = await generator.generateEDI(sampleClaim);
    
    // Assert
    expect(result).toContain('NM1*82*2*Doe*John*');
    expect(result).toContain('PRV*PE*PXC*207Q00000X');
  });

  it('should include insurance information in the EDI', async () => {
    // Act
    const result = await generator.generateEDI(sampleClaim);
    
    // Assert
    expect(result).toContain('NM1*IL*1*Doe*John*');
    expect(result).toContain('NM1*PR*2*Test Insurance*');
  });
});
