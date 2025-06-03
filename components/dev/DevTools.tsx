'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

/**
 * DevTools component - Only loads in development mode
 * Provides performance testing utilities to help identify rendering,
 * animation bottlenecks, and simulate Lighthouse audits for the application
 */
export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [activeTest, setActiveTest] = useState('');

  useEffect(() => {
    // Attach a global variable to indicate dev tools are available
    if (typeof window !== 'undefined') {
      (window as any).__DEV_TOOLS_ENABLED__ = true;
    }
  }, []);

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const runTest = (testName: string) => {
    if (!isScriptLoaded) {
      console.error('Performance testing tools not loaded yet');
      return;
    }

    setActiveTest(testName);
    
    setTimeout(() => {
      const perfTest = (window as any).performanceTest;
      switch (testName) {
        case 'all':
          perfTest.runAll();
          break;
        case 'layout':
          perfTest.layoutTest();
          break;
        case 'fps':
          perfTest.fpsTest();
          break;
        case 'responsive':
          perfTest.responsiveTest();
          break;
        case 'lighthouse':
          perfTest.lighthouses();
          break;
        case 'performance':
          perfTest.auditPerformance();
          break;
        case 'accessibility':
          perfTest.auditAccessibility();
          break;
        case 'seo':
          perfTest.auditSEO();
          break;
        case 'best-practices':
          perfTest.auditBestPractices();
          break;
      }
      // Reset active test after a delay
      setTimeout(() => setActiveTest(''), 1000);
    }, 100);
  };

  return (
    <>
      <Script 
        src="/js/performance-test.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Performance testing and audit tools loaded successfully');
          setIsScriptLoaded(true);
        }}
      />
      <Script
        src="/js/image-performance-monitor.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Image performance monitoring initialized');
        }}
      />
      <div className="fixed bottom-4 left-4 z-50 transition-all">
        <div className={`bg-black/80 text-white rounded-lg overflow-hidden transition-all ${isOpen ? 'w-64' : 'w-auto'}`}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <h3 className="text-xs font-medium">yourHealth DevTools</h3>
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-xs opacity-70 hover:opacity-100"
              aria-label={isOpen ? "Collapse DevTools" : "Expand DevTools"}
            >
              {isOpen ? '–' : '+'}
            </button>
          </div>
          
          {isOpen && (
            <div className="p-2 space-y-1">
              <p className="text-xs opacity-70 mb-2">Open browser console (F12) to view test results</p>
              
              <div className="space-y-1">
                <h4 className="text-xs font-medium pt-1 pb-1 opacity-70">Performance Tests</h4>
                <div className="grid grid-cols-2 gap-1">
                  <TestButton 
                    label="All Tests" 
                    onClick={() => runTest('all')} 
                    active={activeTest === 'all'}
                    disabled={!isScriptLoaded}
                  />
                  <TestButton 
                    label="Layout" 
                    onClick={() => runTest('layout')} 
                    active={activeTest === 'layout'}
                    disabled={!isScriptLoaded}
                  />
                  <TestButton 
                    label="Frame Rate" 
                    onClick={() => runTest('fps')} 
                    active={activeTest === 'fps'}
                    disabled={!isScriptLoaded}
                  />
                  <TestButton 
                    label="Responsive" 
                    onClick={() => runTest('responsive')} 
                    active={activeTest === 'responsive'}
                    disabled={!isScriptLoaded}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs font-medium pt-1 pb-1 opacity-70">Lighthouse Audit</h4>
                <div className="grid grid-cols-2 gap-1">
                  <TestButton 
                    label="Full Audit" 
                    onClick={() => runTest('lighthouse')} 
                    active={activeTest === 'lighthouse'}
                    disabled={!isScriptLoaded}
                    variant="primary"
                  />
                  <TestButton 
                    label="Performance" 
                    onClick={() => runTest('performance')} 
                    active={activeTest === 'performance'}
                    disabled={!isScriptLoaded}
                  />
                  <TestButton 
                    label="Accessibility" 
                    onClick={() => runTest('accessibility')} 
                    active={activeTest === 'accessibility'}
                    disabled={!isScriptLoaded}
                  />
                  <TestButton 
                    label="SEO" 
                    onClick={() => runTest('seo')} 
                    active={activeTest === 'seo'}
                    disabled={!isScriptLoaded}
                  />
                  <TestButton 
                    label="Best Practices" 
                    onClick={() => runTest('best-practices')} 
                    active={activeTest === 'best-practices'}
                    disabled={!isScriptLoaded}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs font-medium pt-1 pb-1 opacity-70">Image Optimization</h4>
                <div className="grid grid-cols-2 gap-1">
                  <TestButton 
                    label="Scan Images" 
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as any).imageMonitor) {
                        (window as any).imageMonitor.scanNow();
                        console.group('Image Optimization Scan');
                        console.log('Scanning page for unoptimized images...');
                        console.log('Check browser console for detailed results');
                        console.groupEnd();
                      } else {
                        console.error('Image monitor not loaded yet');
                      }
                    }} 
                    active={false}
                    disabled={!isScriptLoaded}
                    variant="primary"
                  />
                </div>
              </div>

              <div className="pt-1 text-[10px] opacity-50 text-center">
                v1.0.0 - Dev Mode Only
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface TestButtonProps {
  label: string;
  onClick: () => void;
  active: boolean;
  disabled: boolean;
  variant?: 'default' | 'primary';
}

function TestButton({ label, onClick, active, disabled, variant = 'default' }: TestButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        text-[10px] py-1 px-2 rounded 
        transition-colors focus:outline-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${active ? 'animate-pulse' : ''}
        ${variant === 'primary' 
          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
          : 'bg-gray-700 hover:bg-gray-600 text-gray-100'}
      `}
    >
      {label}
    </button>
  );
}
