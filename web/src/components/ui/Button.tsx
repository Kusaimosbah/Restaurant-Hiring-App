import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-800 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-400 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-800 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-800 text-white focus:ring-green-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 hover:text-gray-900 focus:ring-gray-500',
  };

  const sizes = {
    sm: 'px-3 py-2.5 text-sm min-h-[44px] min-w-[44px]',
    md: 'px-4 py-3 text-sm min-h-[44px] min-w-[80px]',
    lg: 'px-6 py-4 text-base min-h-[48px] min-w-[100px]',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}