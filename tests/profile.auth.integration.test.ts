import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/db';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const testEmail = 'profile-auth-integration@example.com';
const testPassword = 'password123';
const testName = 'Profile Auth Integration';
const bcryptHash = '$2a$10$h5w8J1wQb3Q8Q5e4v2v8rOqQvA6eQ0b6eQ0b6eQ0b6eQ0b6eQ0b6e'; // bcrypt for 'password123'

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.user.create({
    data: {
      email: testEmail,
      password: bcryptHash,
      name: testName,
    },
  });
});
afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
});

describe('Authenticated profile page', () => {
  it('shows user info for authenticated user', async () => {
    // Step 1: Login and get session cookie
    const loginRes = await fetch('http://127.0.0.1:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        csrfToken: 'test',
        email: testEmail,
        password: testPassword,
      }).toString(),
      redirect: 'manual',
    });
    const setCookie = loginRes.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    // Step 2: Visit /profile with session cookie
    const profileRes = await fetch('http://127.0.0.1:3000/profile', {
      headers: {
        Cookie: setCookie || '',
      },
    });
    expect(profileRes.status).toBe(200);
    const html = await profileRes.text();
    // Check that the user's email and name appear in the HTML
    expect(html).toContain(testEmail);
    expect(html).toContain(testName);
  });
});
