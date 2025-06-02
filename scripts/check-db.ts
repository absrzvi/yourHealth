import { prisma } from '../lib/db';

async function checkDb() {
  try {
    console.log('Checking database connection...');
    const reports = await prisma.report.findMany();
    console.log(`Found ${reports.length} reports in the database`);
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
