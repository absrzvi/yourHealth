import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '@/hooks/useAuthForm';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
}));

describe('useAuthForm', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockSignIn = signIn as jest.Mock;
  const mockUseSession = useSession as jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    });
    
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });

    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
  });

  it('should handle login form submission', async () => {
    // Mock successful sign in with a Promise that resolves to { ok: true }
    const mockSignInResult = { ok: true };
    mockSignIn.mockResolvedValueOnce(mockSignInResult);
    
    // Mock the router to track navigation
    const mockRouter = {
      push: jest.fn().mockResolvedValue(undefined),
      refresh: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    const { result } = renderHook(() => useAuthForm('login'));
    
    // Simulate form submission
    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      });
    });
    
    // Verify signIn was called with correct parameters
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: 'false',
      redirect: true,
      callbackUrl: '/dashboard',
    });
    
    // Since we're using redirect: true, we don't expect router.push to be called directly
    // The redirection is handled by NextAuth's client-side routing
    expect(mockRouter.push).not.toHaveBeenCalled();
    
    // Verify loading state was reset
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle registration', async () => {
    // Mock successful registration
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
    
    const { result } = renderHook(() => useAuthForm('register'));
    
    // Simulate form submission
    await act(async () => {
      await result.current.handleSubmit({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    
    expect(mockPush).toHaveBeenCalledWith('/auth/login?registered=true');
  });

  it('should handle errors during login', async () => {
    const errorMessage = 'Invalid credentials';
    
    // Mock failed sign in by rejecting with an error
    mockSignIn.mockRejectedValueOnce(new Error(errorMessage));
    
    // Mock the router
    const mockRouter = {
      push: jest.fn(),
      refresh: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    const { result } = renderHook(() => useAuthForm('login'));
    
    // Initial state should not have error
    expect(result.current.error).toBe('');
    
    // Simulate form submission
    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@example.com',
        password: 'wrongpassword',
        rememberMe: false,
      });
    });
    
    // Verify signIn was called with correct parameters
    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'wrongpassword',
      rememberMe: 'false',
      redirect: true,
      callbackUrl: '/dashboard',
    });
    
    // Verify the error state was set
    expect(result.current.error).toBe(errorMessage);
    
    // Verify no navigation occurred
    expect(mockRouter.push).not.toHaveBeenCalled();
    
    // Verify loading state was reset
    expect(result.current.isLoading).toBe(false);
  });
});
