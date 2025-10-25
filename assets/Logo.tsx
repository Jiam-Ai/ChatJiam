
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    viewBox="0 0 100 30" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Jiam Logo"
  >
    <text 
      x="50%" 
      y="50%" 
      dominantBaseline="middle" 
      textAnchor="middle"
      fontFamily="Times New Roman, Times, serif" 
      fontSize="24" 
      fontWeight="700"
      letterSpacing="1"
    >
      Jiam
    </text>
  </svg>
);

export default Logo;