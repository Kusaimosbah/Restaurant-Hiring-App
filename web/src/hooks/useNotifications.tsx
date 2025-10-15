'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      setIsLoading(true);
      // Add timestamp to prevent caching issues
      const res = await fetch(`/api/notifications?limit=10&_t=${new Date().getTime()}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT'
      });
      
      if (res.ok) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === id
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markAll: true })
      });
      
      if (res.ok) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({
            ...notification,
            isRead: true
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

    // Set up SSE connection for real-time notifications
  useEffect(() => {
    if (!session?.user) return;

    // Close any existing connection
    if (eventSource) {
      eventSource.close();
    }

    // Create new SSE connection with the current port
    const baseUrl = window.location.origin;
    const newEventSource = new EventSource(`${baseUrl}/api/notifications/sse`);
    
    newEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different event types
        if (data.type === 'new_notification') {
          // Add new notification to the list
          setNotifications(prev => [data.notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error processing SSE message:', error);
      }
    };
    
    newEventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      newEventSource.close();
    };
    
    setEventSource(newEventSource);
    
    // Clean up on unmount
    return () => {
      newEventSource.close();
    };
  }, [session]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: fetchNotifications
  };
}
