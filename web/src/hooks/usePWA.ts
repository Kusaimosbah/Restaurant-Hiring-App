'use client';

import { useState, useEffect } from 'react';

// Types for PWA functionality
export interface PWAInstallationStatus {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
}

export interface OfflineAction {
  type: string;
  data: any;
  timestamp: number;
}

export interface PWACapabilities {
  hasServiceWorker: boolean;
  hasNotifications: boolean;
  hasWebShare: boolean;
  hasInstallPrompt: boolean;
  hasOfflineStorage: boolean;
}

// PWA Hook
export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [installationStatus, setInstallationStatus] = useState<PWAInstallationStatus>({
    canInstall: false,
    isInstalled: false,
    isStandalone: false,
  });
  const [capabilities, setCapabilities] = useState<PWACapabilities>({
    hasServiceWorker: false,
    hasNotifications: false,
    hasWebShare: false,
    hasInstallPrompt: false,
    hasOfflineStorage: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check PWA capabilities
    checkCapabilities();

    // Check installation status
    checkInstallationStatus();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallationStatus(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is installed
    const handleAppInstalled = () => {
      setInstallationStatus(prev => ({ ...prev, isInstalled: true, canInstall: false }));
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const checkCapabilities = () => {
    const caps: PWACapabilities = {
      hasServiceWorker: 'serviceWorker' in navigator,
      hasNotifications: 'Notification' in window,
      hasWebShare: 'share' in navigator,
      hasInstallPrompt: 'BeforeInstallPromptEvent' in window,
      hasOfflineStorage: 'indexedDB' in window,
    };
    setCapabilities(caps);
  };

  const checkInstallationStatus = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    setInstallationStatus(prev => ({ 
      ...prev, 
      isStandalone,
      isInstalled: isStandalone 
    }));
  };

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        setInstallationStatus(prev => ({ ...prev, canInstall: false }));
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    if (!capabilities.hasNotifications) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    if (!capabilities.hasNotifications || Notification.permission !== 'granted') {
      return false;
    }

    try {
      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  const storeOfflineAction = (action: OfflineAction) => {
    if (!capabilities.hasOfflineStorage) return;

    try {
      const actions = getOfflineActions();
      actions.push(action);
      localStorage.setItem('pwa-offline-actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Error storing offline action:', error);
    }
  };

  const getOfflineActions = (): OfflineAction[] => {
    try {
      const stored = localStorage.getItem('pwa-offline-actions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  };

  const clearOfflineActions = () => {
    try {
      localStorage.removeItem('pwa-offline-actions');
    } catch (error) {
      console.error('Error clearing offline actions:', error);
    }
  };

  const share = async (data: ShareData) => {
    if (!capabilities.hasWebShare) return false;

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  };

  const canShareFiles = () => {
    return capabilities.hasWebShare && 'canShare' in navigator;
  };

  const registerServiceWorker = async () => {
    if (!capabilities.hasServiceWorker) return false;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  };

  const updateServiceWorker = async () => {
    if (!capabilities.hasServiceWorker) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return true;
    } catch (error) {
      console.error('Service Worker update failed:', error);
      return false;
    }
  };

  const getNetworkStatus = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  };

  const getBatteryStatus = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          charging: battery.charging,
          level: battery.level,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        };
      } catch (error) {
        console.error('Error getting battery status:', error);
      }
    }
    return null;
  };

  return {
    // Status
    isOnline,
    installationStatus,
    capabilities,

    // Installation
    promptInstall,

    // Notifications  
    requestNotificationPermission,
    showNotification,

    // Offline Actions
    storeOfflineAction,
    getOfflineActions,
    clearOfflineActions,

    // Sharing
    share,
    canShareFiles: canShareFiles(),

    // Service Worker
    registerServiceWorker,
    updateServiceWorker,

    // Device Info
    getNetworkStatus,
    getBatteryStatus,
  };
}

// Additional utility hooks
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    updateOnlineStatus();
    updateConnectionType();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateConnectionType);
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);

  return { isOnline, connectionType };
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  return { canInstall, promptInstall };
}

export function useOfflineActions() {
  const [actions, setActions] = useState<OfflineAction[]>([]);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = () => {
    try {
      const stored = localStorage.getItem('pwa-offline-actions');
      setActions(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Error loading offline actions:', error);
      setActions([]);
    }
  };

  const addAction = (action: OfflineAction) => {
    try {
      const newActions = [...actions, action];
      setActions(newActions);
      localStorage.setItem('pwa-offline-actions', JSON.stringify(newActions));
    } catch (error) {
      console.error('Error adding offline action:', error);
    }
  };

  const removeAction = (timestamp: number) => {
    try {
      const newActions = actions.filter(action => action.timestamp !== timestamp);
      setActions(newActions);
      localStorage.setItem('pwa-offline-actions', JSON.stringify(newActions));
    } catch (error) {
      console.error('Error removing offline action:', error);
    }
  };

  const clearActions = () => {
    try {
      setActions([]);
      localStorage.removeItem('pwa-offline-actions');
    } catch (error) {
      console.error('Error clearing offline actions:', error);
    }
  };

  return { actions, addAction, removeAction, clearActions, loadActions };
}