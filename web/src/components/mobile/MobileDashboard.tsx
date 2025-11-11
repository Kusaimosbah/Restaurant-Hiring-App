'use client';

import React, { useState, useEffect } from 'react';
import { MobileLayout, TouchButton, MobileCard, PullToRefresh } from '@/components/mobile/MobileLayout';
import { usePWA } from '@/hooks/usePWA';

interface DashboardStats {
  totalApplications: number;
  activeJobs: number;
  unreadMessages: number;
  todayInterviews: number;
  pendingReviews: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'message' | 'interview' | 'review';
  title: string;
  description: string;
  timestamp: string;
  urgent?: boolean;
}

export function MobileDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeJobs: 0,
    unreadMessages: 0,
    todayInterviews: 0,
    pendingReviews: 0,
    totalRevenue: 0,
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { storeOfflineAction, isOnline } = usePWA();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/activity'),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      
      // Handle offline scenario
      if (!isOnline) {
        storeOfflineAction({
          type: 'REFRESH_DASHBOARD',
          data: {},
          timestamp: Date.now(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  const quickActions = [
    {
      id: 'post-job',
      title: 'Post Job',
      icon: '💼',
      color: 'bg-blue-500',
      href: '/jobs/new',
    },
    {
      id: 'view-applications',
      title: 'Applications',
      icon: '📋',
      color: 'bg-green-500',
      href: '/applications',
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: '💬',
      color: 'bg-purple-500',
      href: '/messages',
      badge: stats.unreadMessages > 0 ? stats.unreadMessages : undefined,
    },
    {
      id: 'schedule',
      title: 'Schedule',
      icon: '📅',
      color: 'bg-orange-500',
      href: '/schedule',
    },
  ];

  if (loading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <DashboardSkeleton />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back!</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="Applications"
              value={stats.totalApplications}
              icon="📝"
              color="text-blue-600"
            />
            <StatsCard
              title="Active Jobs"
              value={stats.activeJobs}
              icon="💼"
              color="text-green-600"
            />
            <StatsCard
              title="Today's Interviews"
              value={stats.todayInterviews}
              icon="🤝"
              color="text-purple-600"
            />
            <StatsCard
              title="Pending Reviews"
              value={stats.pendingReviews}
              icon="⭐"
              color="text-orange-600"
            />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <QuickActionCard key={action.id} action={action} />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <TouchButton
                variant="ghost"
                size="small"
                onClick={() => window.location.href = '/activity'}
              >
                View All
              </TouchButton>
            </div>
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
              {activities.length === 0 && (
                <MobileCard className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📝</div>
                  <p className="text-gray-600">No recent activity</p>
                </MobileCard>
              )}
            </div>
          </div>

          {/* Bottom Spacing for Navigation */}
          <div className="h-6" />
        </div>
      </PullToRefresh>
    </MobileLayout>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <MobileCard className="text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-sm text-gray-600 mt-1">{title}</div>
    </MobileCard>
  );
}

function QuickActionCard({
  action,
}: {
  action: {
    id: string;
    title: string;
    icon: string;
    color: string;
    href: string;
    badge?: number;
  };
}) {
  return (
    <MobileCard
      onClick={() => window.location.href = action.href}
      hover
      className="text-center relative"
    >
      <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2 text-white text-xl`}>
        {action.icon}
      </div>
      <div className="font-medium text-gray-900">{action.title}</div>

      {/* Badge */}
      {action.badge && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
          {action.badge > 99 ? '99+' : action.badge}
        </div>
      )}
    </MobileCard>
  );
}

function ActivityCard({ activity }: { activity: RecentActivity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return '📝';
      case 'message': return '💬';
      case 'interview': return '🤝';
      case 'review': return '⭐';
      default: return '📋';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <MobileCard className={`${activity.urgent ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="flex items-start space-x-3">
        <div className="text-2xl flex-shrink-0">
          {getActivityIcon(activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">
              {activity.title}
            </h3>
            {activity.urgent && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2 flex-shrink-0">
                Urgent
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {activity.description}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {formatTimestamp(activity.timestamp)}
          </p>
        </div>
      </div>
    </MobileCard>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="text-center">
        <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-12 mx-auto mb-1 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-3 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Activity Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-full mb-1 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}