import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center space-x-1.5">
    <div className="w-2 h-2 rounded-full bg-bg-accent animate-wave"></div>
    <div className="w-2 h-2 rounded-full bg-bg-accent animate-wave [animation-delay:-0.2s]"></div>
    <div className="w-2 h-2 rounded-full bg-bg-accent animate-wave [animation-delay:-0.4s]"></div>
  </div>
);

export default LoadingSpinner;