'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Bell, ChevronRight } from 'lucide-react';
import NotificationItem from './NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationsRead: () => void;
}

export default function NotificationDropdown({ 
  onClose,
  onNotificationsRead 
}: NotificationDropdownProps) {
  const { 
    notifications, 
    isLoading, 
    error, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    onNotificationsRead();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    onNotificationsRead();
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type and data
    if (notification.data) {
      switch (notification.type) {
        case 'NEW_APPLICATION':
        case 'APPLICATION_STATUS':
          if (notification.data.applicationId) {
            router.push(`/dashboard/applications?id=${notification.data.applicationId}`);
          }
          break;
        case 'NEW_MESSAGE':
          if (notification.data.conversationId) {
            router.push(`/dashboard/messages?id=${notification.data.conversationId}`);
          }
          break;
        case 'NEW_JOB':
          if (notification.data.jobId) {
            router.push(`/dashboard/jobs?id=${notification.data.jobId}`);
          }
          break;
        case 'SHIFT_REMINDER':
        case 'SHIFT_ASSIGNED':
          router.push('/dashboard/schedule');
          break;
        case 'NEW_REVIEW':
          router.push('/dashboard/reviews');
          break;
        default:
          router.push('/dashboard');
      }
    }
    
    onClose();
  };

  const viewAllNotifications = () => {
    router.push('/dashboard/notifications');
    onClose();
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 z-50 w-80 mt-2 bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ maxHeight: '80vh' }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex space-x-2">
          <button
            onClick={markAllAsRead}
            className="p-1 text-sm text-gray-600 hover:text-blue-600"
            title="Mark all as read"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-sm text-gray-600 hover:text-red-600"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <Bell className="w-12 h-12 mb-2 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <ul>
            {notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkAsRead={() => markAsRead(notification.id)}
              />
            ))}
          </ul>
        )}
      </div>
      
      <div className="p-3 border-t text-center">
        <button 
          onClick={viewAllNotifications}
          className="flex items-center justify-center w-full p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          View all notifications
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
