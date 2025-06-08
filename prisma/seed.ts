import { PrismaClient, ClaimStatus } from '@prisma/client'
import { hash } from 'bcrypt'

// Initialize Prisma Client
const prisma = new PrismaClient()

// Biomarker categories for CPT code generation
const biomarkerCategories = {
  'Metabolic': ['Glucose', 'Insulin', 'HbA1c'],
  'Hematology': ['Hemoglobin', 'Hematocrit', 'RBC', 'WBC', 'Platelets', 'MCV', 'MCH', 'MCHC', 'RDW'],
  'Liver': ['ALT', 'AST', 'ALP', 'GGT', 'Bilirubin', 'Albumin', 'Total Protein'],
  'Kidney': ['BUN', 'Creatinine', 'eGFR', 'Uric Acid'],
  'Electrolytes': ['Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium', 'Magnesium', 'Phosphate'],
  'Lipids': ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides', 'VLDL', 'Cholesterol/HDL Ratio'],
  'Thyroid': ['TSH', 'Free T4', 'Free T3', 'Total T4', 'Total T3'],
  'Vitamins': ['Vitamin D', 'Vitamin B12', 'Folate', 'Ferritin'],
  'Inflammation': ['CRP', 'ESR', 'Homocysteine'],
  'Hormones': ['Testosterone', 'Estradiol', 'Progesterone', 'Cortisol']
}

