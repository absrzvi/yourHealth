import './globals.css';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from '../components/providers/SessionProvider'; // Use local provider
import LogoutButton from '@/components/auth/LogoutButton';

// Debug log the environment variables
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '***' : 'Not set');

export default async function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const session = await getServerSession(authOptions);
  
  // Debug log the session
  console.log('Root layout - Session:', session ? 'Authenticated' : 'Not authenticated');

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <SessionProvider session={session}>
          <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
            {session && <LogoutButton />}{/* Only show if session exists */}
          </div>
          <div className="app-container full-width">
            <main className="main-content flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
