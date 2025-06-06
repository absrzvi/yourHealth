const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log('Starting insurance claims test...');
  
  try {
    // Create a test user if not exists
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        id: `user_${uuidv4()}`,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password_here', // In a real test, use proper hashing
      },
    });

    console.log('Test user:', testUser.email);

    // Create an insurance plan
    const insurancePlan = await prisma.insurancePlan.create({
      data: {
        id: `ins_${uuidv4()}`,
        userId: testUser.id,
        payerName: 'Test Insurance',
        payerId: 'TEST123',
        memberId: 'MEM123456',
        groupNumber: 'GRP123',
        planType: 'PPO',
        isPrimary: true,
        isActive: true,
        effectiveDate: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Created insurance plan:', insurancePlan.payerName);

    // Get the current timestamp for claim number
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Create a claim
    const claim = await prisma.claim.create({
      data: {
        id: `clm_${uuidv4()}`,
        userId: testUser.id,
        insurancePlanId: insurancePlan.id,
        claimNumber: `CLM-${timestamp}`,
        status: 'DRAFT',
        totalCharge: 150.0,
        updatedAt: new Date(),
      },
    });

    console.log('Created claim:', {
      claimNumber: claim.claimNumber,
      status: claim.status,
      totalCharge: claim.totalCharge,
    });

    // Add claim lines
    const claimLines = await Promise.all([
      prisma.claimLine.create({
        data: {
          id: `cl_${uuidv4()}`,
          claimId: claim.id,
          lineNumber: 1,
          cptCode: '99213',
          description: 'Office visit',
          icd10Codes: ['Z00.00'],
          charge: 100.0,
          units: 1,
          serviceDate: new Date(),
        },
      }),
      prisma.claimLine.create({
        data: {
          id: `cl_${uuidv4()}`,
          claimId: claim.id,
          lineNumber: 2,
          cptCode: '85025',
          description: 'Blood test',
          icd10Codes: ['Z79.899'],
          charge: 50.0,
          units: 1,
          serviceDate: new Date(),
        },
      }),
    ]);

    console.log('Added claim lines:', claimLines.length);

    // Add claim event
    const claimEvent = await prisma.claimEvent.create({
      data: {
        id: `evt_${uuidv4()}`,
        claimId: claim.id,
        eventType: 'CREATED',
        notes: 'Claim created',
      },
    });

    console.log('Added claim event:', claimEvent.eventType);

    // Test API endpoints
    console.log('\nTesting API endpoints...');
    await testApiEndpoints(testUser.id, claim.id);

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testApiEndpoints(userId, claimId) {
  // Simulate API calls
  const baseUrl = 'http://localhost:3000/api';
  const headers = {
    'Content-Type': 'application/json',
    // In a real test, include proper auth headers
  };

  // 1. Get claim by ID
  try {
    const response = await fetch(`${baseUrl}/claims/${claimId}`, { headers });
    const data = await response.json();
    console.log('\nGet Claim by ID:', {
      status: response.status,
      data: {
        id: data.id,
        claimNumber: data.claimNumber,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('Error getting claim:', error);
  }

  // 2. Get claim events
  try {
    const response = await fetch(`${baseUrl}/claims/${claimId}/events`, { headers });
    const data = await response.json();
    console.log('\nGet Claim Events:', {
      status: response.status,
      eventCount: data.length,
      latestEvent: data[0]?.eventType,
    });
  } catch (error) {
    console.error('Error getting claim events:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
