import { prisma } from '../lib/db';

async function verifySeed() {
  try {
    console.log('🔍 Verifying seeded data...');
    
    // Check if user was created
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('❌ No users found in the database');
      return;
    }
    console.log('✅ User found:', { id: user.id, email: user.email, name: user.name });
    
    // Check if report was created
    const report = await prisma.report.findFirst({
      where: { userId: user.id },
      include: { biomarkers: true }
    });
    
    if (!report) {
      console.error('❌ No reports found for the user');
      return;
    }
    
    console.log('✅ Report found:', { 
      id: report.id, 
      type: report.type, 
      fileName: report.fileName,
      biomarkerCount: report.biomarkers.length 
    });
    
    // Check if weekly insight was created
    const insight = await prisma.weeklyInsight.findFirst({
      where: { userId: user.id }
    });
    
    if (!insight) {
      console.error('❌ No weekly insights found for the user');
      return;
    }
    
    console.log('✅ Weekly insight found:', { 
      id: insight.id,
      weekNumber: insight.weekNumber,
      year: insight.year,
      recommendations: JSON.parse(insight.recommendations || '[]')
    });
    
    // Check if chat messages were created
    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'asc' }
    });
    
    console.log(`✅ ${messages.length} chat messages found`);
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
    });
    
    console.log('\n🎉 Seed verification complete!');
    
  } catch (error) {
    console.error('❌ Error verifying seed data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeed();
