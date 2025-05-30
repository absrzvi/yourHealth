// Import testing library matchers
import '@testing-library/jest-dom';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: mockPrefetch,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
  usePathname: jest.fn(() => '/'),
  useParams: () => ({}),
}));

// Mock next-auth/react
const mockSignIn = jest.fn().mockResolvedValue({ ok: true });
const mockSignOut = jest.fn().mockResolvedValue({ ok: true });
const mockUpdate = jest.fn();

jest.mock('next-auth/react', () => ({
  signIn: mockSignIn,
  signOut: mockSignOut,
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: mockUpdate,
  })),
  getSession: jest.fn().mockResolvedValue(null),
  getProviders: jest.fn().mockResolvedValue({}),
}));

// Mock next/head
jest.mock('next/head', () => {
  const React = require('react');
  return function Head(props) {
    return React.createElement(React.Fragment, null, props.children);
  };
});

// Mock next/link
jest.mock('next/link', () => {
  const React = require('react');
  return function MockLink(props) {
    return React.createElement('a', { ...props, href: props.href }, props.children);
  };
});

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

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset mock implementations
  mockPush.mockReset();
  mockReplace.mockReset();
  mockPrefetch.mockReset();
  mockGet.mockReset();
  mockSignIn.mockReset().mockResolvedValue({ ok: true });
  mockSignOut.mockReset().mockResolvedValue({ ok: true });
  mockUpdate.mockReset();
});

afterAll(() => {
  // Cleanup after all tests
  jest.restoreAllMocks();
});
