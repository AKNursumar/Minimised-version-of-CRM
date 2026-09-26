import React from 'react';

export const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-gray-500">
      <div
        className={`${sizeClasses[size] || sizeClasses.medium} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      {text && <p className="mt-3 text-sm font-medium text-gray-500">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
