import React from 'react';

const NewFemaleIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M12,2A10,10,0,0,0,2,12a9.85,9.85,0,0,0,6.23,9.25,1,1,0,0,0,1.27-.75,1,1,0,0,0-.3-1A7.82,7.82,0,0,1,4,12a8,8,0,0,1,16,0,7.82,7.82,0,0,1-5.2,7.5,1,1,0,0,0-.3,1,1,1,0,0,0,1.27.75A9.85,9.85,0,0,0,22,12,10,10,0,0,0,12,2Z"/>
    </svg>
);
export default NewFemaleIcon;