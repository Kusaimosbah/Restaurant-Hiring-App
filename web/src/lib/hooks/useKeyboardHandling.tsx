'use client';

import { useEffect, useRef } from 'react';
import { setupFormKeyboardHandling } from '../utils/keyboardHandling';

/**
 * React hook to handle mobile keyboard visibility in forms
 * @param formId - Optional ID for the form. If not provided, a random ID will be generated.
 * @returns An object with the formId and ref to attach to the form container
 */
export function useKeyboardHandling(formId?: string) {
  const generatedId = useRef(`form-${Math.random().toString(36).substring(2, 9)}`);
  const id = formId || generatedId.current;
  const formRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupFormKeyboardHandling(id);
    }
  }, [id]);
  
  return {
    formId: id,
    formRef,
  };
}

export default useKeyboardHandling;
