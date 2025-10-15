/**
 * Utility functions for handling mobile keyboard visibility
 */

/**
 * Scrolls an element into view when focused, accounting for mobile keyboards
 * @param element - The DOM element to scroll into view
 */
export const scrollIntoViewOnFocus = (element: HTMLElement) => {
  if (!element) return;
  
  // Add event listeners for focus and blur
  element.addEventListener('focus', () => {
    // Use setTimeout to ensure this happens after the keyboard appears
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  });
};

/**
 * Adds keyboard handling to all form elements in a container
 * @param formContainerId - The ID of the form container
 */
export const setupFormKeyboardHandling = (formContainerId: string) => {
  if (typeof window === 'undefined') return; // Skip on server-side
  
  // Wait for DOM to be ready
  setTimeout(() => {
    const formContainer = document.getElementById(formContainerId);
    if (!formContainer) return;
    
    // Find all focusable form elements
    const formElements = formContainer.querySelectorAll(
      'input, select, textarea, button'
    );
    
    // Add scroll handling to each element
    formElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.classList.add('keyboard-visible');
        scrollIntoViewOnFocus(element);
      }
    });
    
    // Add form submission handler to prevent keyboard issues
    const form = formContainer.closest('form');
    if (form) {
      const submitHandler = (e: Event) => {
        // Blur any focused element before submission
        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement) {
          activeElement.blur();
        }
      };
      
      form.addEventListener('submit', submitHandler);
    }
  }, 500);
};

/**
 * Hook to handle virtual keyboard on mobile devices
 * @param formId - The ID of the form element
 */
export const useKeyboardHandling = (formId: string) => {
  if (typeof window !== 'undefined') {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setupFormKeyboardHandling(formId);
    });
  }
  
  return {
    // Return an object with utility functions if needed
    setupFormKeyboardHandling,
    scrollIntoViewOnFocus,
  };
};
