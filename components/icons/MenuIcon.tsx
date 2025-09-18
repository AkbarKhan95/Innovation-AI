import React from 'react';

const MenuIcon: React.FC<{ className?: string; isOpen: boolean }> = ({ className = 'w-6 h-6', isOpen }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} transition-transform duration-[400ms] ease-in-out`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export default MenuIcon;