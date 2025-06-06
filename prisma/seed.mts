import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Helper to generate claim numbers
const generateClaimNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `CLM-${year}${month}-${random}`;
};

// Helper to generate member IDs
const generateMemberId = (): string => {
  return `MBR${Math.floor(100000000 + Math.random() * 900000000)}`;
};

async function main() {
  console.log('Seeding database with test data...');

  // Create test user with a simple password for testing
  // For production, use stronger passwords and higher salt rounds [SFT]
  const plainPassword = 'password123';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      // Update password if user exists to ensure correct hash
      password: hashedPassword,
    },
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  });

  console.log(`Created/updated user: ${user.email}`);

  // Create sample insurance plans
  const insurancePlans = await Promise.all([
    prisma.insurancePlan.upsert({
      where: { id: 'ins_bluecross_123' },
      update: {},
      create: {
        id: 'ins_bluecross_123',
        userId: user.id,
        payerName: 'Blue Cross Blue Shield',
        payerId: 'BCBS123',
        memberId: generateMemberId(),
        groupNumber: 'GRP987654',
        planType: 'PPO',
        isPrimary: true,
        isActive: true,
        effectiveDate: new Date('2023-01-01'),
      },
    }),
    prisma.insurancePlan.upsert({
      where: { id: 'ins_aetna_456' },
      update: {},
      create: {
        id: 'ins_aetna_456',
        userId: user.id,
        payerName: 'Aetna',
        payerId: 'AETNA456',
        memberId: generateMemberId(),
        groupNumber: 'GRP123456',
        planType: 'HMO',
        isPrimary: false,
        isActive: true,
        effectiveDate: new Date('2023-01-01'),
      },
    }),
  ]);

  console.log(`Created ${insurancePlans.length} insurance plans`);

  // Create a sample report
  const report = await prisma.report.upsert({
    where: { id: 'rpt_12345' },
    update: {},
    create: {
      id: 'rpt_12345',
      userId: user.id,
      type: 'blood_test',
      fileName: 'blood_test_20230515.pdf',
      filePath: '/uploads/blood_test_20230515.pdf',
      parsedData: JSON.stringify({
        testType: 'Comprehensive Metabolic Panel',
        date: '2023-05-15',
        results: {
          glucose: { value: 95, unit: 'mg/dL', range: '74-99' },
          sodium: { value: 140, unit: 'mmol/L', range: '136-145' },
        },
      }),
    },
  });

  console.log('Created sample report');

  // Create sample claims
  const claims = await Promise.all([
    // Submitted claim
    prisma.claim.create({
      data: {
        userId: user.id,
        reportId: report.id,
        insurancePlanId: insurancePlans[0].id,
        claimNumber: generateClaimNumber(),
        status: 'SUBMITTED',
        totalCharge: 250.0,
        submissionDate: new Date(),
        claimLines: {
          create: [
            {
              lineNumber: 1,
              cptCode: '80053',
              description: 'Comprehensive Metabolic Panel',
              icd10Codes: ['E78.5', 'Z79.899'],
              charge: 150.0,
              units: 1,
              serviceDate: new Date('2023-05-15'),
            },
            {
              lineNumber: 2,
              cptCode: '85025',
              description: 'Complete Blood Count (CBC)',
              icd10Codes: ['D64.9'],
              charge: 100.0,
              units: 1,
              serviceDate: new Date('2023-05-15'),
            },
          ],
        },
        claimEvents: {
          create: [
            {
              eventType: 'CREATED',
              notes: 'Claim created from lab report',
            },
            {
              eventType: 'SUBMITTED',
              notes: 'Submitted to insurance',
            },
          ],
        },
        eligibilityCheck: {
          create: {
            insurancePlanId: insurancePlans[0].id,
            status: 'active',
            deductible: 1000.0,
            deductibleMet: 250.0,
            outOfPocketMax: 5000.0,
            outOfPocketMet: 1250.0,
            copay: 25.0,
            coinsurance: 0.2,
            checkedAt: new Date().toISOString(),
          },
        },
      },
    }),
    // Draft claim
    prisma.claim.create({
      data: {
        userId: user.id,
        insurancePlanId: insurancePlans[1].id,
        claimNumber: generateClaimNumber(),
        status: 'DRAFT',
        totalCharge: 180.0,
        claimLines: {
          create: [
            {
              lineNumber: 1,
              cptCode: '82947',
              description: 'Glucose Test',
              icd10Codes: ['R73.09'],
              charge: 180.0,
              units: 1,
              serviceDate: new Date('2023-06-01'),
            },
          ],
        },
      },
    }),
  ]);

  console.log(`Created ${claims.length} sample claims`);

  // After creating claims, seed EligibilityCheck and DenialPattern with new schema
  // Seed EligibilityCheck for the first claim
  const eligibilityCheck = await prisma.eligibilityCheck.create({
    data: {
      id: "elig_1",
      insurancePlanId: insurancePlans[0].id,
      claimId: claims[0].id,
      status: "active",
      response: {
        deductible: 1000,
        deductibleMet: 500,
        outOfPocketMax: 5000,
        outOfPocketMet: 1000,
        copay: 25,
        coinsurance: 0.2,
        coverageType: "IN_NETWORK",
        details: "Patient has active coverage",
        checkedAt: new Date().toISOString(),
      },
    },
  });

  // Seed DenialPattern for the first claim
  const denialPatterns = [
    {
      claimId: claims[0].id,
      reason: 'The procedure code is inconsistent with the modifier used or a required modifier is missing.',
    },
    {
      claimId: claims[0].id,
      reason: 'Claim lacks information which is needed for adjudication.',
    },
  ];

  for (const pattern of denialPatterns) {
    try {
      await prisma.denialPattern.create({ data: pattern });
    } catch (error) {
      console.warn(`Failed to create denial pattern for claim ${pattern.claimId}:`, error);
    }
  }

  console.log('Created sample denial patterns');

  console.log('Database seeded successfully!');

  return { user, insurancePlans, claims };
}

// Execute the main function if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default main;
