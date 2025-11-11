'use client';

import React, { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';

interface MobileAppInitializerProps {
  children: React.ReactNode;
}

export function MobileAppInitializer({ children }: MobileAppInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const {
    registerServiceWorker,
    requestNotificationPermission,
    capabilities,
    isOnline,
    getOfflineActions,
    clearOfflineActions,
  } = usePWA();

  useEffect(() => {
    initializeMobileApp();
  }, []);

  useEffect(() => {
    // Process offline actions when coming back online
    if (isOnline && isInitialized) {
      processOfflineActions();
    }
  }, [isOnline, isInitialized]);

  const initializeMobileApp = async () => {
    try {
      console.log('🚀 Initializing Mobile App...');

      // 1. Register Service Worker
      if (capabilities.hasServiceWorker) {
        const swRegistered = await registerServiceWorker();
        if (swRegistered) {
          console.log('✅ Service Worker registered');
          
          // Listen for service worker updates
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              setShowUpdatePrompt(true);
            });
          }
        }
      }

      // 2. Setup PWA meta tags if not already present
      setupPWAMetaTags();

      // 3. Setup viewport for mobile
      setupMobileViewport();

      // 4. Setup theme color for mobile browsers
      setupThemeColor();

      // 5. Request notification permission (optional)
      if (capabilities.hasNotifications) {
        // Don't request immediately, wait for user interaction
        console.log('📱 Notification capability available');
      }

      // 6. Setup offline indicator
      setupOfflineIndicator();

      // 7. Setup mobile-specific CSS custom properties
      setupMobileCSS();

      setIsInitialized(true);
      console.log('✅ Mobile App initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize mobile app:', error);
      setIsInitialized(true); // Still allow app to load
    }
  };

  const setupPWAMetaTags = () => {
    const head = document.head;

    // Apple-specific meta tags for iOS
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const appleCapable = document.createElement('meta');
      appleCapable.name = 'apple-mobile-web-app-capable';
      appleCapable.content = 'yes';
      head.appendChild(appleCapable);
    }

    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      const appleStatusBar = document.createElement('meta');
      appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
      appleStatusBar.content = 'default';
      head.appendChild(appleStatusBar);
    }

    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const appleTitle = document.createElement('meta');
      appleTitle.name = 'apple-mobile-web-app-title';
      appleTitle.content = 'Restaurant Hiring';
      head.appendChild(appleTitle);
    }

    // Microsoft-specific meta tags
    if (!document.querySelector('meta[name="msapplication-TileColor"]')) {
      const msTileColor = document.createElement('meta');
      msTileColor.name = 'msapplication-TileColor';
      msTileColor.content = '#2563eb';
      head.appendChild(msTileColor);
    }
  };

  const setupMobileViewport = () => {
    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewportMeta) {
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    }
  };

  const setupThemeColor = () => {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = '#2563eb';
  };

  const setupOfflineIndicator = () => {
    // Add custom CSS for offline indicator
    const style = document.createElement('style');
    style.textContent = `
      .offline-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background-color: #ef4444;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .offline-indicator.visible {
        opacity: 1;
      }
      .online-indicator {
        background-color: #10b981;
      }
    `;
    document.head.appendChild(style);
  };

  const setupMobileCSS = () => {
    // Add CSS custom properties for mobile
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
        
        --touch-target-size: 44px;
        --comfortable-touch-size: 48px;
        --large-touch-size: 56px;
        
        --mobile-padding: 1rem;
        --mobile-margin: 1rem;
      }
      
      /* Mobile-specific utility classes */
      .touch-target {
        min-height: var(--touch-target-size);
        min-width: var(--touch-target-size);
      }
      
      .comfortable-touch {
        min-height: var(--comfortable-touch-size);
        min-width: var(--comfortable-touch-size);
      }
      
      .large-touch {
        min-height: var(--large-touch-size);
        min-width: var(--large-touch-size);
      }
      
      .safe-area-top { padding-top: var(--safe-area-inset-top); }
      .safe-area-bottom { padding-bottom: var(--safe-area-inset-bottom); }
      .safe-area-left { padding-left: var(--safe-area-inset-left); }
      .safe-area-right { padding-right: var(--safe-area-inset-right); }
      
      /* Mobile-optimized scrolling */
      .mobile-scroll {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
      
      /* Disable text selection on touch targets */
      .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Active states for better touch feedback */
      .touch-feedback:active {
        transform: scale(0.95);
        transition: transform 0.1s ease;
      }
    `;
    document.head.appendChild(style);
  };

  const processOfflineActions = async () => {
    const offlineActions = getOfflineActions();
    
    if (offlineActions.length === 0) return;

    console.log(`📤 Processing ${offlineActions.length} offline actions...`);

    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        console.log(`✅ Processed offline action: ${action.type}`);
      } catch (error) {
        console.error(`❌ Failed to process offline action: ${action.type}`, error);
      }
    }

    // Clear processed actions
    clearOfflineActions();
    console.log('✅ All offline actions processed');
  };

  const processOfflineAction = async (action: any) => {
    switch (action.type) {
      case 'REFRESH_DASHBOARD':
        window.location.reload();
        break;
        
      case 'LOAD_JOBS':
        // Trigger job reload
        const jobsEvent = new CustomEvent('reload-jobs', { detail: action.data });
        window.dispatchEvent(jobsEvent);
        break;
        
      case 'TOGGLE_JOB_STATUS':
        await fetch(`/api/jobs/${action.data.jobId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: action.data.isActive }),
        });
        break;
        
      case 'DELETE_JOB':
        await fetch(`/api/jobs/${action.data.jobId}`, {
          method: 'DELETE',
        });
        break;
        
      case 'SEND_MESSAGE':
        await fetch(`/api/conversations/${action.data.conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: action.data.content,
            type: 'text',
          }),
        });
        break;
        
      default:
        console.warn(`Unknown offline action type: ${action.type}`);
    }
  };

  const handleAppUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
    setShowUpdatePrompt(false);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing app...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      
      {/* Connection Status Indicator */}
      <div className={`offline-indicator ${!isOnline ? 'visible' : ''}`} />
      
      {/* App Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between">
          <div>
            <p className="font-medium">App Update Available</p>
            <p className="text-sm text-blue-100">Tap to update to the latest version</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowUpdatePrompt(false)}
              className="px-3 py-1 text-sm bg-blue-500 rounded hover:bg-blue-400 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleAppUpdate}
              className="px-3 py-1 text-sm bg-white text-blue-600 rounded hover:bg-gray-100 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Hook to check if app is running in mobile context
export function useMobileContext() {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkMobileContext = () => {
      const userAgent = navigator.userAgent;
      const width = window.innerWidth;
      
      const mobile = width < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
      
      let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
      if (width < 768) type = 'mobile';
      else if (width < 1024) type = 'tablet';
      
      setIsMobile(mobile);
      setIsStandalone(standalone);
      setDeviceType(type);
    };

    checkMobileContext();
    window.addEventListener('resize', checkMobileContext);
    
    return () => window.removeEventListener('resize', checkMobileContext);
  }, []);

  return {
    isMobile,
    isStandalone,
    deviceType,
    isPWA: isStandalone,
  };
}