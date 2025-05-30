'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Dashboard Layout - Session status:', status);
    console.log('Session data:', session);
    
    if (status === 'unauthenticated') {
      console.log('User not authenticated, redirecting to login');
      router.push('/auth/login');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard...</div>;
  }

  if (!session) {
    return null; // Will be redirected by the effect
  }

  return <>{children}</>;
}
