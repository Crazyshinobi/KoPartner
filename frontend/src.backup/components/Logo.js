import React from 'react';

const Logo = ({ size = 'md', showText = true, onClick }) => {
  const sizes = {
    sm: { circle: 36, k: 18, heart: 10, text: 'text-lg' },
    md: { circle: 48, k: 24, heart: 12, text: 'text-2xl' },
    lg: { circle: 64, k: 32, heart: 16, text: 'text-4xl' }
  };

  const config = sizes[size];

  return (
    <div className="flex items-center space-x-3 cursor-pointer" onClick={onClick}>
      {/* Purple Gradient Circle with K and Heart */}
      <div 
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: config.circle,
          height: config.circle,
          background: 'linear-gradient(to bottom, #a855f7, #7e22ce)',
          boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
        }}
      >
        {/* Letter K in Serif Font */}
        <span 
          className="text-white font-bold"
          style={{ 
            fontSize: config.k,
            fontFamily: 'Georgia, serif',
            position: 'relative',
            zIndex: 2
          }}
        >
          K
        </span>
        
        {/* Heart Symbol SVG */}
        <svg
          className="absolute"
          width={config.heart}
          height={config.heart}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            bottom: config.circle * 0.22,
            right: config.circle * 0.22
          }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      
      {/* KoPartner Text in Serif */}
      {showText && (
        <span 
          className={`${config.text} font-bold text-purple-700`}
          style={{ fontFamily: 'Georgia, serif' }}
        >
          KoPartner
        </span>
      )}
    </div>
  );
};

export default Logo;