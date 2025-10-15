'use client';

import { useState, useEffect, ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  htmlFor?: string;
}

export function FormField({
  label,
  children,
  error,
  required = false,
  className = '',
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={`form-field-mobile ${className}`}>
      <label 
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-2 text-sm text-red-600 form-error">{error}</p>
      )}
    </div>
  );
}

interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className = '' }: FormRowProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div className={`${isMobile ? 'block' : 'flex space-x-4'} ${className}`}>
      {children}
    </div>
  );
}

interface FormColumnProps {
  children: ReactNode;
  className?: string;
  width?: 'full' | '1/2' | '1/3' | '2/3';
}

export function FormColumn({
  children,
  className = '',
  width = 'full',
}: FormColumnProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const widthClasses = {
    'full': 'w-full',
    '1/2': isMobile ? 'w-full' : 'w-1/2',
    '1/3': isMobile ? 'w-full' : 'w-1/3',
    '2/3': isMobile ? 'w-full' : 'w-2/3',
  };

  return (
    <div className={`${widthClasses[width]} ${isMobile ? 'mb-4' : ''} ${className}`}>
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: ReactNode;
  className?: string;
  stickyOnMobile?: boolean;
}

export function FormActions({
  children,
  className = '',
  stickyOnMobile = true,
}: FormActionsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div className={`
      mt-6 
      ${isMobile && stickyOnMobile ? 'mobile-actions' : 'flex justify-end space-x-3'} 
      ${className}
    `}>
      {children}
    </div>
  );
}

interface ResponsiveInputProps {
  type?: string;
  id?: string;
  name?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoComplete?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  pattern?: string;
}

export function ResponsiveInput({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  autoComplete,
  min,
  max,
  step,
  pattern,
}: ResponsiveInputProps) {
  return (
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      min={min}
      max={max}
      step={step}
      pattern={pattern}
      className={`
        block w-full rounded-md border-gray-300 shadow-sm 
        focus:border-indigo-500 focus:ring-indigo-500
        keyboard-visible
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        ${className}
      `}
    />
  );
}

interface ResponsiveSelectProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function ResponsiveSelect({
  id,
  name,
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  children,
}: ResponsiveSelectProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`
        block w-full rounded-md border-gray-300 shadow-sm 
        focus:border-indigo-500 focus:ring-indigo-500
        keyboard-visible
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {children}
    </select>
  );
}

interface ResponsiveTextareaProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export function ResponsiveTextarea({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  rows = 4,
}: ResponsiveTextareaProps) {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={rows}
      className={`
        block w-full rounded-md border-gray-300 shadow-sm 
        focus:border-indigo-500 focus:ring-indigo-500
        keyboard-visible
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        ${className}
      `}
    />
  );
}

interface ResponsiveCheckboxProps {
  id?: string;
  name?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function ResponsiveCheckbox({
  id,
  name,
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: ResponsiveCheckboxProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="touch-target flex items-center justify-center">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
      </div>
      <label
        htmlFor={id}
        className="ml-2 block text-sm font-medium text-gray-700 touch-target"
      >
        {label}
      </label>
    </div>
  );
}

export function FormSection({ 
  title, 
  description, 
  children,
  className = ''
}: { 
  title: string; 
  description?: string; 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`form-section mb-8 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}
