import React from 'react';

interface AriaTypingIndicatorProps {
  visible: boolean;
}

const AriaTypingIndicator: React.FC<AriaTypingIndicatorProps> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <div 
      className="flex items-center space-x-1 py-1 px-2 rounded-full bg-white/10 backdrop-blur-sm"
      aria-label="Aria is thinking"
      role="status"
    >
      <div className="sr-only">Aria is thinking</div>
      {[1, 2, 3].map((dot) => (
        <div 
          key={dot}
          className="h-2 w-2 rounded-full bg-white"
          style={{
            animation: `typingAnimation 1.4s infinite ease-in-out both`,
            animationDelay: `${(dot - 1) * 0.2}s`
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes typingAnimation {
          0%, 80%, 100% { 
            transform: scale(0.4);
            opacity: 0.4;
          }
          40% { 
            transform: scale(1.0);
            opacity: 1.0;
          }
        }
      `}</style>
    </div>
  );
};

export default AriaTypingIndicator;
