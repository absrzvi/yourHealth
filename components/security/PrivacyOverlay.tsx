import React, { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';

interface PrivacyOverlayProps {
  timeoutMinutes?: number;
  onUnlock: () => void;
  /**
   * testVisible is for test-only use. If true, the overlay is always visible (bypasses timer logic).
   * This is important for HIPAA compliance to ensure the lock screen is always verifiable in tests.
   */
  testVisible?: boolean;
}

const PrivacyOverlay: React.FC<PrivacyOverlayProps> = ({
  timeoutMinutes = 5,
  onUnlock,
  testVisible = false
}) => {
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setVisible(true);
      }, timeoutMinutes * 60 * 1000);
    };
    
    // Reset timer on user activity
    const handleActivity = () => {
      if (!visible) {
        resetTimer();
      }
    };
    
    // Set up event listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    // Start initial timer
    resetTimer();
    
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [timeoutMinutes, visible]);
  
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would validate against the user's session
    if (password) {
      setVisible(false);
      setPassword('');
      setError('');
      onUnlock();
    } else {
      setError('Please enter your password');
    }
  };
  
  if (!visible && !testVisible) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--timeout-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 animate-fade-in">
        <div className="text-center mb-6">
          <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
          <h2 id="privacy-title" className="text-xl font-semibold text-gray-800 mb-2">Session Protected</h2>
          <p className="text-gray-600 mb-2">Your health data is secure.</p>
          <p className="text-xs text-gray-500">
            For your privacy and HIPAA compliance, this session has been locked after {timeoutMinutes} minutes of inactivity.
          </p>
        </div>
        
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Enter password to unlock
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pl-10"
                placeholder="Your password"
                autoFocus
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? "password-error" : undefined}
              />
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {error && (
              <p id="password-error" className="mt-1 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ background: 'var(--aria-gradient)' }}
          >
            Unlock Session
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            If you need assistance, please contact your administrator.
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default PrivacyOverlay;
