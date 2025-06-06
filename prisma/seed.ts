import { PrismaClient, ClaimStatus } from '@prisma/client'
import { hash } from 'bcrypt'

// Initialize Prisma Client
const prisma = new PrismaClient()

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
