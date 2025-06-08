// Script to seed the database with blood test data and claims for the current logged-in user
import { PrismaClient, ClaimStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding for current user...');

  // Get the specific user by email
  const userEmail = 'abs.rzvi@gmail.com';
  
  const user = await prisma.user.findUnique({
    where: { email: userEmail }
  });

  if (!user) {
    console.error(`User with email ${userEmail} not found in the database. Please check the email address.`);
    return;
  }

  console.log(`Found user: ${user.name || user.email} (${user.id})`);

  // Check if user already has insurance plans
  const existingPlans = await prisma.insurancePlan.findMany({
    where: { userId: user.id }
  });

  let primaryInsurancePlanId;

  // Create insurance plans if needed
  if (existingPlans.length === 0) {
    console.log('Creating insurance plans for user...');
    
    const insurancePlans = [
      {
        payerName: 'Blue Cross Blue Shield',
        payerId: 'BCBS001',
        memberId: 'BCBS123456789',
        groupNumber: 'GRP123456',
        planType: 'PPO',
        isPrimary: true,
        isActive: true,
        effectiveDate: new Date('2025-01-01'),
        userId: user.id,
      }
    ];

    for (const planData of insurancePlans) {
      const plan = await prisma.insurancePlan.create({
        data: planData
      });
      console.log(`Created insurance plan: ${plan.payerName}`);
      if (plan.isPrimary) {
        primaryInsurancePlanId = plan.id;
      }
    }
  } else {
    console.log('Using existing insurance plans');
    // Find primary insurance plan
    const primaryPlan = existingPlans.find(plan => plan.isPrimary);
    primaryInsurancePlanId = primaryPlan?.id || existingPlans[0].id;
  }

  if (!primaryInsurancePlanId) {
    console.error('No insurance plan found or created. Cannot continue.');
    return;
  }

  // Create a blood test report
  console.log('Creating blood test report...');
  const bloodReport = await prisma.report.create({
    data: {
      userId: user.id,
      type: 'BLOOD_TEST',
      fileName: 'comprehensive_blood_panel.pdf',
      filePath: '/uploads/comprehensive_blood_panel.pdf',
      parsedData: JSON.stringify({
        reportType: 'Comprehensive Metabolic Panel with CBC and Lipid Panel',
        labName: 'LabCorp',
        testDate: new Date().toISOString(),
        patientInfo: {
          name: user.name || 'Current User',
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

  // Create a blood test record linked to the report
  const bloodTest = await prisma.bloodTest.create({
    data: {
      userId: user.id,
      reportId: bloodReport.id,
      testDate: new Date(),
      labName: 'LabCorp',
      labId: 'LC12345',
      status: 'COMPLETED',
      rawData: {
        reportType: 'Comprehensive Metabolic Panel with CBC and Lipid Panel',
        collectionDate: new Date().toISOString()
      }
    }
  });
  console.log(`Created blood test: ${bloodTest.id}`);

  // Add biomarkers to the blood test
  const biomarkers = [
    { name: 'Glucose', displayName: 'Glucose', value: 95, unit: 'mg/dL', category: 'Metabolic', referenceRange: '70-99 mg/dL' },
    { name: 'Hemoglobin', displayName: 'Hemoglobin', value: 14.2, unit: 'g/dL', category: 'Hematology', referenceRange: '13.5-17.5 g/dL' },
    { name: 'ALT', displayName: 'Alanine Aminotransferase', value: 25, unit: 'U/L', category: 'Liver', referenceRange: '7-56 U/L' },
    { name: 'AST', displayName: 'Aspartate Aminotransferase', value: 22, unit: 'U/L', category: 'Liver', referenceRange: '10-40 U/L' },
    { name: 'Total Cholesterol', displayName: 'Total Cholesterol', value: 185, unit: 'mg/dL', category: 'Lipids', referenceRange: '<200 mg/dL' },
    { name: 'HDL', displayName: 'HDL Cholesterol', value: 55, unit: 'mg/dL', category: 'Lipids', referenceRange: '>40 mg/dL' },
    { name: 'LDL', displayName: 'LDL Cholesterol', value: 110, unit: 'mg/dL', category: 'Lipids', referenceRange: '<100 mg/dL' },
    { name: 'Triglycerides', displayName: 'Triglycerides', value: 120, unit: 'mg/dL', category: 'Lipids', referenceRange: '<150 mg/dL' }
  ];

  for (const biomarker of biomarkers) {
    await prisma.biomarker.create({
      data: {
        bloodTestId: bloodTest.id,
        name: biomarker.name,
        displayName: biomarker.displayName,
        value: biomarker.value,
        unit: biomarker.unit,
        referenceRange: biomarker.referenceRange,
        category: biomarker.category,
        status: 'NORMAL',
        isFlagged: false,
        rawValue: biomarker.value.toString() + ' ' + biomarker.unit
      }
    });
  }
  console.log(`Added ${biomarkers.length} biomarkers to blood test`);

  // Create claims for the current user
  console.log('Creating claims for current user...');
  
  // Define claim statuses to create
  const claimStatuses = [
    ClaimStatus.DRAFT,
    ClaimStatus.SUBMITTED,
    ClaimStatus.ACCEPTED,
    ClaimStatus.PAID
  ];

  for (let i = 0; i < claimStatuses.length; i++) {
    const status = claimStatuses[i];
    const claimNumber = `CLM${Date.now().toString().slice(-6)}-${i + 1}`;
    
    const claim = await prisma.claim.create({
      data: {
        userId: user.id,
        insurancePlanId: primaryInsurancePlanId,
        reportId: i === 0 ? bloodReport.id : null, // Link first claim to the blood report
        claimNumber: claimNumber,
        status: status,
        totalCharge: 100 + (i * 100), // Different amounts
        allowedAmount: status === ClaimStatus.DRAFT || status === ClaimStatus.SUBMITTED ? 
          null : 80 + (i * 80),
        paidAmount: status === ClaimStatus.PAID ? 
          70 + (i * 70) : null,
        patientResponsibility: status === ClaimStatus.PAID ? 
          10 + (i * 10) : null,
        submissionDate: status === ClaimStatus.DRAFT ? 
          null : new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        processedDate: status === ClaimStatus.PAID || status === ClaimStatus.DENIED ? 
          new Date(Date.now() - (i * 12 * 60 * 60 * 1000)) : null,
        denialReason: status === ClaimStatus.DENIED ? 
          'Service not covered by plan' : null,
      }
    });
    
    console.log(`Created claim: ${claim.claimNumber} with status ${claim.status}`);

    // Create claim lines for each claim
    const procedures = [
      { cptCode: '99213', description: 'Office visit, established patient', charge: 85.00 },
      { cptCode: '85025', description: 'Complete blood cell count', charge: 45.00 },
      { cptCode: '80053', description: 'Comprehensive metabolic panel', charge: 65.00 }
    ];

    // Add 1-2 procedures per claim
    const numProcedures = 1 + (i % 2);
    
    for (let j = 0; j < numProcedures; j++) {
      const procedure = procedures[j % procedures.length];
      
      await prisma.claimLine.create({
        data: {
          claimId: claim.id,
          lineNumber: j + 1,
          cptCode: procedure.cptCode,
          description: procedure.description,
          icd10Codes: ["E11.9", "I10"], // Diabetes and Hypertension
          charge: procedure.charge,
          units: 1,
          serviceDate: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        }
      });
    }

    // Add claim events
    const eventTypes = [
      "CREATED", "SUBMITTED", "PROCESSED", "PAID"
    ];

    // Add appropriate events based on claim status
    let numEvents = 1; // Every claim has at least CREATED event
    
    if (status !== ClaimStatus.DRAFT) {
      numEvents = eventTypes.indexOf(status.toString()) + 1;
      if (numEvents < 2) numEvents = 2; // At least CREATED and SUBMITTED
    }
    
    for (let j = 0; j < numEvents; j++) {
      if (j < eventTypes.length) {
        await prisma.claimEvent.create({
          data: {
            claimId: claim.id,
            eventType: eventTypes[j],
            notes: `Claim ${eventTypes[j].toLowerCase()} on ${new Date().toLocaleDateString()}`,
            eventData: { timestamp: new Date().toISOString() },
          }
        });
      }
    }
  }

  console.log('Database seeding completed successfully for current user!');
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
