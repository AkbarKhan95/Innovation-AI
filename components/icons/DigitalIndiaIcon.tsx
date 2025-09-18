import React from 'react';

const DigitalIndiaIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
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
        <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
        <path d="M9 2v4M15 2v4M2 9h4M2 15h4M9 22v-4M15 22v-4M22 9h-4M22 15h-4M9 15h6v6H9zM9 9h6v6H9z"></path>
    </svg>
);

export default DigitalIndiaIcon;
