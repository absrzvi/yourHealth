import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (be careful in production!)
  console.log('🧹 Clearing existing data...');
  await prisma.chatMessage.deleteMany();
  await prisma.biomarker.deleteMany();
  await prisma.report.deleteMany();
  await prisma.weeklyInsight.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // Create a test user
  console.log('👤 Creating test user...');
  const hashedPassword = await hash('test123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
    },
  });

  // Create a test report
  console.log('📝 Creating test report...');
  const report = await prisma.report.create({
    data: {
      userId: user.id,
      type: 'BLOOD_TEST',
      fileName: 'blood_test_20230530.pdf',
      filePath: '/uploads/blood_test_20230530.pdf',
      testDate: new Date('2023-05-30'),
      labName: 'HealthLab Inc.',
      biomarkers: {
        create: [
          {
            name: 'Hemoglobin A1c',
            value: 5.2,
            unit: '%',
            range: '4.0-5.6',
            category: 'Diabetes',
          },
          {
            name: 'LDL Cholesterol',
            value: 110,
            unit: 'mg/dL',
            range: '<100',
            flag: 'High',
            category: 'Lipids',
          },
        ],
      },
    },
  });

  // Create a weekly insight
  console.log('💡 Creating weekly insight...');
  await prisma.weeklyInsight.create({
    data: {
      userId: user.id,
      weekNumber: 22,
      year: 2023,
      cardiovascularScore: 72,
      metabolicScore: 65,
      inflammationScore: 58,
      recommendations: JSON.stringify([
        'Consider reducing saturated fat intake to improve LDL levels',
        'Your A1c is in a good range, maintain current habits',
        'Incorporate more anti-inflammatory foods like leafy greens and berries',
      ]),
    },
  });

  // Create some chat messages
  console.log('💬 Creating chat messages...');
  await prisma.chatMessage.createMany({
    data: [
      {
        userId: user.id,
        role: 'user',
        content: 'What does my latest blood test show?',
      },
      {
        userId: user.id,
        role: 'assistant',
        content: 'Your latest blood test shows that your A1c is 5.2%, which is in the normal range. However, your LDL cholesterol is slightly elevated at 110 mg/dL.',
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
