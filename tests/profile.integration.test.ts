import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/db';

const testEmail = 'profile-integration-test@example.com';
const testPassword = '$2a$10$h5w8J1wQb3Q8Q5e4v2v8rOqQvA6eQ0b6eQ0b6eQ0b6eQ0b6eQ0b6e'; // bcrypt for 'password123'
const testName = 'Profile Integration';

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.user.create({
    data: {
      email: testEmail,
      password: testPassword,
      name: testName,
    },
  });
});
afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
});

describe('Profile page', () => {
  it('redirects unauthenticated user to login', async () => {
    const res = await fetch('http://127.0.0.1:3000/profile', { redirect: 'manual' });
    expect([302, 307]).toContain(res.status);
    const location = res.headers.get('location');
    expect(location).toContain('/auth/login');
  });

  // Authenticated user test would require cookie/session handling, which can be added with supertest or Playwright
});
