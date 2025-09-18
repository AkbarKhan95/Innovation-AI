import React from 'react';

const SparklesIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M9.9 2.05L11 0l1.1 2.05L14 3l-1.9 1.45L11 6.5 9.9 4.45 8 3l2-1.45L9.9 2.05zM20 10l-2-1.5-2 1.5.5-2.5-2-1.5h2.5L18 5l1 2.5h2.5l-2 1.5.5 2.5zM8 16l-1.9 1.45L7.6 15H5l2-1.5-1.5-2.5L7 12.5l1.5-2.5L7 15h2.6l-1.5 2.5L10 16z" />
    </svg>
);

export default SparklesIcon;