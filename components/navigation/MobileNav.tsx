import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

interface MobileNavProps {
  children: React.ReactNode;
}

const MobileNav: React.FC<MobileNavProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, []);
  
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-10 shadow-sm px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-full" style={{ background: 'var(--aria-gradient)' }}></div>
          <span className="font-semibold">For Your Health</span>
        </div>
        <div className="w-10"></div> {/* Empty div for balance */}
      </header>
      
      {/* Mobile Sidebar */}
      <div 
        className={`fixed inset-0 bg-gray-900/50 z-30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-end p-4">
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-gray-300 hover:bg-gray-700"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <Sidebar />
      </div>
      
      {/* Content with padding for mobile header */}
      <div className="pt-14">
        {children}
      </div>
    </div>
  );
};

export default MobileNav;
