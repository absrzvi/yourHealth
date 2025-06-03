import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        id: 'test-user-id',
      },
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser);
      return;
    }

    // Create test user with bcrypt hashed password
    const hashedPassword = await bcrypt.hash('test-password', 10);
    const user = await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      },
    });

    console.log('Test user created successfully:', user);
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
