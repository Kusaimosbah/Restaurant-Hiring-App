'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  BellIcon
} from '@heroicons/react/24/solid';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'notification';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
}

const getIconForType = (type: ToastNotification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
    case 'error':
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
    case 'warning':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
    case 'info':
      return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
    case 'notification':
      return <BellIcon className="h-5 w-5 text-purple-400" />;
    default:
      return <InformationCircleIcon className="h-5 w-5 text-gray-400" />;
  }
};

const getColorClasses = (type: ToastNotification['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
    case 'notification':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

function ToastItem({ 
  notification, 
  onDismiss 
}: { 
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss after duration
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Match the transition duration
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`max-w-sm w-full shadow-lg rounded-lg border ${getColorClasses(notification.type)}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIconForType(notification.type)}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleDismiss}
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationToast({ notifications, onDismiss }: NotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}