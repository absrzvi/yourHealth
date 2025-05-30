import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with test user...');
  
  // Create test user with a simple password for testing
  // For production, use stronger passwords and higher salt rounds [SFT]
  const plainPassword = 'password123';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      // Update password if user exists to ensure correct hash
      password: hashedPassword,
    },
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  });

  console.log(`Database seeded successfully. Created/updated user: ${user.email}`);
  console.log('You can now login with:\nEmail: test@example.com\nPassword: password123');
  
  return { user };
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
