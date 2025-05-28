import './globals.css';
import { ReactNode } from 'react';

import NextAuthSessionProvider from "./SessionProvider";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <NextAuthSessionProvider>
          <div className="app-container">
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
