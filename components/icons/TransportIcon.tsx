import React from 'react';

const TransportIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
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
    <path d="M16 18h2a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2V5a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v7" />
    <path d="M6 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
    <path d="M6 11h12" />
    <path d="M18 18h-1.5" />
    <path d="M7.5 18H6" />
    <circle cx="15" cy="18" r="2" />
    <circle cx="9" cy="18" r="2" />
  </svg>
);

export default TransportIcon;