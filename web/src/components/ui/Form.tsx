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
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
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
      {title && <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>}
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      <div className="space-y-4">
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
    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
      {children}
    </div>
  );
}
