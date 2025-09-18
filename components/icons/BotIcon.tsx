import React from 'react';

const BotIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className={className}
  >
    {/* Main brain shape and connectors */}
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* Brain outline */}
      <path d="M24,40.5 C15,40.5 10,35 10,24 C10,13 15,7.5 24,7.5" />
      
      {/* Brain internal lines */}
      <path d="M24,7.5 C20,13 18,15 16,20" />
      <path d="M16,20 C14,25 15,28 17,32" />
      <path d="M24,40.5 C20,35 19,33 17,32" />
      <path d="M16,20 C19,22 21,24 24,24" />
      <path d="M17,32 C19,29 21,27 24,24" />
      
      {/* Connectors */}
      <path d="M24 14 L 32 14" />
      <path d="M24 24 L 32 24" />
      <path d="M24 34 L 32 34" />
    </g>
    
    {/* Circles */}
    <circle cx="38" cy="14" r="4.5" fill="#FBBF24" stroke="none" />
    <circle cx="38" cy="24" r="4.5" fill="white" stroke="currentColor" strokeWidth="2" />
    <circle cx="38" cy="34" r="4.5" fill="#16A34A" stroke="none" />
  </svg>
);

export default BotIcon;
