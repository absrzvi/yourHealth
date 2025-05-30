import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Add global TextEncoder and TextDecoder which are required by some dependencies
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof TextDecoder;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: jest.fn(),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn().mockResolvedValue({ ok: true }),
  signOut: jest.fn().mockResolvedValue({ ok: true }),
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  getSession: jest.fn().mockResolvedValue(null),
  getProviders: jest.fn().mockResolvedValue({}),
}));

// Mock next/head for testing
jest.mock('next/head', () => {
  const React = require('react');
  return function Head({ children }: { children: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children);
  };
});

// Mock next/link for testing
jest.mock('next/link', () => {
  const React = require('react');
  return function MockLink({ children, href, ...props }: any) {
    return React.createElement('a', { ...props, href }, children);
  };
});
