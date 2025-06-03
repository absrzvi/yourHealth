'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold font-montserrat bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              For Your Health
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link href="/" className="text-sm lg:text-base font-medium text-neutral-700 hover:text-primary transition-colors duration-200">
              Home
            </Link>
            <Link href="/approach" className="text-sm lg:text-base font-medium text-neutral-700 hover:text-primary transition-colors duration-200">
              Our Approach
            </Link>
            <Link href="/products" className="text-sm lg:text-base font-medium text-neutral-700 hover:text-primary transition-colors duration-200">
              Products
            </Link>
            <Link 
              href="/providers" 
              className="text-sm lg:text-base font-medium text-neutral-700 hover:text-primary transition-colors duration-200"
            >
              AI Coach
            </Link>
            <Link href="/blog" className="text-sm lg:text-base font-medium text-neutral-700 hover:text-primary transition-colors duration-200">
              Resources
            </Link>
            
            {status === 'authenticated' ? (
              <>
                <Link href="/ocr-test.html" className="text-neutral-700 hover:text-primary transition">
                  Data Sources
                </Link>
                <Link href="/blood-reports" className="text-neutral-700 hover:text-primary transition">
                  Blood Reports
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-primary">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => signOut()}
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-secondary hover:bg-secondary-dark text-white rounded-full px-6 font-semibold">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-neutral-700 hover:text-primary"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-neutral-700 hover:text-primary">
              Home
            </Link>
            <Link href="/approach" className="block px-3 py-2 text-neutral-700 hover:text-primary">
              Our Approach
            </Link>
            <Link href="/products" className="block px-3 py-2 text-neutral-700 hover:text-primary">
              Products
            </Link>
            <Link href="/providers" className="block px-3 py-2 text-neutral-600 hover:text-primary text-sm">
              For Providers
            </Link>
            <Link href="/blog" className="block px-3 py-2 text-neutral-700 hover:text-primary">
              Resources
            </Link>
            {status === 'authenticated' ? (
              <>
                <Link href="/ocr-test.html" className="block px-3 py-2 text-neutral-700 hover:text-primary">
                  Data Sources
                </Link>
                <Link href="/blood-reports" className="block px-3 py-2 text-neutral-700 hover:text-primary">
                  Blood Reports
                </Link>
                <Link href="/blood-reports/upload" className="block px-3 py-2 text-neutral-700 hover:text-primary">
                  Upload Blood Report
                </Link>
                <Link href="/dashboard" className="block px-3 py-2 text-primary font-semibold">
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="block w-full text-left px-3 py-2 text-neutral-700 hover:text-primary"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block px-3 py-2 text-neutral-700 hover:text-primary">
                  Login
                </Link>
                <Link href="/register" className="block px-3 py-2 text-secondary font-semibold">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
