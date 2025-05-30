import './globals.css';
import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

import SessionProvider from '../components/providers/SessionProvider';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default async function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  const session = await getServerSession(authOptions);

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
