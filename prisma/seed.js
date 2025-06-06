const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.biomarker.deleteMany({});
  await prisma.bloodTest.deleteMany({});
  await prisma.denialPattern.deleteMany({});
  await prisma.eligibilityCheck.deleteMany({});
  await prisma.claimEvent.deleteMany({});
  await prisma.claimLine.deleteMany({});
  await prisma.claim.deleteMany({});
  await prisma.insurancePlan.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.user.deleteMany({});

  // Find existing user or create a test user if none exists
  console.log('Finding or creating user...');
  let user = await prisma.user.findFirst({});
  
  if (!user) {
    console.log('No user found, creating a test user...');
    const password = await bcrypt.hash('password123', 10);
    user = await prisma.user.create({
      data: {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        password,
      },
    });
  } else {
    console.log(`Using existing user: ${user.email} (ID: ${user.id})`);
  }

  // Create insurance plans if none exist for this user
  console.log('Checking for existing insurance plans...');
  const existingPlans = await prisma.insurancePlan.findMany({
    where: { userId: user.id }
  });
  
  if (existingPlans.length === 0) {
    console.log('Creating insurance plans...');
    const insurancePlans = [
      {
        id: 'ins_1',
        userId: user.id,
        payerName: 'Blue Cross Blue Shield',
        payerId: 'BCBS123',
        memberId: 'BCBS12345678',
        groupNumber: 'GRP123456',
        planType: 'PPO',
        isPrimary: true,
        isActive: true,
        effectiveDate: new Date('2023-01-01'),
      },
      {
        id: 'ins_2',
        userId: user.id,
        payerName: 'Aetna',
        payerId: 'AETNA456',
        memberId: 'AETNA87654321',
        groupNumber: 'GRP987654',
        planType: 'HMO',
        isPrimary: false,
        isActive: true,
        effectiveDate: new Date('2023-01-01'),
      },
    ];

    for (const plan of insurancePlans) {
      await prisma.insurancePlan.create({ data: plan });
    }
  } else {
    console.log(`Found ${existingPlans.length} existing insurance plans for user`);
  }

  // Check for existing reports or create a sample report
  console.log('Checking for existing reports...');
  let report = await prisma.report.findFirst({
    where: { userId: user.id }
  });
  
  if (!report) {
    console.log('Creating sample report...');
    report = await prisma.report.create({
      data: {
        id: 'report_1',
        userId: user.id,
        type: 'LAB_RESULTS',
        fileName: '2023-06-15-annual-physical.pdf',
        filePath: '/reports/2023-06-15-annual-physical.pdf',
        parsedData: JSON.stringify({
          title: 'Annual Physical - 2023',
          date: '2023-06-15',
          notes: 'Annual checkup with blood work'
        })
      },
    });
  } else {
    console.log(`Found existing report: ${report.id}`);
  }

  // Check for existing plans if they weren't created above
  const plans = await prisma.insurancePlan.findMany({
    where: { userId: user.id }
  });
  
  // Create or update plans if needed
  let planIds = [];
  if (plans.length > 0) {
    planIds = plans.map(p => p.id);
    console.log(`Using existing insurance plans: ${planIds.join(', ')}`);
  } else {
    console.log('No insurance plans found, cannot create claims');
    return;
  }
  
  // Check for existing claims
  console.log('Checking for existing claims...');
  const existingClaims = await prisma.claim.findMany({
    where: { userId: user.id }
  });
  
  if (existingClaims.length === 0) {
    // Create sample claims
    console.log('Creating sample claims...');
    const claims = [
      {
        id: 'claim_1',
        userId: user.id,
        insurancePlanId: planIds[0],
        reportId: report.id,
        claimNumber: 'CLM' + Math.floor(100000 + Math.random() * 900000),
        status: 'SUBMITTED',
        totalCharge: 250.0,
        allowedAmount: 200.0,
        paidAmount: 200.0,
        patientResponsibility: 50.0,
        submissionDate: new Date('2023-06-11'),
        processedDate: new Date('2023-06-20'),
        ediFileLocation: '/edi/claims/claim_1.edi',
        clearinghouseId: 'CLR' + Math.floor(100000 + Math.random() * 900000),
      },
      {
        id: 'claim_2',
        userId: user.id,
        insurancePlanId: planIds.length > 1 ? planIds[1] : planIds[0],
        reportId: report.id,
        claimNumber: 'CLM' + Math.floor(100000 + Math.random() * 900000),
        status: 'DRAFT',
        totalCharge: 180.0,
        patientResponsibility: 30.0,
        submissionDate: new Date('2023-06-15'),
      },
      {
        id: 'claim_3',
        userId: user.id,
        insurancePlanId: planIds[0],
        reportId: report.id,
        claimNumber: 'CLM' + Math.floor(100000 + Math.random() * 900000),
        status: 'APPROVED',
        totalCharge: 320.0,
        allowedAmount: 280.0,
        paidAmount: 250.0,
        patientResponsibility: 70.0,
        submissionDate: new Date('2023-05-20'),
        processedDate: new Date('2023-05-28'),
        ediFileLocation: '/edi/claims/claim_3.edi',
        clearinghouseId: 'CLR' + Math.floor(100000 + Math.random() * 900000),
      },
      {
        id: 'claim_4',
        userId: user.id,
        insurancePlanId: planIds[0],
        reportId: report.id,
        claimNumber: 'CLM' + Math.floor(100000 + Math.random() * 900000),
        status: 'DENIED',
        totalCharge: 150.0,
        allowedAmount: 0.0,
        paidAmount: 0.0,
        patientResponsibility: 150.0,
        submissionDate: new Date('2023-05-10'),
        processedDate: new Date('2023-05-15'),
        ediFileLocation: '/edi/claims/claim_4.edi',
        clearinghouseId: 'CLR' + Math.floor(100000 + Math.random() * 900000),
      },
    ];

    for (const claim of claims) {
      await prisma.claim.create({ data: claim });
    }
    console.log(`Created ${claims.length} claims`);
  } else {
    console.log(`Found ${existingClaims.length} existing claims`);
  }

  // Check for claims to attach lines to
  const claims = await prisma.claim.findMany({
    where: { userId: user.id }
  });
  
  if (claims.length > 0) {
    // Check for existing claim lines
    console.log('Checking for existing claim lines...');
    const existingLines = await prisma.claimLine.findMany({
      where: { claimId: { in: claims.map(c => c.id) } }
    });
    
    if (existingLines.length === 0) {
      // Create claim lines for the first claim
      console.log('Creating claim lines...');
      const claimLines = [
        {
          id: 'line_1',
          claimId: claims[0].id,
          lineNumber: 1,
          cptCode: '99213',
          description: 'Office visit, established patient',
          icd10Codes: ['Z00.00'],
          charge: 150.0,
          units: 1,
          modifier: '25',
          serviceDate: new Date('2023-06-10'),
        },
        {
          id: 'line_2',
          claimId: claims[0].id,
          lineNumber: 2,
          cptCode: '85025',
          description: 'Complete blood count',
          icd10Codes: ['Z79.899'],
          charge: 100.0,
          units: 1,
          serviceDate: new Date('2023-06-10'),
        },
      ];

      for (const line of claimLines) {
        await prisma.claimLine.create({ data: line });
      }
      console.log(`Created ${claimLines.length} claim lines`);
    } else {
      console.log(`Found ${existingLines.length} existing claim lines`);
    }
  } else {
    console.log('No claims found, skipping claim lines creation');
  }

  // Create claim events
  console.log('Creating claim events...');
  const claimEvents = [
    {
      id: 'event_1',
      claimId: 'claim_1',
      eventType: 'submitted',
      eventData: { status: 'SUBMITTED', timestamp: new Date('2023-06-11T10:30:00Z').toISOString() },
      notes: 'Claim submitted to insurance',
    },
    {
      id: 'event_2',
      claimId: 'claim_1',
      eventType: 'processed',
      eventData: { status: 'PAID', amount: 200.0, timestamp: new Date('2023-06-20T14:15:00Z').toISOString() },
      notes: 'Claim processed and paid',
    },
  ];

  for (const event of claimEvents) {
    await prisma.claimEvent.create({ data: event });
  }

  // Create eligibility checks
  console.log('Creating eligibility checks...');
  const eligibilityChecks = [
    {
      id: 'elig_1',
      insurancePlanId: 'ins_1',
      claimId: 'claim_1',
      status: 'active',
      deductible: 1000,
      deductibleMet: 500,
      outOfPocketMax: 5000,
      outOfPocketMet: 1000,
      copay: 25,
      coinsurance: 0.2,
      checkedAt: new Date('2023-06-10'),
      responseData: {
        coverageType: 'IN_NETWORK',
        details: 'Patient has active coverage'
      }
    },
  ];

  for (const check of eligibilityChecks) {
    await prisma.eligibilityCheck.create({ data: check });
  }

  // Create denial patterns
  console.log('Creating denial patterns...');
  const denialPatterns = [
    {
      payerId: 'BCBS123',
      denialCode: 'CO-4',
      denialReason: 'The procedure code is inconsistent with the modifier used or a required modifier is missing.',
      frequency: 5,
      lastOccurred: new Date('2023-06-01'),
      preventionRule: {
        requiredFields: ['modifier', 'cptCode'],
        description: 'Verify that all required modifiers are present and appropriate for the procedure code.'
      }
    },
    {
      payerId: 'BCBS123',
      denialCode: 'CO-16',
      denialReason: 'Claim lacks information which is needed for adjudication.',
      frequency: 3,
      lastOccurred: new Date('2023-06-05'),
      preventionRule: {
        requiredFields: ['diagnosis', 'serviceDate'],
        description: 'Ensure all required claim fields are populated before submission.'
      }
    },
  ];

  for (const pattern of denialPatterns) {
    await prisma.denialPattern.create({ data: pattern });
  }

  // Create a blood test with biomarkers
  console.log('Creating sample blood test...');
  const bloodTest = await prisma.bloodTest.create({
    data: {
      id: 'bt_1',
      userId: user.id,
      reportId: report.id,
      testDate: new Date('2023-06-15'),
      labName: 'LabCorp',
      labId: 'LC12345678',
      status: 'completed',
      rawData: {
        originalFileName: 'blood_test_20230615.pdf',
        parsedAt: new Date().toISOString(),
        parserVersion: '1.0.0'
      },
      biomarkers: {
        create: [
          {
            id: 'bm_1',
            name: 'Hemoglobin',
            displayName: 'Hemoglobin',
            value: 14.2,
            unit: 'g/dL',
            rawValue: '14.2 g/dL',
            referenceRange: '13.5-17.5 g/dL',
            status: 'normal',
            category: 'Hematology',
            isFlagged: false
          },
          {
            id: 'bm_2',
            name: 'WBC Count',
            displayName: 'White Blood Cells',
            value: 7.5,
            unit: '10^3/µL',
            rawValue: '7.5 x 10^3/µL',
            referenceRange: '4.5-11.0 x 10^3/µL',
            status: 'normal',
            category: 'Hematology',
            isFlagged: false
          },
          {
            id: 'bm_3',
            name: 'Glucose',
            displayName: 'Glucose, Fasting',
            value: 105,
            unit: 'mg/dL',
            rawValue: '105 mg/dL',
            referenceRange: '70-99 mg/dL',
            status: 'high',
            category: 'Metabolic',
            isFlagged: true,
            notes: 'Slightly elevated, recommend follow-up'
          },
          {
            id: 'bm_4',
            name: 'Vitamin D',
            displayName: '25-Hydroxy Vitamin D',
            value: 28,
            unit: 'ng/mL',
            rawValue: '28 ng/mL',
            referenceRange: '30-100 ng/mL',
            status: 'low',
            category: 'Vitamins',
            isFlagged: true,
            notes: 'Consider supplementation'
          }
        ]
      }
    },
    include: {
      biomarkers: true
    }
  });

  console.log('Database seeded successfully!');
  console.log(`Created blood test with ${bloodTest.biomarkers.length} biomarkers`);
  console.log('You can now login with:');
  console.log('Email: test@example.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
