import React from 'react';

// PWA Service for managing Progressive Web App functionality
export class PWAService {
  private static instance: PWAService;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline: boolean = true;
  private onlineCallbacks: Array<() => void> = [];
  private offlineCallbacks: Array<() => void> = [];

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeOnlineStatus();
      this.setupNetworkListeners();
    }
  }

  /**
   * Initialize the service worker
   */
  async initializeServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Handle service worker updates
      this.setupServiceWorkerUpdateHandling();

      // Setup message communication
      this.setupServiceWorkerMessaging();

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Check if the app can be installed
   */
  canInstall(): boolean {
    return !!(window as any).beforeinstallprompt;
  }

  /**
   * Prompt user to install the PWA
   */
  async promptInstall(): Promise<boolean> {
    const deferredPrompt = (window as any).beforeinstallprompt;
    
    if (!deferredPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      // Clear the prompt
      (window as any).beforeinstallprompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Check if the app is installed
   */
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Get app installation status
   */
  getInstallationStatus(): {
    canInstall: boolean;
    isInstalled: boolean;
    isStandalone: boolean;
  } {
    return {
      canInstall: this.canInstall(),
      isInstalled: this.isInstalled(),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    };
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Show local notification
   */
  async showNotification(
    title: string, 
    options: NotificationOptions = {}
  ): Promise<void> {
    const permission = await this.requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return;
    }

    if (this.swRegistration) {
      await this.swRegistration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      console.warn('Service Worker not registered');
      return null;
    }

    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      return null;
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as BufferSource,
      });

      console.log('Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Push unsubscription successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  /**
   * Store action for offline sync
   */
  async storeOfflineAction(action: {
    type: string;
    data: any;
    endpoint?: string;
  }): Promise<void> {
    if (!this.swRegistration) {
      console.warn('Service Worker not available for offline storage');
      return;
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'OFFLINE_ACTION',
        payload: action,
      });
    }

    // Also store in localStorage as backup
    const offlineActions = this.getOfflineActionsFromStorage();
    offlineActions.push({
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
    });
    
    localStorage.setItem('offlineActions', JSON.stringify(offlineActions));
  }

  /**
   * Get offline actions from localStorage
   */
  getOfflineActionsFromStorage(): any[] {
    try {
      const actions = localStorage.getItem('offlineActions');
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('Failed to get offline actions:', error);
      return [];
    }
  }

  /**
   * Clear offline actions from localStorage
   */
  clearOfflineActions(): void {
    localStorage.removeItem('offlineActions');
  }

  /**
   * Check online status
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add online status listener
   */
  onOnline(callback: () => void): () => void {
    this.onlineCallbacks.push(callback);
    return () => {
      const index = this.onlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.onlineCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Add offline status listener
   */
  onOffline(callback: () => void): () => void {
    this.offlineCallbacks.push(callback);
    return () => {
      const index = this.offlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.offlineCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update the service worker
   */
  async updateServiceWorker(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      await this.swRegistration.update();
      return true;
    } catch (error) {
      console.error('Service Worker update failed:', error);
      return false;
    }
  }

  /**
   * Skip waiting for service worker update
   */
  skipWaiting(): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING',
      });
    }
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_CLEAR',
      });
    }

    // Also clear localStorage cache data
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('cache_') || key.startsWith('pwa_')
    );
    
    cacheKeys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Get cache usage information
   */
  async getCacheUsage(): Promise<{
    quota: number;
    usage: number;
    available: number;
    percentage: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const available = quota - usage;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { quota, usage, available, percentage };
    }

    return { quota: 0, usage: 0, available: 0, percentage: 0 };
  }

  /**
   * Share content using Web Share API
   */
  async share(data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    if (!('share' in navigator)) {
      console.warn('Web Share API not supported');
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  }

  /**
   * Check if Web Share API can share files
   */
  canShareFiles(): boolean {
    return 'canShare' in navigator && 
           navigator.canShare && 
           navigator.canShare({ files: [] });
  }

  // Private methods

  private initializeOnlineStatus(): void {
    this.isOnline = navigator.onLine;
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onlineCallbacks.forEach(callback => callback());
      console.log('Connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.offlineCallbacks.forEach(callback => callback());
      console.log('Connection lost');
    });
  }

  private setupServiceWorkerUpdateHandling(): void {
    if (!this.swRegistration) return;

    this.swRegistration.addEventListener('updatefound', () => {
      const newWorker = this.swRegistration!.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            this.showUpdateNotification();
          }
        });
      }
    });
  }

  private setupServiceWorkerMessaging(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'CACHE_UPDATED':
          console.log('Cache updated:', payload);
          break;
        case 'OFFLINE_ACTION_STORED':
          console.log('Offline action stored:', payload);
          break;
        default:
          console.log('Unknown message from SW:', type, payload);
      }
    });
  }

  private async showUpdateNotification(): Promise<void> {
    await this.showNotification(
      'App Update Available',
      {
        body: 'A new version of the app is available. Refresh to update.',
        data: { action: 'update' },
        tag: 'app-update',
        requireInteraction: true,
      }
    );
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const pwaService = PWAService.getInstance();

// React hook for PWA functionality
export function usePWA() {
  const [isOnline, setIsOnline] = React.useState(pwaService.isOnlineStatus());
  const [installationStatus, setInstallationStatus] = React.useState(
    pwaService.getInstallationStatus()
  );

  React.useEffect(() => {
    const unsubscribeOnline = pwaService.onOnline(() => setIsOnline(true));
    const unsubscribeOffline = pwaService.onOffline(() => setIsOnline(false));

    // Check for install prompt
    const handleBeforeInstallPrompt = () => {
      setInstallationStatus(pwaService.getInstallationStatus());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return {
    isOnline,
    installationStatus,
    promptInstall: pwaService.promptInstall.bind(pwaService),
    showNotification: pwaService.showNotification.bind(pwaService),
    storeOfflineAction: pwaService.storeOfflineAction.bind(pwaService),
    share: pwaService.share.bind(pwaService),
    canShareFiles: pwaService.canShareFiles(),
  };
}

// TypeScript augmentation for global types
declare global {
  interface Window {
    beforeinstallprompt?: any;
  }

  interface Navigator {
    standalone?: boolean;
  }
}