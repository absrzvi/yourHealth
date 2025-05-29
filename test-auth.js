const { PrismaClient } = require('@prisma/client');
const { sign } = require('jsonwebtoken');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function getTestUserToken() {
  const email = 'test@example.com';
  const password = 'testpassword';
  const name = 'Test User';

  // Check if user exists, create if not
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const hashedPassword = await hash(password, 12);
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  }

  // Create a JWT token for the user
  const token = sign(
    { id: user.id, email: user.email },
    process.env.NEXTAUTH_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );

  return token;
}

async function testAuthenticatedRequest() {
  try {
    // Get a valid JWT token
    const token = await getTestUserToken();
    
    // Make an authenticated request to the correlations endpoint
    const response = await fetch('http://localhost:3000/api/correlations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Request failed: ${error}`);
    }

    const data = await response.json();
    console.log('Correlations data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuthenticatedRequest();
