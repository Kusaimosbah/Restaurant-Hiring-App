'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationIconProps {
  className?: string;
}

export default function NotificationIcon({ className = '' }: NotificationIconProps) {
  const { unreadCount, refreshNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Update unread count when notifications are marked as read
  const handleNotificationsRead = () => {
    refreshNotifications();
  };

  return (
    <div className="relative">
      <button 
        className={`relative p-2 rounded-full hover:bg-gray-100 ${className}`}
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <NotificationDropdown 
          onClose={handleClose}
          onNotificationsRead={handleNotificationsRead}
        />
      )}
    </div>
  );
}
