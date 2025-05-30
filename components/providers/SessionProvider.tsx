'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function SessionProvider({ children, session }: SessionProviderProps) {
  const pathname = usePathname();

  // Debug logging
  useEffect(() => {
    console.log('SessionProvider - Current path:', pathname);
    console.log('SessionProvider - Session:', session);
  }, [pathname, session]);

  return (
    <NextAuthSessionProvider 
      session={session}
      // Force refresh the session when the page is focused
      refetchOnWindowFocus={true}
      // Refetch the session every 5 minutes when the window is focused
      refetchInterval={5 * 60}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
