import { EDI837Generator } from '../../lib/claims/edi';
import { Claim, ClaimLine, Report, Biomarker, InsurancePlan } from '@prisma/client';
import { ClaimStatus } from '../../lib/claims/processor';

describe('EDI837Generator', () => {
  let ediGenerator: EDI837Generator;
  
  beforeEach(() => {
    ediGenerator = new EDI837Generator();
  });
  
  describe('generate', () => {
    it('should generate EDI 837 content from a claim', async () => {
      const claim = {
        id: '12345',
        userId: 'user123',
        reportId: 'report123',
        insurancePlanId: 'plan123',
        claimNumber: 'CLM12345',
        status: ClaimStatus.DRAFT,
        totalCharge: 150.00,
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
        claimLines: [
          {
            id: 'line1',
            claimId: '12345',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 85.00,
            units: 1,
            serviceDate: new Date(),
            diagnosisCodes: ['Z00.00'],
            diagnosisPointers: '1',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        insurancePlan: {
          id: 'plan123',
          userId: 'user123',
          name: 'Test Insurance',
          payerId: '12345',
          planType: 'PPO',
          memberId: 'MEM12345',
          groupNumber: 'GRP12345',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      const ediContent = await ediGenerator.generate(claim as any);
      
      expect(ediContent).toBeDefined();
      expect(typeof ediContent).toBe('string');
      
      // Check for key EDI segments
      expect(ediContent).toContain('ISA*');
      expect(ediContent).toContain('GS*HC*');
      expect(ediContent).toContain('ST*837*');
      expect(ediContent).toContain('BHT*0019*');
      expect(ediContent).toContain('NM1*85*2*Test Provider*');
      expect(ediContent).toContain('NM1*IL*1*Doe*John*');
      expect(ediContent).toContain('CLM*CLM12345*150.00*');
      expect(ediContent).toContain('SV1*HC:80053*85.00*');
      expect(ediContent).toContain('SE*');
      expect(ediContent).toContain('GE*');
      expect(ediContent).toContain('IEA*');
    });
  });
  
  describe('generateBloodTestClaim', () => {
    it('should generate EDI content with synthetic claim lines from biomarkers', async () => {
      const claim = {
        id: '12345',
        userId: 'user123',
        reportId: 'report123',
        insurancePlanId: 'plan123',
        claimNumber: 'CLM12345',
        status: ClaimStatus.DRAFT,
        totalCharge: 0, // Will be calculated from synthetic lines
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
        claimLines: [] // Empty claim lines to trigger synthetic generation
      };
      
      const report = {
        id: 'report123',
        userId: 'user123',
        title: 'Blood Test Report',
        type: 'BLOOD_TEST',
        source: 'Lab',
        fileUrl: 'https://example.com/report.pdf',
        parsedData: JSON.stringify({
          biomarkers: [
            { name: 'Glucose', value: '120', unit: 'mg/dL', referenceRange: '70-99' },
            { name: 'Cholesterol', value: '220', unit: 'mg/dL', referenceRange: '0-200' }
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
          }
        ]
      };
      
      const insurancePlan = {
        id: 'plan123',
        userId: 'user123',
        name: 'Test Insurance',
        payerId: '12345',
        planType: 'PPO',
        memberId: 'MEM12345',
        groupNumber: 'GRP12345',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const ediContent = await ediGenerator.generateBloodTestClaim(
        claim as any,
        report as any,
        insurancePlan as InsurancePlan
      );
      
      expect(ediContent).toBeDefined();
      expect(typeof ediContent).toBe('string');
      
      // Check for key EDI segments
      expect(ediContent).toContain('ISA*');
      expect(ediContent).toContain('GS*HC*');
      expect(ediContent).toContain('ST*837*');
      expect(ediContent).toContain('BHT*0019*');
      expect(ediContent).toContain('NM1*85*2*Test Provider*');
      expect(ediContent).toContain('NM1*IL*1*Doe*John*');
      
      // Check for diagnosis codes related to the biomarkers
      expect(ediContent).toContain('HI*BK:'); // Diagnosis code segment
      
      // Check for service lines generated from biomarkers
      expect(ediContent).toContain('SV1*HC:82947'); // Glucose test
      expect(ediContent).toContain('SV1*HC:82465'); // Cholesterol test
      
      expect(ediContent).toContain('SE*');
      expect(ediContent).toContain('GE*');
      expect(ediContent).toContain('IEA*');
    });
    
    it('should use existing claim lines if available', async () => {
      const claim = {
        id: '12345',
        userId: 'user123',
        reportId: 'report123',
        insurancePlanId: 'plan123',
        claimNumber: 'CLM12345',
        status: ClaimStatus.DRAFT,
        totalCharge: 85.00,
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
        claimLines: [
          {
            id: 'line1',
            claimId: '12345',
            lineNumber: 1,
            cptCode: '80053',
            description: 'Comprehensive Metabolic Panel',
            charge: 85.00,
            units: 1,
            serviceDate: new Date(),
            diagnosisCodes: ['Z00.00'],
            diagnosisPointers: '1',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };
      
      const report = {
        id: 'report123',
        userId: 'user123',
        title: 'Blood Test Report',
        type: 'BLOOD_TEST',
        source: 'Lab',
        fileUrl: 'https://example.com/report.pdf',
        parsedData: JSON.stringify({
          biomarkers: [
            { name: 'Glucose', value: '120', unit: 'mg/dL', referenceRange: '70-99' },
            { name: 'Cholesterol', value: '220', unit: 'mg/dL', referenceRange: '0-200' }
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
          }
        ]
      };
      
      const ediContent = await ediGenerator.generateBloodTestClaim(
        claim as any,
        report as any
      );
      
      expect(ediContent).toBeDefined();
      expect(typeof ediContent).toBe('string');
      
      // Should use the existing claim line
      expect(ediContent).toContain('SV1*HC:80053*85.00*UN*1');
      
      // Should not contain synthetic claim lines
      expect(ediContent).not.toContain('SV1*HC:82947'); // Glucose test
    });
    
    it('should handle errors gracefully', async () => {
      const invalidClaim = null;
      const invalidReport = null;
      
      await expect(
        ediGenerator.generateBloodTestClaim(
          invalidClaim as any,
          invalidReport as any
        )
      ).rejects.toThrow();
    });
  });
});
