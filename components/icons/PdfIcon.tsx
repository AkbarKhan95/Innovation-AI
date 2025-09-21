import React from 'react';

const PdfIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M8.5 15.5V18h1.5a1.5 1.5 0 0 0 0-3H8.5z"></path>
        <path d="M12.5 18v-6h1.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-1.5z"></path>
        <path d="M17.5 12h-1.5v6h1.5"></path>
    </svg>
);

export default PdfIcon;
