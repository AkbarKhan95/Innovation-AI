import React from 'react';

const VisualizeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
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
    <path d="M12 3v2" />
    <path d="M5.22 8.22l-1.42 1.42" />
    <path d="M18.78 8.22l1.42 1.42" />
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    <path d="M12 12v4a2 2 0 0 0 2 2h2" />
  </svg>
);

export default VisualizeIcon;
