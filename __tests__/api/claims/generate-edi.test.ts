import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { v4 as uuidv4 } from 'uuid';

// Mock the Prisma client
const mockPrisma = {
  claim: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: 'test-user-123' },
  }),
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

// Mock the EDI generator
jest.mock('@/lib/claims/edi', () => ({
  EDI837Generator: jest.fn().mockImplementation(() => ({
    generateEDI: jest.fn().mockResolvedValue('MOCK_EDI_CONTENT'),
  })),
}));

// Import the actual implementation after mocking
import { POST } from '@/app/api/claims/generate-edi/route';

// Mock the logger to avoid console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the EDI generator
jest.mock('@/lib/claims/edi', () => ({
  EDI837Generator: jest.fn().mockImplementation(() => ({
    generateEDI: jest.fn().mockResolvedValue('MOCK_EDI_CONTENT'),
  })),
}));

// Mock Prisma client
const mockPrisma = {
  claim: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}));

// Mock the prisma import
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  Prisma: {
    JsonValue: {}
  }
}));

// Mock file system operations
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
}));

describe('POST /api/claims/generate-edi', () => {
  const userId = 'user-123';
  const claimNumber = 'CLM-2023-001';
  const mockClaim = {
    id: 'claim-123',
    claimNumber,
    status: 'DRAFT',
    userId,
    totalCharge: 100.50,
    insurancePlanId: 'plan-123',
    patientFirstName: 'John',
    patientLastName: 'Doe',
    patientDob: new Date('1980-01-01'),
    patientGender: 'MALE',
    patientAddress: '123 Test St',
    patientCity: 'Test City',
    patientState: 'CA',
    patientZip: '12345',
    provider: 'Test Provider',
    providerNpi: '1234567890',
    serviceStartDate: new Date(),
    serviceEndDate: new Date(),
    placeOfService: '11',
    controlNumber: '123456',
    relationshipCode: '18',
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
    insurancePlan: {
      id: 'plan-123',
      name: 'Test Insurance',
      payerName: 'Test Payer',
      payerId: 'PAYER123',
      termDate: new Date('2024-12-31'),
    },
    claimLines: [
      {
        id: 'line-1',
        claimId: 'claim-123',
        lineNumber: 1,
        procedureCode: '80053',
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
        placeOfService: '11',
        diagnosisPointers: '1',
        charge: 100.50,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getServerSession
    jest.mock('next-auth', () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: { id: userId },
      })
    }));
    
    // Mock Prisma responses
    mockPrisma.claim.findUnique.mockResolvedValue(mockClaim);
    mockPrisma.claim.update.mockResolvedValue({
      ...mockClaim,
      status: 'SUBMITTED',
      ediFileLocation: `claim-${claimNumber}-${new Date().toISOString().replace(/[:.]/g, '-')}.edi`,
    });
    
    mockPrisma.auditLog.create.mockResolvedValue({});
  });

  it('should generate EDI for a valid claim', async () => {
    // Setup mocks
    mockPrisma.claim.findUnique.mockResolvedValueOnce(mockClaim);
    mockPrisma.claim.update.mockResolvedValueOnce({
      ...mockClaim,
      status: 'SUBMITTED',
      ediFileLocation: `claim-${claimNumber}-${new Date().toISOString().replace(/[:.]/g, '-')}.edi`,
    });
    mockPrisma.auditLog.create.mockResolvedValueOnce({});

    const response = await POST(new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ claimId: mockClaim.id }),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.fileName).toBeDefined();
    expect(data.claimId).toBe(mockClaim.id);
    expect(data.status).toBe('SUBMITTED');
    
    // Verify Prisma was called correctly
    expect(mockPrisma.claim.findUnique).toHaveBeenCalledWith({
      where: { id: mockClaim.id },
      include: expect.any(Object),
    });
    
    expect(mockPrisma.claim.update).toHaveBeenCalledWith({
      where: { id: mockClaim.id },
      data: {
        status: 'SUBMITTED',
        ediFileLocation: expect.any(String),
      },
    });
    
    expect(mockPrisma.auditLog.create).toHaveBeenCalled();
  });

  it('should return 401 for unauthenticated requests', async () => {
    // Mock unauthenticated session
    require('next-auth').getServerSession.mockResolvedValueOnce(null);
    
    const response = await POST(new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ claimId: mockClaim.id }),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 if claim not found', async () => {
    // Setup mock
    mockPrisma.claim.findUnique.mockResolvedValueOnce(null);
    
    const response = await POST(new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ claimId: 'non-existent-claim' }),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Claim not found');
  });

  it('should return 400 if claim is not in DRAFT or PENDING status', async () => {
    // Setup mock
    mockPrisma.claim.findUnique.mockResolvedValueOnce({
      ...mockClaim,
      status: 'SUBMITTED',
    });
    
    const response = await POST(new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ claimId: mockClaim.id }),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('must be in DRAFT or PENDING status');
  });

  it('should return 400 if claimId is missing', async () => {
    const response = await POST(new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    }));
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing required claimId');
  });
});
