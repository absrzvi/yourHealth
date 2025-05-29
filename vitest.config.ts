import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'components/**/*.test.tsx'], // Include UI/UX component tests
    // setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
