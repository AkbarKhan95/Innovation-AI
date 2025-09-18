import React from 'react';

const CollapseIcon: React.FC<{ className?: string; isCollapsed: boolean }> = ({ className = 'w-6 h-6', isCollapsed }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-transform duration-300`}
    style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6"/>
    <path d="M9 18l-6-6 6-6"/>
  </svg>
);

export default CollapseIcon;
