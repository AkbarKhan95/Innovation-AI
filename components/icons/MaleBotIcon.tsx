import React from 'react';

const MaleBotIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M4 2h16c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm2 4v12h12V6H6zm3 3h2v2H9V9zm4 0h2v2h-2V9zm-4 4h6v2H9v-2z"/>
    </svg>
);

export default MaleBotIcon;
