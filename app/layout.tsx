import './globals.css';
import { ReactNode } from 'react';

import NextAuthSessionProvider from "./SessionProvider";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full w-full overflow-hidden">
      <body className="bg-gray-50 h-full w-full overflow-hidden">
        <NextAuthSessionProvider>
          <div className="app-container flex h-full w-full">
            <Sidebar />
            <main className="main-content flex-1 flex flex-col">
              <Header />
              <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
            </main>
          </div>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
