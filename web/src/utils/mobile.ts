// Mobile-first responsive utility classes and functions
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const mobileBreakpoints = {
  xs: '320px',   // Small phones
  sm: '375px',   // Standard phones
  md: '414px',   // Large phones
  lg: '768px',   // Tablets
} as const;

// Touch-friendly sizing
export const touchSizes = {
  minTouch: '44px',      // Minimum touch target size
  comfortableTouch: '48px', // Comfortable touch target
  largeTouch: '56px',    // Large touch target
} as const;

// Mobile spacing system
export const mobileSpacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
} as const;

// Check if device is mobile
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth < 768 || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if device supports touch
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         (navigator as any).msMaxTouchPoints > 0;
};

// Get device type
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  const userAgent = navigator.userAgent;
  
  if (width < 768) {
    if (/iPhone/i.test(userAgent)) return 'iphone';
    if (/Android/i.test(userAgent)) return 'android';
    return 'mobile';
  }
  
  if (width < 1024) {
    if (/iPad/i.test(userAgent)) return 'ipad';
    return 'tablet';
  }
  
  return 'desktop';
};

// Check if device is in landscape mode
export const isLandscape = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

// Get safe area insets (for devices with notches)
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
  };
};

// Mobile-optimized class names
export const mobileClasses = {
  // Touch targets
  touchTarget: 'min-h-[44px] min-w-[44px]',
  comfortableTouch: 'min-h-[48px] min-w-[48px]',
  largeTouch: 'min-h-[56px] min-w-[56px]',
  
  // Typography
  mobileLarge: 'text-lg sm:text-xl',
  mobileBase: 'text-base sm:text-lg',
  mobileSmall: 'text-sm sm:text-base',
  
  // Spacing
  mobileP: 'p-4 sm:p-6',
  mobilePx: 'px-4 sm:px-6',
  mobilePy: 'py-4 sm:py-6',
  mobileM: 'm-4 sm:m-6',
  mobileMx: 'mx-4 sm:mx-6',
  mobileMy: 'my-4 sm:my-6',
  
  // Layout
  mobileContainer: 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto px-4',
  mobileSection: 'py-8 sm:py-12 md:py-16',
  
  // Grid
  mobileGrid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  mobileGridGap: 'gap-4 sm:gap-6 md:gap-8',
  
  // Flex
  mobileFlex: 'flex flex-col sm:flex-row',
  mobileFlexGap: 'space-y-4 sm:space-y-0 sm:space-x-6',
  
  // Buttons
  mobileButton: 'px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 active:scale-95',
  mobileButtonSmall: 'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 active:scale-95',
  mobileButtonLarge: 'px-8 py-4 text-lg font-medium rounded-xl transition-all duration-200 active:scale-95',
  
  // Cards
  mobileCard: 'bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-200 active:scale-[0.98]',
  mobileCardPadding: 'p-4 sm:p-6',
  
  // Forms
  mobileInput: 'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  mobileTextarea: 'w-full px-4 py-3 text-base border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  mobileSelect: 'w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white',
  
  // Navigation
  mobileNav: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50',
  mobileNavItem: 'flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors',
  
  // Modal/Overlay
  mobileModal: 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4',
  mobileModalContent: 'w-full max-w-md bg-white rounded-t-xl sm:rounded-xl shadow-xl transform transition-all',
  
  // Status bar and safe areas
  safeAreaTop: 'pt-[env(safe-area-inset-top)]',
  safeAreaBottom: 'pb-[env(safe-area-inset-bottom)]',
  safeAreaLeft: 'pl-[env(safe-area-inset-left)]',
  safeAreaRight: 'pr-[env(safe-area-inset-right)]',
  safeArea: 'pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
};

// Gesture detection utilities
export const gestureUtils = {
  // Swipe detection
  detectSwipe: (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    threshold: number = 50
  ) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX < threshold && absDeltaY < threshold) return null;
    
    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  },
  
  // Distance calculation
  getDistance: (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },
  
  // Pinch/zoom detection
  getScale: (
    touch1Start: { x: number; y: number },
    touch2Start: { x: number; y: number },
    touch1End: { x: number; y: number },
    touch2End: { x: number; y: number }
  ) => {
    const startDistance = gestureUtils.getDistance(
      touch1Start.x, touch1Start.y,
      touch2Start.x, touch2Start.y
    );
    const endDistance = gestureUtils.getDistance(
      touch1End.x, touch1End.y,
      touch2End.x, touch2End.y
    );
    
    return endDistance / startDistance;
  },
};

// Performance optimization for mobile
export const mobilePerformance = {
  // Debounce function for touch events
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  
  // Throttle function for scroll events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Passive event listener options
  passiveEventOptions: { passive: true } as AddEventListenerOptions,
  
  // Intersection observer for lazy loading
  createIntersectionObserver: (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ) => {
    if ('IntersectionObserver' in window) {
      return new IntersectionObserver(callback, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      });
    }
    return null;
  },
};

// Mobile accessibility helpers
export const mobileA11y = {
  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  },
  
  // Focus management
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();
    
    return () => element.removeEventListener('keydown', handleKeyDown);
  },
  
  // High contrast mode detection
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  // Reduced motion detection
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
};

// Export everything as default for easy import
export default {
  breakpoints,
  mobileBreakpoints,
  touchSizes,
  mobileSpacing,
  isMobile,
  isTouchDevice,
  getDeviceType,
  isLandscape,
  getSafeAreaInsets,
  mobileClasses,
  gestureUtils,
  mobilePerformance,
  mobileA11y,
};