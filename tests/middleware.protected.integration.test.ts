import { describe, it, expect } from 'vitest';

const protectedRoutes = [
  '/dashboard',
  '/reports',
  '/correlations',
  '/profile',
  '/settings',
  '/data-sources',
  '/trends',
];

describe('Protected route middleware', () => {
  for (const route of protectedRoutes) {
    it(`redirects unauthenticated user from ${route} to /auth/login`, async () => {
      const res = await fetch(`http://127.0.0.1:3000${route}`, {
        redirect: 'manual',
      });
      // Should be a redirect (302 or 307) to /auth/login
      expect([302, 307]).toContain(res.status);
      const location = res.headers.get('location');
      expect(location).toContain('/auth/login');
    });
  }
});
