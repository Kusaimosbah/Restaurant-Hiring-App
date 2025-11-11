'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationUpdate {
  type: 'connection_established' | 'notification' | 'error';
  payload?: RealtimeNotification;
  message?: string;
  timestamp: string;
}

interface UseRealtimeNotificationsReturn {
  notifications: RealtimeNotification[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for real-time notifications using Server-Sent Events (SSE)
 */
export function useRealtimeNotifications(): UseRealtimeNotificationsReturn {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  /**
   * Connect to SSE stream
   */
  const connect = useCallback(() => {
    if (!session?.user || eventSourceRef.current) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const eventSource = new EventSource('/api/notifications/sse');
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const update: NotificationUpdate = JSON.parse(event.data);
          
          switch (update.type) {
            case 'connection_established':
              console.log('SSE connection established:', update.message);
              break;
              
            case 'notification':
              if (update.payload) {
                console.log('New real-time notification:', update.payload);
                setNotifications(prev => [update.payload!, ...prev]);
                
                // Show browser notification if permitted
                if (Notification.permission === 'granted') {
                  new Notification(update.payload.title, {
                    body: update.payload.message,
                    icon: '/favicon.ico',
                    tag: update.payload.id
                  });
                }
              }
              break;
              
            case 'error':
              console.error('SSE error:', update.message);
              setConnectionStatus('error');
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            disconnect();
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      };
      
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      setConnectionStatus('error');
    }
  }, [session?.user]);

  /**
   * Disconnect from SSE stream
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  /**
   * Fetch initial notifications from API
   */
  const refetch = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [session?.user]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [notificationId]
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAll: true
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  /**
   * Clear (delete) notification
   */
  const clearNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Connect/disconnect based on session
  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user) {
      refetch(); // Load initial notifications
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [session?.user, status, connect, disconnect, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    notifications,
    isConnected,
    connectionStatus,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refetch
  };
}