import React from 'react';

const AddToBoardIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
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
    <path d="M12 17v5" />
    <path d="M5 17h14" />
    <path d="M10 17l-1.12-3.36a2 2 0 0 1 1.01-2.25l6.3-2.1a2 2 0 0 0 1.01-2.25L15 4" />
    <path d="M10 4l5 3" />
    <path d="M14 17l1.12-3.36a2 2 0 0 0-1.01-2.25l-6.3-2.1a2 2 0 0 1-1.01-2.25L9 4" />
  </svg>
);

export default AddToBoardIcon;
