import React, { useState } from 'react';
import Sidebar from '../components/navigation/Sidebar';
import MobileNav from '../components/navigation/MobileNav';
import AriaChat from '../components/aria/AriaChat';
import HealthPanel from '../components/health/HealthPanel';
import PrivacyOverlay from '../components/security/PrivacyOverlay';

interface AIFirstLayoutProps {
  children?: React.ReactNode;
}

const AIFirstLayout: React.FC<AIFirstLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileHealthPanelOpen, setIsMobileHealthPanelOpen] = useState(false);
  
  // Handle privacy timeout unlock
  const handlePrivacyUnlock = () => {
    console.log('Session unlocked');
    // Additional security measures would be implemented here
    // Such as re-authentication or session validation
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HIPAA-compliant privacy overlay */}
      <PrivacyOverlay onUnlock={handlePrivacyUnlock} timeoutMinutes={5} />
      
      {/* Desktop layout */}
      <div className="hidden lg:flex h-screen">
        {/* Sidebar navigation - 15% */}
        <div className="w-60">
          <Sidebar />
        </div>
        
        {/* Main content area - 85% */}
        <div className="flex-1 flex">
          {/* Aria chat area - 70% of remaining space */}
          <div className="flex-1">
            <AriaChat />
          </div>
          
          {/* Health panel - 30% of remaining space */}
          <div className="w-[30%] h-full">
            <HealthPanel />
          </div>
        </div>
      </div>
      
      {/* Mobile layout */}
      <div className="lg:hidden h-screen flex flex-col">
        {/* Mobile navigation */}
        <MobileNav>
          {/* Full-screen chat */}
          <div className="flex-1 h-[calc(100vh-112px)]">
            <AriaChat />
          </div>
          
          {/* Mobile slide-up health panel */}
          <div 
            className={`fixed bottom-0 left-0 right-0 bg-white z-10 transition-transform duration-300 ease-in-out ${
              isMobileHealthPanelOpen 
                ? 'transform translate-y-0' 
                : 'transform translate-y-[calc(100%-40px)]'
            }`}
            style={{ 
              maxHeight: 'calc(80vh)',
              height: 'auto'
            }}
          >
            <div 
              className="h-10 flex items-center justify-center"
              onClick={() => setIsMobileHealthPanelOpen(!isMobileHealthPanelOpen)}
            >
              <div className="w-10 h-1 rounded-full bg-gray-300"></div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 40px)' }}>
              <HealthPanel isMobile={true} />
            </div>
          </div>
        </MobileNav>
      </div>
    </div>
  );
};

export default AIFirstLayout;