async function main() {
  console.log('Starting database seeding...')

  // Create test user
  const hashedPassword = await hash('password123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  })
  console.log(`Created user: ${user.name} (${user.email})`)

  // Create insurance plans
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
    },
    {
      payerName: 'Aetna',
      payerId: 'AETNA001',
      memberId: 'AET987654321',
      groupNumber: 'GRP987654',
      planType: 'HMO',
      isPrimary: false,
      isActive: true,
      effectiveDate: new Date('2025-01-01'),
      userId: user.id,
    },
  ]

  for (const planData of insurancePlans) {
    const plan = await prisma.insurancePlan.upsert({
      where: {
        id: planData.payerId, // Using payerId as the ID for easy upsert
      },
      update: planData,
      create: {
        ...planData,
      },
    })
    console.log(`Created insurance plan: ${plan.payerName}`)
  }

  // Refetch the plans to get their IDs
  const plans = await prisma.insurancePlan.findMany({
    where: { userId: user.id },
  })

  // Create claims with different statuses
  const claimStatuses: ClaimStatus[] = [
    'DRAFT', 'READY', 'SUBMITTED', 'ACCEPTED', 
    'REJECTED', 'DENIED', 'PARTIALLY_PAID', 'PAID'
  ]

  for (let i = 0; i < claimStatuses.length; i++) {
    const status = claimStatuses[i]
    const claimNumber = `CLAIM${i + 1}-${Date.now().toString().slice(-6)}`
    
    // Use either the first or second plan
    const planIndex = i % plans.length
    
    const claim = await prisma.claim.create({
      data: {
        userId: user.id,
        insurancePlanId: plans[planIndex].id,
        claimNumber: claimNumber,
        status: status,
        totalCharge: 100 + (i * 100), // Different amounts
        allowedAmount: status === 'DRAFT' || status === 'READY' || status === 'SUBMITTED' ? 
          null : 80 + (i * 80),
        paidAmount: status === 'PAID' || status === 'PARTIALLY_PAID' ? 
          70 + (i * 70) : null,
        patientResponsibility: status === 'PAID' || status === 'PARTIALLY_PAID' ? 
          10 + (i * 10) : null,
        submissionDate: status === 'DRAFT' || status === 'READY' ? 
          null : new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        processedDate: status === 'PAID' || status === 'PARTIALLY_PAID' || status === 'DENIED' ? 
          new Date(Date.now() - (i * 12 * 60 * 60 * 1000)) : null,
        denialReason: status === 'DENIED' ? 
          'Service not covered by plan' : null,
      }
    })
    
    console.log(`Created claim: ${claim.claimNumber} with status ${claim.status}`)

    // Create claim lines for each claim
    const procedures = [
      { cptCode: '99213', description: 'Office visit, established patient', charge: 85.00 },
      { cptCode: '85025', description: 'Complete blood cell count', charge: 45.00 },
      { cptCode: '80053', description: 'Comprehensive metabolic panel', charge: 65.00 },
      { cptCode: '93000', description: 'Electrocardiogram', charge: 125.00 }
    ]

    // Add 1-3 procedures per claim
    const numProcedures = 1 + (i % 3)
    let totalClaimCharge = 0
    
    for (let j = 0; j < numProcedures; j++) {
      const procedure = procedures[j % procedures.length]
      totalClaimCharge += procedure.charge
      
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
      })
    }

    // Update total charge to match claim lines
    await prisma.claim.update({
      where: { id: claim.id },
      data: { totalCharge: totalClaimCharge }
    })

    // Add claim events
    const eventTypes = [
      "CREATED", "SUBMITTED", "PROCESSED", "PAID", "DENIED", "APPEALED"
    ]

    // Add appropriate events based on claim status
    let numEvents = 1 // Every claim has at least CREATED event
    
    if (status !== 'DRAFT') {
      numEvents = eventTypes.indexOf(status) + 1
      if (numEvents < 2) numEvents = 2 // At least CREATED and SUBMITTED
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
        })
      }
    }

    // Add eligibility check for non-DRAFT claims
    if (status !== 'DRAFT') {
      await prisma.eligibilityCheck.create({
        data: {
          insurancePlanId: plans[planIndex].id,
          claimId: claim.id,
          status: 'active',
          deductible: 1000.00,
          deductibleMet: 750.00,
          outOfPocketMax: 3000.00,
          outOfPocketMet: 1500.00,
          copay: 20.00,
          coinsurance: 0.2,
          checkedAt: new Date(Date.now() - (i * 36 * 60 * 60 * 1000)),
          responseData: {
            coverageActive: true,
            benefitDetails: {
              inNetwork: true,
              coverageStart: '2025-01-01',
              coverageEnd: '2025-12-31'
            }
          }
        }
      })
    }
  }

  // Create some denial patterns for reporting
  const denialPatterns = [
    {
      payerId: 'BCBS001',
      denialCode: 'CO50',
      denialReason: 'Non-covered service',
      frequency: 12,
      lastOccurred: new Date(),
      preventionRule: { 
        checkCoverage: true, 
        validateCodes: ["99070", "99499"],
        notes: "Always verify coverage for these services"
      }
    },
    {
      payerId: 'AETNA001',
      denialCode: 'PR96',
      denialReason: 'Prior authorization required',
      frequency: 8,
      lastOccurred: new Date(),
      preventionRule: {
        checkAuthorization: true,
        services: ["J3301", "99215"],
        notes: "Pre-auth needed for specialist visits and injections"
      }
    }
  ]

  for (const pattern of denialPatterns) {
    await prisma.denialPattern.create({
      data: pattern
    })
    console.log(`Created denial pattern: ${pattern.denialCode} - ${pattern.denialReason}`)
  }

  // Create blood test reports with biomarkers for CPT code generation testing
  console.log('Creating blood test reports with biomarkers...')
  
  // Create a report first
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
          name: 'Test User',
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
          { name: 'Triglycerides', value: 120, unit: 'mg/dL', category: 'Lipids' },
          { name: 'Sodium', value: 140, unit: 'mmol/L', category: 'Electrolytes' },
          { name: 'Potassium', value: 4.2, unit: 'mmol/L', category: 'Electrolytes' },
          { name: 'Chloride', value: 101, unit: 'mmol/L', category: 'Electrolytes' },
          { name: 'BUN', value: 15, unit: 'mg/dL', category: 'Kidney' },
          { name: 'Creatinine', value: 0.9, unit: 'mg/dL', category: 'Kidney' },
          { name: 'TSH', value: 2.5, unit: 'mIU/L', category: 'Thyroid' }
        ]
      })
    }
  })
  console.log(`Created blood test report: ${bloodReport.id}`)

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
  })
  console.log(`Created blood test: ${bloodTest.id}`)

  // Add biomarkers to the blood test
  const biomarkers = [
    { name: 'Glucose', displayName: 'Glucose', value: 95, unit: 'mg/dL', category: 'Metabolic', referenceRange: '70-99 mg/dL' },
    { name: 'Hemoglobin', displayName: 'Hemoglobin', value: 14.2, unit: 'g/dL', category: 'Hematology', referenceRange: '13.5-17.5 g/dL' },
    { name: 'ALT', displayName: 'Alanine Aminotransferase', value: 25, unit: 'U/L', category: 'Liver', referenceRange: '7-56 U/L' },
    { name: 'AST', displayName: 'Aspartate Aminotransferase', value: 22, unit: 'U/L', category: 'Liver', referenceRange: '10-40 U/L' },
    { name: 'Total Cholesterol', displayName: 'Total Cholesterol', value: 185, unit: 'mg/dL', category: 'Lipids', referenceRange: '<200 mg/dL' },
    { name: 'HDL', displayName: 'HDL Cholesterol', value: 55, unit: 'mg/dL', category: 'Lipids', referenceRange: '>40 mg/dL' },
    { name: 'LDL', displayName: 'LDL Cholesterol', value: 110, unit: 'mg/dL', category: 'Lipids', referenceRange: '<100 mg/dL' },
    { name: 'Triglycerides', displayName: 'Triglycerides', value: 120, unit: 'mg/dL', category: 'Lipids', referenceRange: '<150 mg/dL' },
    { name: 'Sodium', displayName: 'Sodium', value: 140, unit: 'mmol/L', category: 'Electrolytes', referenceRange: '135-145 mmol/L' },
    { name: 'Potassium', displayName: 'Potassium', value: 4.2, unit: 'mmol/L', category: 'Electrolytes', referenceRange: '3.5-5.0 mmol/L' },
    { name: 'Chloride', displayName: 'Chloride', value: 101, unit: 'mmol/L', category: 'Electrolytes', referenceRange: '98-107 mmol/L' },
    { name: 'BUN', displayName: 'Blood Urea Nitrogen', value: 15, unit: 'mg/dL', category: 'Kidney', referenceRange: '7-20 mg/dL' },
    { name: 'Creatinine', displayName: 'Creatinine', value: 0.9, unit: 'mg/dL', category: 'Kidney', referenceRange: '0.6-1.2 mg/dL' },
    { name: 'TSH', displayName: 'Thyroid Stimulating Hormone', value: 2.5, unit: 'mIU/L', category: 'Thyroid', referenceRange: '0.4-4.0 mIU/L' },
    // Add CBC components
    { name: 'WBC', displayName: 'White Blood Cell Count', value: 7.5, unit: 'K/uL', category: 'Hematology', referenceRange: '4.5-11.0 K/uL' },
    { name: 'RBC', displayName: 'Red Blood Cell Count', value: 4.8, unit: 'M/uL', category: 'Hematology', referenceRange: '4.5-5.9 M/uL' },
    { name: 'Platelets', displayName: 'Platelets', value: 250, unit: 'K/uL', category: 'Hematology', referenceRange: '150-450 K/uL' },
    { name: 'Hematocrit', displayName: 'Hematocrit', value: 42, unit: '%', category: 'Hematology', referenceRange: '41-50%' },
    { name: 'MCV', displayName: 'Mean Corpuscular Volume', value: 88, unit: 'fL', category: 'Hematology', referenceRange: '80-100 fL' },
    { name: 'MCH', displayName: 'Mean Corpuscular Hemoglobin', value: 29, unit: 'pg', category: 'Hematology', referenceRange: '27-33 pg' },
    { name: 'MCHC', displayName: 'Mean Corpuscular Hemoglobin Concentration', value: 33, unit: 'g/dL', category: 'Hematology', referenceRange: '32-36 g/dL' },
    // Add more CMP components
    { name: 'Calcium', displayName: 'Calcium', value: 9.5, unit: 'mg/dL', category: 'Electrolytes', referenceRange: '8.5-10.5 mg/dL' },
    { name: 'Total Protein', displayName: 'Total Protein', value: 7.0, unit: 'g/dL', category: 'Liver', referenceRange: '6.0-8.3 g/dL' },
    { name: 'Albumin', displayName: 'Albumin', value: 4.2, unit: 'g/dL', category: 'Liver', referenceRange: '3.5-5.0 g/dL' },
    { name: 'Globulin', displayName: 'Globulin', value: 2.8, unit: 'g/dL', category: 'Liver', referenceRange: '2.0-3.5 g/dL' },
    { name: 'A/G Ratio', displayName: 'Albumin/Globulin Ratio', value: 1.5, unit: '', category: 'Liver', referenceRange: '1.0-2.1' },
    { name: 'Bilirubin', displayName: 'Total Bilirubin', value: 0.8, unit: 'mg/dL', category: 'Liver', referenceRange: '0.1-1.2 mg/dL' },
    { name: 'ALP', displayName: 'Alkaline Phosphatase', value: 70, unit: 'U/L', category: 'Liver', referenceRange: '40-129 U/L' }
  ]

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
    })
  }
  console.log(`Added ${biomarkers.length} biomarkers to blood test`)

  // Create a second blood test with abnormal values for testing
  const abnormalReport = await prisma.report.create({
    data: {
      userId: user.id,
      type: 'BLOOD_TEST',
      fileName: 'abnormal_blood_panel.pdf',
      filePath: '/uploads/abnormal_blood_panel.pdf',
      parsedData: JSON.stringify({
        reportType: 'Comprehensive Metabolic Panel with Lipid Panel',
        labName: 'Quest Diagnostics',
        testDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        patientInfo: {
          name: 'Test User',
          dob: '1980-01-01',
          gender: 'Male'
        },
        biomarkers: [
          { name: 'Glucose', value: 120, unit: 'mg/dL', category: 'Metabolic' }, // High
          { name: 'Total Cholesterol', value: 240, unit: 'mg/dL', category: 'Lipids' }, // High
          { name: 'LDL', value: 160, unit: 'mg/dL', category: 'Lipids' }, // High
          { name: 'HDL', value: 35, unit: 'mg/dL', category: 'Lipids' }, // Low
          { name: 'Triglycerides', value: 200, unit: 'mg/dL', category: 'Lipids' }, // High
          { name: 'ALT', value: 65, unit: 'U/L', category: 'Liver' }, // High
          { name: 'AST', value: 60, unit: 'U/L', category: 'Liver' } // High
        ]
      })
    }
  })
  
  const abnormalBloodTest = await prisma.bloodTest.create({
    data: {
      userId: user.id,
      reportId: abnormalReport.id,
      testDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      labName: 'Quest Diagnostics',
      labId: 'QD67890',
      status: 'COMPLETED',
      rawData: {
        reportType: 'Comprehensive Metabolic Panel with Lipid Panel',
        collectionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  })
  
  const abnormalBiomarkers = [
    { name: 'Glucose', displayName: 'Glucose', value: 120, unit: 'mg/dL', category: 'Metabolic', referenceRange: '70-99 mg/dL', isFlagged: true },
    { name: 'Total Cholesterol', displayName: 'Total Cholesterol', value: 240, unit: 'mg/dL', category: 'Lipids', referenceRange: '<200 mg/dL', isFlagged: true },
    { name: 'LDL', displayName: 'LDL Cholesterol', value: 160, unit: 'mg/dL', category: 'Lipids', referenceRange: '<100 mg/dL', isFlagged: true },
    { name: 'HDL', displayName: 'HDL Cholesterol', value: 35, unit: 'mg/dL', category: 'Lipids', referenceRange: '>40 mg/dL', isFlagged: true },
    { name: 'Triglycerides', displayName: 'Triglycerides', value: 200, unit: 'mg/dL', category: 'Lipids', referenceRange: '<150 mg/dL', isFlagged: true },
    { name: 'ALT', displayName: 'Alanine Aminotransferase', value: 65, unit: 'U/L', category: 'Liver', referenceRange: '7-56 U/L', isFlagged: true },
    { name: 'AST', displayName: 'Aspartate Aminotransferase', value: 60, unit: 'U/L', category: 'Liver', referenceRange: '10-40 U/L', isFlagged: true },
    // Add normal values for other tests
    { name: 'Sodium', displayName: 'Sodium', value: 140, unit: 'mmol/L', category: 'Electrolytes', referenceRange: '135-145 mmol/L', isFlagged: false },
    { name: 'Potassium', displayName: 'Potassium', value: 4.2, unit: 'mmol/L', category: 'Electrolytes', referenceRange: '3.5-5.0 mmol/L', isFlagged: false },
    { name: 'Chloride', displayName: 'Chloride', value: 101, unit: 'mmol/L', category: 'Electrolytes', referenceRange: '98-107 mmol/L', isFlagged: false },
    { name: 'BUN', displayName: 'Blood Urea Nitrogen', value: 15, unit: 'mg/dL', category: 'Kidney', referenceRange: '7-20 mg/dL', isFlagged: false },
    { name: 'Creatinine', displayName: 'Creatinine', value: 0.9, unit: 'mg/dL', category: 'Kidney', referenceRange: '0.6-1.2 mg/dL', isFlagged: false }
  ]

  for (const biomarker of abnormalBiomarkers) {
    await prisma.biomarker.create({
      data: {
        bloodTestId: abnormalBloodTest.id,
        name: biomarker.name,
        displayName: biomarker.displayName,
        value: biomarker.value,
        unit: biomarker.unit,
        referenceRange: biomarker.referenceRange,
        category: biomarker.category,
        status: biomarker.isFlagged ? 'ABNORMAL' : 'NORMAL',
        isFlagged: biomarker.isFlagged,
        rawValue: biomarker.value.toString() + ' ' + biomarker.unit
      }
    })
  }
  console.log(`Added ${abnormalBiomarkers.length} biomarkers to abnormal blood test`)
  
  console.log('Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
