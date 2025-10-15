'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

export default function ActivityPage() {
  const { data: sessionData, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!sessionData) {
      router.push('/auth/signin');
      return;
    }
    loadActivities();
  }, [sessionData, status, router]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const url = filter ? `/api/dashboard/activity?type=${filter}` : '/api/dashboard/activity';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (type: string | null) => {
    setFilter(type);
    loadActivities();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="Activity Feed"
          subtitle="Recent activities and updates"
        />
        
        <div className="p-4 sm:p-6">
          <ActivityFeed 
            activities={activities}
            title="All Activities"
            loading={loading}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>
    </div>
  );
}
