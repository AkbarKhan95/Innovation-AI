import React from 'react';

const BrainstormIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
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
    <path d="M12 8V4m0 16v-4m8-8h-4m-8 0H4" />
    <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
    <path d="M12 12a6 6 0 00-6 6" />
    <path d="M12 12a6 6 0 016 6" />
    <path d="M12 12a6 6 0 016-6" />
    <path d="M12 12a6 6 0 00-6-6" />
  </svg>
);

export default BrainstormIcon;
