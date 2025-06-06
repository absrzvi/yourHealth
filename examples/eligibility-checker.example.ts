import { PrismaClient } from '@prisma/client';
import { 
  EligibilityChecker, 
  DefaultEligibilityParser, 
  DefaultEligibilityValidator,
  CacheFactory
} from '../lib/claims/eligibility';
import { CheckEligibilityOptions } from '../lib/claims/eligibility/types';

// Initialize Prisma client
const prisma = new PrismaClient();

// Create a sample insurance plan in the database
async function createSampleInsurancePlan() {
  return prisma.insurancePlan.upsert({
    where: { id: 'sample-plan-1' },
    update: {},
    create: {
      id: 'sample-plan-1',
      userId: 'user-1',
      payerId: 'sample-payer',
      payerName: 'Sample Insurance Co',
      memberId: 'MEMBER123',
      groupNumber: 'GRP456',
      planType: 'PPO',
      isPrimary: true,
      isActive: true,
      effectiveDate: new Date('2024-01-01'),
      termDate: new Date('2024-12-31'),
    },
  });
}

// Main function to demonstrate eligibility checking
async function main() {
  try {
    console.log('🚀 Starting eligibility checker example...');
    
    // Create a sample insurance plan
    await createSampleInsurancePlan();
    console.log('✅ Created sample insurance plan');
    
    // Initialize the eligibility checker with memory cache
    const checker = new EligibilityChecker({
      prisma,
      cacheType: 'memory',
      defaultCacheTtl: 3600, // 1 hour
    });
    
    // Register default parser and validator
    checker.registerParser(new DefaultEligibilityParser());
    checker.registerValidator('sample-payer', new DefaultEligibilityValidator());
    
    // Configure the sample payer
    checker.configurePayer({
      id: 'sample-payer',
      name: 'Sample Insurance Co',
      supportsRealtime: true,
      defaultResponseTime: 1000,
    });
    
    // Example 1: Basic eligibility check
    console.log('\n🔍 Checking basic eligibility...');
    const basicResult = await checker.checkEligibility('MEMBER123');
    console.log('Basic eligibility result:', {
      isEligible: basicResult.isEligible,
      plan: basicResult.plan,
      effectiveDate: basicResult.effectiveDate,
      termDate: basicResult.termDate,
      cached: basicResult.cached || false,
    });
    
    // Example 2: Check with service details
    console.log('\n🏥 Checking eligibility with service details...');
    const serviceOptions: CheckEligibilityOptions = {
      serviceDate: new Date('2024-06-15'),
      serviceType: 'LAB',
      serviceCode: '80053',
      providerNpi: '1234567890',
    };
    
    const serviceResult = await checker.checkEligibility('MEMBER123', serviceOptions);
    console.log('Service eligibility result:', {
      isEligible: serviceResult.isEligible,
      serviceType: serviceOptions.serviceType,
      coverage: serviceResult.coverage,
      cached: serviceResult.cached || false,
    });
    
    // Example 3: Force refresh the cache
    console.log('\n🔄 Force refreshing eligibility check...');
    const refreshResult = await checker.checkEligibility('MEMBER123', {
      ...serviceOptions,
      forceRefresh: true,
    });
    console.log('Refreshed eligibility result:', {
      isEligible: refreshResult.isEligible,
      cached: refreshResult.cached || false,
    });
    
    // Example 4: Clear cache
    console.log('\n🧹 Clearing cache...');
    await checker.clearCache('MEMBER123');
    console.log('Cache cleared successfully');
    
  } catch (error) {
    console.error('❌ Error in eligibility checker example:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the example
main()
  .then(() => console.log('\n✨ Example completed!'))
  .catch(console.error);

// Add TypeScript configuration for Node.js modules
// This helps with module resolution in the example
// @ts-ignore - This is just for the example
if (import.meta.url === `file://${process.argv[1]}`) {
  // Run the example if this file is executed directly
  main().catch(console.error);
}
