import { prisma } from '../lib/db';

async function testConnection() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // List all tables (SQLite specific)
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'` as any[];
    console.log('\n📊 Database tables:');
    console.table(tables);
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
