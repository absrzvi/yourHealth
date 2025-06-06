import { PrismaClient } from '@prisma/client';

async function checkClaimLineSchema() {
  const prisma = new PrismaClient();
  
  try {
    // Get table info using raw query
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(ClaimLine)` as any[];
    
    console.log('ClaimLine Table Schema:');
    console.table(tableInfo);
    
    // Check if new columns exist
    const newColumns = [
      'denialReason',
      'denialCode',
      'allowedAmount',
      'paidAmount',
      'patientResponsibility',
      'serviceFacilityName',
      'serviceFacilityNpi',
      'billingProviderNpi',
      'billingProviderTaxId',
      'renderingProviderNpi',
      'referringProviderNpi'
    ];
    
    const existingColumns = tableInfo.map(col => col.name);
    const missingColumns = newColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All new columns were added successfully!');
    } else {
      console.log('❌ Missing columns:', missingColumns);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClaimLineSchema();
