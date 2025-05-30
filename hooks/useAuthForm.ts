import { useState, useCallback, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

type AuthMode = 'login' | 'register';

interface AuthFormValues {
  email: string;
  password: string;
  name?: string;
  rememberMe?: boolean;
}

export function useAuthForm(mode: AuthMode = 'login') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const registered = searchParams.get('registered') === 'true';
  const { update } = useSession();
  
  // Expose setError for external use
  const setAuthError = useCallback((message: string) => {
    setError(message);
  }, []);

  // Show success message if redirected from registration
  useEffect(() => {
    if (registered) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [registered]);

  const validateForm = useCallback((values: AuthFormValues): boolean => {
    if (!values.email || !values.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!values.password || values.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (mode === 'register' && (!values.name || values.name.trim().length < 2)) {
      setError('Please enter your full name');
      return false;
    }

    return true;
  }, [mode]);

  const handleSubmit = useCallback(async (values: AuthFormValues) => {
    // HIPAA-compliance: Log only non-sensitive information
    console.log('Form submission initiated');
    try {
      if (!validateForm(values)) {
        console.log('Form validation failed');
        return false;
      }
    } catch (validationError) {
      console.error('Validation error occurred');
      setError('Please check your form input and try again.');
      return false;
    }

    console.log('Form validation passed, attempting', mode);
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        console.log('Attempting secure authentication...');
        
        try {
          // First, force a cookie cleanup to ensure we don't have stale sessions
          document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name.includes('next-auth')) {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            }
          });
          
          try {
            // HIPAA-compliant: Don't log credentials
            console.log('Attempting authentication with credentials provider...');
            
            // Use redirect: true to let NextAuth handle the redirect properly
            // This will redirect to callbackUrl on success or show the error on failure
            // We don't need to handle the redirect manually anymore
            await signIn('credentials', {
              redirect: true,
              email: values.email,
              password: values.password, // Password never logged
              rememberMe: values.rememberMe ? 'true' : 'false',
              callbackUrl
            });
            
            // This code will only execute if the redirect fails for some reason
            // In normal cases, NextAuth will redirect before we reach this point
            console.log('Authentication process started, waiting for redirect...');
            
            // If we get here, the redirect failed but the signIn didn't throw an error
            // This could happen in test environment where redirects are mocked
            return true;
          } catch (loginError) {
            // This will catch any errors from the signIn process
            console.error('Error during login process:', loginError);
            const errorMessage = loginError instanceof Error ? loginError.message : 'Authentication failed. Please try again.';
            setError(errorMessage);
            return false;
          }
        } catch (loginError) {
          console.error('Error during login process');
          // Generic error message for security - don't expose details
          throw new Error('Authentication process failed. Please try again.');
        }
      } else {
        // Registration flow
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        // Redirect to login with success message
        router.push(`/auth/login?registered=true`);
      }

      return true;
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return false;
    } finally {
      console.log('Finished handleSubmit');
      setIsLoading(false);
    }
  }, [callbackUrl, mode, router, validateForm]);

  return {
    isLoading,
    error,
    showSuccess,
    handleSubmit,
    setError: setAuthError,
  };
}
