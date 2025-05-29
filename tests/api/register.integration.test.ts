import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../lib/db';

const BASE_URL = 'http://127.0.0.1:3000/api/auth';
const REGISTER_ENDPOINT = `${BASE_URL}/register`;
const CSRF_ENDPOINT = `${BASE_URL}/csrf`;
const testEmail = 'integration-test@example.com';

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
});

describe('/api/auth/register (integration)', () => {
  it('registers a new user successfully', async () => {
    // First get CSRF token
    const csrfResponse = await fetch(CSRF_ENDPOINT);
    const { csrfToken } = await csrfResponse.json();
    
    const res = await fetch(REGISTER_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || 'test'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
        name: 'Integration Test'
      })
    });
    
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    
    // Confirm user was created in DB
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user).not.toBeNull();
    expect(user?.email).toBe(testEmail);
  });

  it('rejects duplicate email', async () => {
    // Create user first
    await prisma.user.create({ 
      data: { 
        email: testEmail, 
        password: '$2a$10$h5w8J1wQb3Q8Q5e4v2v8rOqQvA6eQ0b6eQ0b6eQ0b6eQ0b6eQ0b6e', // bcrypt hash
        name: 'Dup' 
      } 
    });
    
    // Get CSRF token
    const csrfResponse = await fetch(CSRF_ENDPOINT);
    const { csrfToken } = await csrfResponse.json();
    
    const res = await fetch(REGISTER_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || 'test'
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
        name: 'Integration Test'
      })
    });
    
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/already exists/i);
  });

  it('rejects invalid input', async () => {
    // Get CSRF token
    const csrfResponse = await fetch(CSRF_ENDPOINT);
    const { csrfToken } = await csrfResponse.json();
    
    const res = await fetch(REGISTER_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken || 'test'
      },
      body: JSON.stringify({ 
        email: 'not-an-email', 
        password: 'short', 
        name: '' 
      })
    });
    
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/invalid input/i);
    expect(json.details).toBeDefined();
  });
});
