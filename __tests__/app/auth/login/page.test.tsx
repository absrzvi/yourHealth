import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import LoginPage from '@/app/auth/login/page';

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

// Mock the useAuthForm hook
jest.mock('@/hooks/useAuthForm', () => ({
  useAuthForm: jest.fn(() => ({
    isLoading: false,
    error: '',
    showSuccess: false,
    handleSubmit: jest.fn().mockResolvedValue(true),
    setError: jest.fn(),
  })),
}));

describe('Login Page', () => {
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
    
    mockSignIn.mockResolvedValue({ ok: true });
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
  });

  it('renders the login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when form is submitted empty', async () => {
    const { getByRole, findByText } = render(<LoginPage />);
    
    fireEvent.click(getByRole('button', { name: /sign in/i }));
    
    // The form should show validation errors
    expect(await findByText(/email is required/i)).toBeInTheDocument();
    expect(await findByText(/password is required/i)).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    const { getByLabelText, getByRole } = render(<LoginPage />);
    
    // Fill in the form
    fireEvent.change(getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: 'false',
        callbackUrl: '/dashboard',
        redirect: true,
      });
    });
  });

  it('redirects to dashboard when user is already authenticated', async () => {
    // Mock authenticated session
    mockUseSession.mockReturnValueOnce({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    // Mock window.location.href
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        href: '',
        assign: jest.fn(),
      },
      writable: true,
    });

    render(<LoginPage />);
    
    // Wait for the redirect to happen
    await waitFor(() => {
      expect(window.location.href).toBe('/dashboard');
    });

    // Restore window.location
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});
