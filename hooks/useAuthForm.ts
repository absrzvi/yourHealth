import { useState, useCallback, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

type AuthMode = 'login' | 'register';

interface AuthFormValues {
  email: string;
  password: string;
  name?: string;
}

export function useAuthForm(mode: AuthMode = 'login') {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const registered = searchParams.get('registered') === 'true';

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
    if (!validateForm(values)) return false;

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const result = await signIn('credentials', {
          redirect: false,
          email: values.email,
          password: values.password,
          callbackUrl,
        });

        if (result?.error) {
          throw new Error('Invalid email or password');
        }

        router.push(callbackUrl);
        router.refresh();
      } else {
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
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [callbackUrl, mode, router, validateForm]);

  return {
    isLoading,
    error,
    showSuccess,
    handleSubmit,
  };
}
