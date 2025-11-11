'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import NotificationToast, { ToastNotification } from '@/components/NotificationToast';

interface NotificationContextType {
  showToast: (notification: Omit<ToastNotification, 'id'>) => void;
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  enableRealtimeToasts?: boolean;
}

export function NotificationProvider({ 
  children, 
  enableRealtimeToasts = true 
}: NotificationProviderProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { notifications: realtimeNotifications } = useRealtimeNotifications();

  // Convert real-time notifications to toasts
  useEffect(() => {
    if (!enableRealtimeToasts) return;

    const lastNotification = realtimeNotifications[0];
    if (lastNotification && !lastNotification.isRead) {
      // Only show toast for very recent notifications (less than 5 seconds old)
      const notificationAge = Date.now() - new Date(lastNotification.createdAt).getTime();
      if (notificationAge < 5000) {
        showToast({
          type: 'notification',
          title: lastNotification.title,
          message: lastNotification.message,
          duration: 6000,
          action: lastNotification.data?.href ? {
            label: 'View',
            onClick: () => {
              window.location.href = lastNotification.data.href;
            }
          } : undefined
        });
      }
    }
  }, [realtimeNotifications, enableRealtimeToasts]);

  const showToast = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastNotification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration if specified
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, newToast.duration);
    }
  }, []);

  const showSuccess = useCallback((title: string, message: string, duration = 4000) => {
    showToast({ type: 'success', title, message, duration });
  }, [showToast]);

  const showError = useCallback((title: string, message: string, duration = 6000) => {
    showToast({ type: 'error', title, message, duration });
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string, duration = 5000) => {
    showToast({ type: 'warning', title, message, duration });
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string, duration = 4000) => {
    showToast({ type: 'info', title, message, duration });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: NotificationContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    dismissAll
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationToast 
        notifications={toasts} 
        onDismiss={dismissToast} 
      />
    </NotificationContext.Provider>
  );
}