import React from 'react';

const PaletteIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a7 7 0 1 0 10 10" />
    <path d="M12 22a7 7 0 1 0-10-10" />
    <path d="M2 12A10 10 0 0 0 12 22" />
    <path d="M22 12A10 10 0 0 1 12 2" />
  </svg>
);

export default PaletteIcon;
