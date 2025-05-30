import './globals.css';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

import SessionProvider from '../components/providers/SessionProvider';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

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
          <div className="app-container">
            <Sidebar />
            <main className="main-content flex-1 flex flex-col">
              <Header />
              <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
