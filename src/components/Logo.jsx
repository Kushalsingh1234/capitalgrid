import React from 'react';

export default function Logo({ className = '' }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 220 50" 
      className={`logo-svg ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0066ff" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        {/* Filter for Subtle Glow Effects */}
        <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Emblem: Isometric Grid Cube */}
      <g transform="translate(10, 5)">
        {/* Back grid line */}
        <path d="M 20,5 L 35,13 L 20,21 L 5,13 Z" fill="none" stroke="url(#logoBlueGrad)" strokeWidth="1" opacity="0.3" />
        
        {/* Outer isometric shape */}
        <path d="M 20,5 L 35,13 L 35,30 L 20,38 L 5,30 L 5,13 Z" fill="none" stroke="url(#logoBlueGrad)" strokeWidth="2" filter="url(#logoGlow)" />
        
        {/* Inner structural lines (The Grid) */}
        <path d="M 20,5 L 20,38" fill="none" stroke="url(#logoBlueGrad)" strokeWidth="1.5" opacity="0.8" />
        <path d="M 5,13 L 20,21 L 35,13" fill="none" stroke="url(#logoBlueGrad)" strokeWidth="1.5" opacity="0.8" />
        <path d="M 5,30 L 20,21 L 35,30" fill="none" stroke="url(#logoBlueGrad)" strokeWidth="1" opacity="0.5" />
        
        {/* Core glowing dot */}
        <circle cx="20" cy="21" r="3" fill="#0066ff" filter="url(#logoGlow)" />
      </g>
      
      {/* Typography: CapitalGrid */}
      <g transform="translate(52, 34)" style={{ fontFamily: "'Inter', 'Outfit', 'Segoe UI', sans-serif", fontWeight: 800, fontSize: '24px', letterSpacing: '-0.5px' }}>
        <text x="0" y="0">
          <tspan fill="var(--logo-text-color)">Capital</tspan>
          <tspan fill="url(#logoBlueGrad)" filter="url(#logoGlow)">Grid</tspan>
        </text>
      </g>
    </svg>
  );
}
