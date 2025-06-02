'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import React from 'react';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <NextAuthSessionProvider
      // Optional: Keep refetch settings if desired, or simplify
      refetchOnWindowFocus={true}
      refetchInterval={5 * 60}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
