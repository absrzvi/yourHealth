import { describe, it, expect } from 'vitest';
import { RegisterSchema, LoginSchema } from '../lib/validation/auth.schema';

// These are pure validation tests. For API route tests, use supertest or similar in future.
describe('RegisterSchema', () => {
  it('accepts valid input', () => {
    const valid = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const invalid = RegisterSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      name: 'Test User',
    });
    expect(invalid.success).toBe(false);
  });

  it('rejects short password', () => {
    const invalid = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: '123',
      name: 'Test User',
    });
    expect(invalid.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('accepts valid input', () => {
    const valid = LoginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const invalid = LoginSchema.safeParse({
      email: 'bad',
      password: 'password123',
    });
    expect(invalid.success).toBe(false);
  });
});
