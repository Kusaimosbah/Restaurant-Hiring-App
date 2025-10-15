'use client';

import { useState, useEffect } from 'react';
import { Check, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import NotificationItem from '@/components/notifications/NotificationItem';
import MobileSidebar from '@/components/MobileSidebar';
import { useNotifications } from '@/hooks/useNotifications';

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [filteredNotifications, setFilteredNotifications] = useState<any[]>([]);

  // Apply filters and pagination to notifications
  useEffect(() => {
    // Apply filters
    let filtered = [...notifications];
    
    if (filterType) {
      filtered = filtered.filter(notification => notification.type === filterType);
    }
    
    if (showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.isRead);
    }
    
    // Update pagination info
    const total = filtered.length;
    const pages = Math.ceil(total / pagination.limit);
    
    setPagination(prev => ({
      ...prev,
      total,
      pages,
      page: Math.min(prev.page, pages || 1)
    }));
    
    // Apply pagination
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    setFilteredNotifications(filtered.slice(start, end));
    
    setIsLoading(false);
  }, [notifications, pagination.page, pagination.limit, filterType, showUnreadOnly]);

  const handleNotificationClick = (notification: any) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterType(value === 'all' ? null : value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleUnreadToggle = () => {
    setShowUnreadOnly(!showUnreadOnly);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileSidebar />
      
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Notifications</h1>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={markAllAsRead}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center"
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all as read
              </button>
              
              <button
                onClick={refreshNotifications}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </button>
              
              <div className="flex items-center">
                <select
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterType || 'all'}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Types</option>
                  <option value="APPLICATION_STATUS">Application Updates</option>
                  <option value="NEW_APPLICATION">New Applications</option>
                  <option value="NEW_MESSAGE">Messages</option>
                  <option value="NEW_JOB">Job Postings</option>
                  <option value="SHIFT_REMINDER">Shift Reminders</option>
                  <option value="NEW_REVIEW">Reviews</option>
                  <option value="SYSTEM_ALERT">System Alerts</option>
                </select>
                
                <button
                  onClick={handleUnreadToggle}
                  className={`ml-2 px-3 py-2 text-sm rounded-md flex items-center ${
                    showUnreadOnly 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Unread only
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg mb-2">No notifications found</p>
                <p className="text-sm">
                  {showUnreadOnly 
                    ? "You've read all your notifications" 
                    : filterType 
                      ? "No notifications of this type" 
                      : "You don't have any notifications yet"}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredNotifications.map(notification => (
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
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} notifications
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`p-2 rounded-md ${
                    pagination.page === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(pageNum => {
                      // Show first page, last page, current page, and pages around current page
                      return (
                        pageNum === 1 ||
                        pageNum === pagination.pages ||
                        Math.abs(pageNum - pagination.page) <= 1
                      );
                    })
                    .map((pageNum, index, array) => (
                      <div key={pageNum}>
                        {index > 0 && array[index - 1] !== pageNum - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-md ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </div>
                    ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`p-2 rounded-md ${
                    pagination.page === pagination.pages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
