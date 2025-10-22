'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ActivityItem {
  id: string;
  type: 'application' | 'job' | 'worker' | 'message' | 'review' | 'shift' | 'profile';
  message: string;
  time: string;
  details?: string;
  link?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  loading?: boolean;
  onFilterChange?: (type: string | null) => void;
}

export default function ActivityFeed({
  activities,
  title = 'Recent Activity',
  loading = false,
  onFilterChange,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleFilterChange = (type: string | null) => {
    setFilter(type === filter ? null : type);
    if (onFilterChange) {
      onFilterChange(type === filter ? null : type);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'bg-green-500';
      case 'job':
        return 'bg-blue-500';
      case 'worker':
        return 'bg-purple-500';
      case 'message':
        return 'bg-yellow-500';
      case 'review':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'application':
        return (
          <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'job':
        return (
          <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
          </svg>
        );
      case 'worker':
        return (
          <svg className="h-3 w-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        );
      case 'message':
        return (
          <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        );
      case 'review':
        return (
          <svg className="h-3 w-3 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const filteredActivities = filter
    ? activities.filter(activity => activity.type === filter)
    : activities;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          {onFilterChange && (
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={filter === null ? 'primary' : 'outline'}
                onClick={() => handleFilterChange(null)}
                className="text-xs px-2 py-1 h-auto"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filter === 'application' ? 'primary' : 'outline'}
                onClick={() => handleFilterChange('application')}
                className="text-xs px-2 py-1 h-auto"
              >
                Applications
              </Button>
              <Button
                size="sm"
                variant={filter === 'job' ? 'primary' : 'outline'}
                onClick={() => handleFilterChange('job')}
                className="text-xs px-2 py-1 h-auto"
              >
                Jobs
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="animate-pulse h-2 w-2 rounded-full mt-2 bg-gray-200"></div>
                <div className="flex-1">
                  <div className="animate-pulse h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="animate-pulse h-3 w-1/4 bg-gray-200 rounded mt-1"></div>
                </div>
              </div>
            ))
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(activity.type)}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    {getTypeIcon(activity.type)}
                  </div>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                  
                  {activity.details && (
                    <div className="mt-1">
                      {expanded === activity.id ? (
                        <>
                          <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                          <button
                            onClick={() => setExpanded(null)}
                            className="text-xs text-indigo-600 mt-1 hover:underline"
                          >
                            Show less
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setExpanded(activity.id)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Show more
                        </button>
                      )}
                    </div>
                  )}
                  
                  {activity.link && (
                    <a
                      href={activity.link}
                      className="text-xs text-indigo-600 hover:underline block mt-1"
                    >
                      View details
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No recent activity</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
