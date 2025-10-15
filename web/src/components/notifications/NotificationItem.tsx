'use client';

import { formatDistanceToNow } from 'date-fns';
import { Check, Bell, MessageSquare, Briefcase, Clock, Star, CreditCard, User, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
}

export default function NotificationItem({
  notification,
  onClick,
  onMarkAsRead
}: NotificationItemProps) {
  const formattedTime = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  
  // Prevent event bubbling when clicking the mark as read button
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead();
  };
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'APPLICATION_STATUS':
      case 'NEW_APPLICATION':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'NEW_MESSAGE':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'NEW_JOB':
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case 'SHIFT_REMINDER':
      case 'SHIFT_ASSIGNED':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'PAYMENT_UPDATE':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'NEW_REVIEW':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'PROFILE_VIEW':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };
  
  return (
    <li
      className={`
        flex items-start p-3 border-b cursor-pointer
        ${notification.isRead ? 'bg-white' : 'bg-blue-50'}
        hover:bg-gray-50 transition-colors
      `}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      
      <div className="ml-3 flex-grow">
        <div className="flex justify-between">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          {!notification.isRead && (
            <button
              onClick={handleMarkAsRead}
              className="p-1 text-xs text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100"
              title="Mark as read"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
        <span className="text-xs text-gray-500">{formattedTime}</span>
      </div>
    </li>
  );
}
