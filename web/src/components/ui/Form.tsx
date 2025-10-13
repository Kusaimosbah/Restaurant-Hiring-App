'use client';

import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}

export function Form({ children, onSubmit, ...props }: FormProps) {
  return (
    <form onSubmit={onSubmit} {...props}>
      {children}
    </form>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  label: string;
  htmlFor: string;
  error?: string;
  description?: string;
}

export function FormField({ children, label, htmlFor, error, description }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-800 mb-1 flex items-center">
        {label}
      </label>
      <div className={`transition-all duration-200 ${error ? 'animate-shake' : ''}`}>
        {children}
      </div>
      {description && (
        <p className="mt-1 text-sm text-gray-600 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {description}
        </p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

interface FormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function FormSection({ children, title, description }: FormSectionProps) {
  return (
    <div className="mb-8">
      {title && (
        <div className="flex items-center mb-2">
          <div className="h-5 w-1 bg-indigo-500 rounded-full mr-2"></div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      {description && <p className="text-gray-700 mb-4 ml-3">{description}</p>}
      <div className="space-y-4 mt-4">
        {children}
      </div>
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
}

export function FormActions({ children }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
      {children}
    </div>
  );
}
