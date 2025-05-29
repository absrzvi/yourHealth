import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../lib/db';

const BASE_URL = 'http://127.0.0.1:3000/api/auth';
const CREDENTIALS_ENDPOINT = `${BASE_URL}/callback/credentials`;
const CSRF_ENDPOINT = `${BASE_URL}/csrf`;
const testEmail = 'login-integration-test@example.com';
const testPassword = 'password123';
const testName = 'Login Integration';

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  // Create a user for login
  await prisma.user.create({
    data: {
      email: testEmail,
      password: '$2a$10$h5w8J1wQb3Q8Q5e4v2v8rOqQvA6eQ0b6eQ0b6eQ0b6eQ0b6eQ0b6e', // bcrypt hash for 'password123'
      name: testName,
    },
  });
});

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
});

describe('/api/auth/[...nextauth] (integration)', () => {
  it('logs in successfully with correct credentials', async () => {
    // First get CSRF token
    const csrfResponse = await fetch(CSRF_ENDPOINT);
    const { csrfToken } = await csrfResponse.json();
    
    const res = await fetch(CREDENTIALS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken: csrfToken || 'test',
        email: testEmail,
        password: testPassword,
      }).toString(),
    });
    
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toMatch(/error=CredentialsSignin/);
  });

  it('rejects login with wrong password', async () => {
    const csrfResponse = await fetch(CSRF_ENDPOINT);
    const { csrfToken } = await csrfResponse.json();
    
    const res = await fetch(CREDENTIALS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken: csrfToken || 'test',
        email: testEmail,
        password: 'wrongpassword',
      }).toString(),
    });
    
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/error=CredentialsSignin/);
  });

  it('rejects login with missing fields', async () => {
    const csrfResponse = await fetch(CSRF_ENDPOINT);
    const { csrfToken } = await csrfResponse.json();
    
    const res = await fetch(CREDENTIALS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken: csrfToken || 'test',
        email: '',
        password: '',
      }).toString(),
    });
    
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toMatch(/error=CredentialsSignin/);
  });
});
