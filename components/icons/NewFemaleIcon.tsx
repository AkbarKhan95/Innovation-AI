import React from 'react';

const NewFemaleIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12,4A4,4 0 0,1 16,8C16,9.93 14.49,11.57 12.62,11.93C15.2,12.55 17.1,14.54 17.5,17.21L17.57,17.89C17.65,18.44 17.23,19 16.68,19H7.32C6.77,19 6.35,18.44 6.43,17.89L6.5,17.21C6.9,14.54 8.8,12.55 11.38,11.93C9.51,11.57 8,9.93 8,8A4,4 0 0,1 12,4Z" />
    </svg>
);
export default NewFemaleIcon;
