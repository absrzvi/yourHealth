/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, ClaimStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting admin data seeding...');

  // Find admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    console.error(`Admin user with email ${adminEmail} not found. Please run create-admin-user.ts first.`);
    process.exit(1);
  }
  
  console.log(`Found admin user: ${adminUser.email} (${adminUser.id})`);

  // Create insurance plans for admin
  console.log('Creating insurance plans for admin user...');
  const insurancePlanData = [
    {
      payerName: 'Blue Cross Blue Shield',
      payerId: 'BCBS-ADMIN-001',
      memberId: 'BCBS-ADMIN-123456789',
      groupNumber: 'GRP-ADMIN-123456',
      planName: 'PPO Plan',
      relationToInsured: 'self', // lowercase as per schema default
      effectiveDate: new Date('2025-01-01'),
      userId: adminUser.id,
    },
    {
      payerName: 'Aetna',
      payerId: 'AETNA-ADMIN-001',
      memberId: 'AET-ADMIN-987654321',
      groupNumber: 'GRP-ADMIN-987654',
      planName: 'HMO Plan',
      relationToInsured: 'self', // lowercase as per schema default
      effectiveDate: new Date('2025-01-01'),
      userId: adminUser.id,
    },
  ];

  for (const planData of insurancePlanData) {
    // Check if plan exists
    const existingPlan = await prisma.insurancePlan.findFirst({
      where: {
        userId: adminUser.id,
        payerId: planData.payerId,
      },
    });
    
    let plan;
    if (existingPlan) {
      console.log(`Updating existing insurance plan: ${planData.payerName}`);
      // Update existing plan
      plan = await prisma.insurancePlan.update({
        where: { id: existingPlan.id },
        data: planData, // No type assertion needed
      });
    } else {
      console.log(`Creating new insurance plan: ${planData.payerName}`);
      // Create new plan
      // Create new plan with type assertion to bypass TypeScript error
      // There appears to be a mismatch between the Prisma schema and generated types
      plan = await prisma.insurancePlan.create({
        data: {
          payerName: planData.payerName,
          payerId: planData.payerId,
          memberId: planData.memberId,
          groupNumber: planData.groupNumber,
          relationToInsured: planData.relationToInsured,
          effectiveDate: planData.effectiveDate,
          userId: adminUser.id,
          // Add planName separately to avoid TypeScript error
          ...(planData.planName ? { planName: planData.planName } : {})
        } as any // Using any as a last resort due to schema/type mismatch
      });
    }
    console.log(`${existingPlan ? 'Updated' : 'Created'} insurance plan: ${plan.payerName} (${plan.id})`);
  }

  // Refetch the plans to get their IDs
  const plans = await prisma.insurancePlan.findMany({
    where: {
      userId: adminUser.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (plans.length === 0) {
    console.error('Failed to create insurance plans for admin user.');
    return;
  }

  // Create a blood test report for admin
  console.log('Creating blood test report for admin user...');
  const bloodReport = await prisma.report.create({
    data: {
      userId: adminUser.id,
      type: 'BLOOD_TEST',
      fileName: 'admin_comprehensive_blood_panel.pdf',
      filePath: '/uploads/admin_comprehensive_blood_panel.pdf',
      parsedData: JSON.stringify({
        reportType: 'Comprehensive Metabolic Panel with CBC and Lipid Panel',
        labName: 'LabCorp',
        testDate: new Date().toISOString(),
        patientInfo: {
          name: adminUser.name || 'Admin User',
          dob: '1980-01-01',
          gender: 'Male'
        },
        biomarkers: [
          { name: 'Glucose', value: 95, unit: 'mg/dL', category: 'Metabolic' },
          { name: 'Hemoglobin', value: 14.2, unit: 'g/dL', category: 'Hematology' },
          { name: 'ALT', value: 25, unit: 'U/L', category: 'Liver' },
          { name: 'AST', value: 22, unit: 'U/L', category: 'Liver' },
          { name: 'Total Cholesterol', value: 185, unit: 'mg/dL', category: 'Lipids' },
          { name: 'HDL', value: 55, unit: 'mg/dL', category: 'Lipids' },
          { name: 'LDL', value: 110, unit: 'mg/dL', category: 'Lipids' },
          { name: 'Triglycerides', value: 120, unit: 'mg/dL', category: 'Lipids' }
        ]
      })
    }
  });
  console.log(`Created blood test report: ${bloodReport.id}`);

  // Create a blood test record 
  console.log('Creating blood test report for admin user...');
  const bloodTest = await prisma.bloodTest.create({
    data: {
      userId: adminUser.id,
      testDate: new Date('2025-01-15'),
      labName: 'Admin Test Lab',
      status: 'COMPLETED',
    },
  });
  console.log(`Created blood test report: ${bloodTest.id}`);

  // Add biomarkers to the blood test
  console.log('Creating biomarkers for blood test report...');
  await prisma.biomarker.createMany({
    data: [
      {
        bloodTestId: bloodTest.id,
        name: 'CHOLESTEROL',
        displayName: 'Total Cholesterol',
        value: 180,
        unit: 'mg/dL',
        category: 'LIPIDS',
        status: 'NORMAL',
      },
      {
        bloodTestId: bloodTest.id,
        name: 'HDL',
        displayName: 'HDL Cholesterol',
        value: 55,
        unit: 'mg/dL',
        category: 'LIPIDS',
        status: 'NORMAL',
      },
      {
        bloodTestId: bloodTest.id,
        name: 'LDL',
        displayName: 'LDL Cholesterol',
        value: 110,
        unit: 'mg/dL',
        category: 'LIPIDS',
        status: 'NORMAL',
      },
    ],
  });
  console.log('Created biomarkers successfully');

  // Create claims with various statuses...
  console.log('Creating claims with various statuses...');
  // Use the actual ClaimStatus enum values
  const claimStatuses = [ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, ClaimStatus.ACCEPTED, ClaimStatus.PAID, ClaimStatus.DENIED, ClaimStatus.REJECTED];
  
  // Get the created insurance plans
  const createdPlans = await prisma.insurancePlan.findMany({
    where: { userId: adminUser.id },
    orderBy: { createdAt: 'desc' },
  });
  
  if (createdPlans.length === 0) {
    console.error('No insurance plans found for admin user. Cannot create claims.');
    return;
  }
  
  for (let i = 0; i < claimStatuses.length; i++) {
    const status = claimStatuses[i];
    const claimNumber = `ADMIN-CLAIM-${i + 1}-${Date.now()}`;
    
    const claim = await prisma.claim.create({
      data: {
        userId: adminUser.id,
        insurancePlanId: createdPlans[i % createdPlans.length].id, // Alternate between plans
        claimNumber,
        status: status, // Now properly typed as ClaimStatus
        totalCharge: 100 + i * 50, // Correct field name
        submissionDate: new Date(),
      },
    });
    console.log(`Created claim with status ${status}: ${claim.claimNumber} (${claim.id})`);
  }

  console.log('Admin data seeding completed successfully.');
  console.log('Summary:');
  console.log(` - Created/updated ${insurancePlanData.length} insurance plans`);
  console.log(` - Created 1 blood test report with 3 biomarkers`);
  console.log(` - Created ${claimStatuses.length} claims with various statuses`);
}

// Run the main function
main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
