import React from 'react';

const FemaleBotIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <circle cx="9" cy="12" r="1.5"/>
        <circle cx="15" cy="12" r="1.5"/>
        <path d="M8 16c.41-1.51 1.83-2.5 3.5-2.5s3.09.99 3.5 2.5H8z"/>
    </svg>
);

export default FemaleBotIcon;
