import { renderHook, act } from '@testing-library/react';
import { useAuthForm } from '@/hooks/useAuthForm';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

describe('useAuthForm', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();

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
  });

  it('should handle login form submission', async () => {
    // Mock successful sign in
    (signIn as jest.Mock).mockResolvedValueOnce({ error: null });
    
    const { result } = renderHook(() => useAuthForm('login'));
    
    // Simulate form submission
    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    });
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
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
    // Mock failed sign in
    const errorMessage = 'Invalid credentials';
    (signIn as jest.Mock).mockResolvedValueOnce({ error: errorMessage });
    
    const { result } = renderHook(() => useAuthForm('login'));
    
    // Simulate form submission
    await act(async () => {
      await result.current.handleSubmit({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
    });
    
    expect(result.current.error).toBe(errorMessage);
  });
});
