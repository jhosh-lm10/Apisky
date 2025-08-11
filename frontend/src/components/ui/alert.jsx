// frontend/src/components/ui/alert.jsx
import React from 'react';

export function Alert({ children, variant = 'default', className = '', ...props }) {
  const variantClasses =
    variant === 'destructive'
      ? 'border-red-300 bg-red-50 text-red-700'
      : 'border-gray-200 bg-gray-50 text-gray-800';

  return (
    <div
      role="alert"
      className={`p-4 rounded border ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ children, className = '', ...props }) {
  return (
    <p className={`mt-2 text-sm ${className}`} {...props}>
      {children}
    </p>
  );
}
