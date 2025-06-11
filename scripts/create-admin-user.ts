import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if admin user already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists.`);
      
      // Update the user to ensure they have admin role and are active
      // Use prisma.$executeRaw to update the user with raw SQL
      await prisma.$executeRaw`UPDATE "User" SET role = 'ADMIN', active = true WHERE email = ${adminEmail}`;  
      
      console.log(`Updated user ${adminEmail} to ensure admin role and active status.`);
      return;
    }

    // Create admin password - use environment variable or default
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const hashedPassword = await hash(adminPassword, 10);

    // Create admin user
    // Create user with default role
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Administrator',
        password: hashedPassword,
      },
    });
    
    // Then update the role with raw SQL
    await prisma.$executeRaw`UPDATE "User" SET role = 'ADMIN', active = true WHERE id = ${adminUser.id}`;

    console.log(`Created admin user with email ${adminUser.email}`);
    console.log('Please change the default password immediately after first login.');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
