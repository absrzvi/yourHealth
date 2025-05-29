import React, { useState, useEffect } from 'react';

interface AriaAvatarProps {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulseIntensity?: 'low' | 'medium' | 'high';
}

const AriaAvatar: React.FC<AriaAvatarProps> = ({ 
  isActive = false, 
  size = 'md',
  pulseIntensity = 'medium'
}) => {
  const [rotation, setRotation] = useState(0);
  
  // Size mapping in pixels
  const sizeMap = {
    sm: 40,
    md: 64,
    lg: 80
  };
  
  // Pulse animation intensity
  const pulseSpeed = {
    low: 3000,
    medium: 2000,
    high: 1000
  };
  
  // Rotate animation effect when active
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isActive]);
  
  return (
    <div 
      className="relative rounded-full flex items-center justify-center overflow-hidden transition-all duration-300"
      style={{
        width: `${sizeMap[size]}px`,
        height: `${sizeMap[size]}px`,
        background: 'var(--aria-gradient)',
        boxShadow: isActive ? 'var(--aria-glow)' : 'none'
      }}
      role="img"
      aria-label="Aria AI Health Companion"
    >
      {/* Inner gradient circle */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{ 
          background: 'var(--aria-gradient)',
          opacity: 0.8,
          transform: `rotate(${rotation}deg)`
        }}
      />
      
      {/* Pulsing animation when active */}
      {isActive && (
        <div 
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ 
            background: 'var(--aria-gradient)',
            animationDuration: `${pulseSpeed[pulseIntensity]}ms`
          }}
        />
      )}
      
      {/* Rotating overlay pattern */}
      <div 
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(255,255,255,0.7) 70%)',
          backgroundSize: '5px 5px',
          transform: `rotate(${rotation * -1}deg)`
        }}
      />
      
      {/* Aria core */}
      <div 
        className="absolute rounded-full bg-white/10 backdrop-blur-sm"
        style={{
          width: `${sizeMap[size] * 0.6}px`,
          height: `${sizeMap[size] * 0.6}px`,
          boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)'
        }}
      />
      
      {/* Optional: Reduced motion version for accessibility */}
      <div className="sr-only">
        Aria is {isActive ? 'active and listening' : 'waiting'}
      </div>
    </div>
  );
};

export default AriaAvatar;
