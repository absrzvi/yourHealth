import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import RegisterPage from '@/app/auth/register/page';

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
const mockHandleSubmit = jest.fn();
jest.mock('@/hooks/useAuthForm', () => ({
  __esModule: true,
  useAuthForm: () => ({
    isLoading: false,
    error: null,
    showSuccess: false,
    handleSubmit: mockHandleSubmit,
    setError: jest.fn(),
  }),
}));

describe('Register Page', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockSignIn = signIn as jest.Mock;

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

  it('renders the registration form', () => {
    render(<RegisterPage />);
    
    // Check for form fields and submit button
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors when form is submitted empty', async () => {
    render(<RegisterPage />);
    
    // Get the button and form elements
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Submit the form without filling any fields
    fireEvent.click(submitButton);
    
    // Native form validation should prevent submission
    expect(mockHandleSubmit).not.toHaveBeenCalled();
  });

  it('submits the form with valid data', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    });
    
    render(<RegisterPage />);
    
    // Fill in the form fields
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const termsCheckbox = screen.getByRole('checkbox');
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(termsCheckbox);
    
    // Since we're using JSdom, we need to trigger submit manually on the form
    const form = screen.getByLabelText(/full name/i).closest('form');
    fireEvent.submit(form!);
    
    // Check that handleSubmit was called with the correct values
    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
      );
    });
  });
});
