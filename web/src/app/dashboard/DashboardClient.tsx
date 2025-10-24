'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Session } from 'next-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';

// Import new dashboard components
import StatsCard from '@/components/dashboard/StatsCard';
import TrendChart from '@/components/dashboard/TrendChart';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import TaskList from '@/components/dashboard/TaskList';
import WeeklySchedule from '@/components/dashboard/WeeklySchedule';
import ApplicationStatus from '@/components/dashboard/ApplicationStatus';
import ProfileCompletion from '@/components/dashboard/ProfileCompletion';
import QuickActions from '@/components/dashboard/QuickActions';

// Import icons
import {
  BriefcaseIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  totalWorkers: number;
  activeWorkers: number;
  metrics?: {
    applicationRate: string;
    averageHireTime: string;
    workerRetention: number;
    jobFillRate: string;
  };
  workerMetrics?: {
    profileCompletion: number;
    applicationStatuses: {
      pending: number;
      accepted: number;
      rejected: number;
      interviewing: number;
      withdrawn: number;
    };
    upcomingShifts: Array<{
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      restaurant: string;
      position: string;
      earnings: number;
    }>;
    totalEarnings: number;
  };
  trends?: {
    applications: number[];
    hires?: number[];
    revenue?: number[];
    earnings?: number[];
    hours?: number[];
  };
}

interface RecentActivity {
  id: string;
  type: 'application' | 'job' | 'worker' | 'message' | 'review' | 'shift' | 'profile';
  message: string;
  time: string;
  details?: string;
  link?: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

interface Application {
  id: string;
  position: string;
  restaurant?: string;
  status: 'pending' | 'approved' | 'rejected' | 'interviewing' | 'withdrawn';
  appliedDate: string;
  updatedDate?: string;
}

export default function DashboardClient() {
  const { data: sessionData, status } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalWorkers: 0,
    activeWorkers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityFilter, setActivityFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = sessionData?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!sessionData) {
      router.push('/auth/signin');
      return;
    }
    
    // Force session validation to ensure we have fresh role data
    if (sessionData?.user?.role && !['RESTAURANT_OWNER', 'WORKER'].includes(sessionData.user.role)) {
      console.warn('Invalid user role detected, redirecting to signin');
      router.push('/auth/signin');
      return;
    }
    
    loadDashboardData();
  }, [sessionData, status, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/dashboard/activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setRecentActivity(activityData);
      }

      // Fetch tasks
      const tasksResponse = await fetch('/api/dashboard/tasks');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const handleActivityFilterChange = async (type: string | null) => {
    setActivityFilter(type);
    try {
      const url = type ? `/api/dashboard/activity?type=${type}` : '/api/dashboard/activity';
      const response = await fetch(url);
      if (response.ok) {
        const activityData = await response.json();
        setRecentActivity(activityData);
      }
    } catch (error) {
      console.error('Failed to filter activity:', error);
    }
  };

  const handleTaskToggle = async (id: string, completed: boolean) => {
    try {
      // Find the task and update its status
      const updatedTasks = tasks.map(task => 
        task.id === id ? { ...task, completed } : task
      );
      setTasks(updatedTasks);

      // In a real app, we would save this to the server
      await fetch('/api/dashboard/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTasks.find(task => task.id === id))
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleTaskAdd = async (task: Omit<Task, 'id'>) => {
    try {
      const response = await fetch('/api/dashboard/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Generate last 6 months labels for charts
  const getMonthLabels = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    return months;
  };
  
  const monthLabels = getMonthLabels();

  // Convert worker profile sections to ProfileCompletion format
  const getProfileSections = () => {
    return [
      {
        id: 'personal-info',
        name: 'Personal Information',
        completed: true,
        requiredForApplying: true,
        link: '/dashboard/profile/worker'
      },
      {
        id: 'skills',
        name: 'Skills & Experience',
        completed: true,
        requiredForApplying: true,
        link: '/dashboard/profile/worker'
      },
      {
        id: 'certifications',
        name: 'Certifications',
        completed: false,
        requiredForApplying: false,
        link: '/dashboard/profile/worker'
      },
      {
        id: 'documents',
        name: 'Documents',
        completed: false,
        requiredForApplying: false,
        link: '/dashboard/profile/worker'
      }
    ];
  };

  // Sample data for worker's schedule
  const getWorkerSchedule = () => {
    return [
      {
        id: 'monday',
        day: 'Monday',
        startTime: '9:00 AM',
        endTime: '5:00 PM',
        location: 'Downtown',
        position: 'Server'
      },
      {
        id: 'tuesday',
        day: 'Tuesday',
        isOff: true
      },
      {
        id: 'wednesday',
        day: 'Wednesday',
        startTime: '2:00 PM',
        endTime: '10:00 PM',
        location: 'Uptown',
        position: 'Bartender'
      },
      {
        id: 'thursday',
        day: 'Thursday',
        startTime: '9:00 AM',
        endTime: '5:00 PM',
        location: 'Downtown',
        position: 'Server'
      },
      {
        id: 'friday',
        day: 'Friday',
        startTime: '4:00 PM',
        endTime: '12:00 AM',
        location: 'Downtown',
        position: 'Host'
      },
      {
        id: 'saturday',
        day: 'Saturday',
        startTime: '12:00 PM',
        endTime: '8:00 PM',
        location: 'Uptown',
        position: 'Server'
      },
      {
        id: 'sunday',
        day: 'Sunday',
        isOff: true
      }
    ];
  };

  // Sample data for worker's applications
  const getWorkerApplications = (): Application[] => {
    return [
      {
        id: 'app-1',
        position: 'Server Position',
        restaurant: 'The Golden Fork',
        status: 'pending' as const,
        appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'app-2',
        position: 'Cook Position',
        restaurant: 'Pasta Paradise',
        status: 'approved' as const,
        appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'app-3',
        position: 'Bartender Position',
        restaurant: 'Cocktail Corner',
        status: 'interviewing' as const,
        appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <MobileSidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title={isAdmin ? 'Admin Dashboard' : 'Worker Dashboard'}
          subtitle={isAdmin ? 'Manage your restaurant operations' : 'Track your job applications and shifts'}
        />
        
        <div className="p-4 sm:p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {isAdmin ? (
              <>
                <StatsCard 
                  title="Total Jobs" 
                  value={stats.totalJobs} 
                  subtitle={`${stats.activeJobs} active`} 
                  color="blue"
                  trend={5}
                  icon={<BriefcaseIcon className="h-5 w-5 text-blue-600" />}
                  onClick={() => handleNavigate('/dashboard/jobs')}
                />
                <StatsCard 
                  title="Applications" 
                  value={stats.totalApplications} 
                  subtitle={`${stats.pendingApplications} pending`} 
                  color="green"
                  trend={12}
                  icon={<DocumentTextIcon className="h-5 w-5 text-green-600" />}
                  onClick={() => handleNavigate('/dashboard/applications')}
                />
                <StatsCard 
                  title="Workers" 
                  value={stats.totalWorkers} 
                  subtitle={`${stats.activeWorkers} active`} 
                  color="purple"
                  trend={-3}
                  icon={<UserGroupIcon className="h-5 w-5 text-purple-600" />}
                  onClick={() => handleNavigate('/dashboard/workers')}
                />
                <StatsCard 
                  title="Job Fill Rate" 
                  value={parseInt(stats.metrics?.jobFillRate || '0')} 
                  subtitle="of positions filled" 
                  color="yellow"
                  icon={<ChartBarIcon className="h-5 w-5 text-yellow-600" />}
                  onClick={() => handleNavigate('/dashboard/analytics')}
                />
              </>
            ) : (
              <>
                <StatsCard 
                  title="Available Jobs" 
                  value={stats.activeJobs} 
                  subtitle="Jobs you can apply for" 
                  color="blue"
                  icon={<BriefcaseIcon className="h-5 w-5 text-blue-600" />}
                  onClick={() => handleNavigate('/dashboard/jobs')}
                />
                <StatsCard 
                  title="My Applications" 
                  value={stats.totalApplications} 
                  subtitle={`${stats.pendingApplications} pending`} 
                  color="green"
                  icon={<DocumentTextIcon className="h-5 w-5 text-green-600" />}
                  onClick={() => handleNavigate('/dashboard/applications')}
                />
                <StatsCard 
                  title="Profile Completion" 
                  value={stats.workerMetrics?.profileCompletion || 85} 
                  subtitle="Complete your profile" 
                  color="yellow"
                  icon={<UserCircleIcon className="h-5 w-5 text-yellow-600" />}
                  onClick={() => handleNavigate('/dashboard/profile/worker')}
                />
                <StatsCard 
                  title="Total Earnings" 
                  value={stats.workerMetrics?.totalEarnings || 0} 
                  subtitle="This month" 
                  color="purple"
                  icon={<CurrencyDollarIcon className="h-5 w-5 text-purple-600" />}
                  onClick={() => handleNavigate('/dashboard/analytics')}
                />
              </>
            )}
          </div>

          {/* Trend Charts - Only for Admin */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <TrendChart 
                title="Applications" 
                data={stats.trends?.applications || [0, 0, 0, 0, 0, 0]} 
                labels={monthLabels}
                color="green"
              />
              <TrendChart 
                title="Hires" 
                data={stats.trends?.hires || [0, 0, 0, 0, 0, 0]} 
                labels={monthLabels}
                color="blue"
              />
              <TrendChart 
                title="Revenue" 
                data={stats.trends?.revenue || [0, 0, 0, 0, 0, 0]} 
                labels={monthLabels}
                color="purple"
              />
            </div>
          )}

          {/* Trend Charts - Only for Worker */}
          {!isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <TrendChart 
                title="Applications" 
                data={stats.trends?.applications || [0, 0, 0, 0, 0, 0]} 
                labels={monthLabels}
                color="green"
              />
              <TrendChart 
                title="Earnings" 
                data={stats.trends?.earnings || [0, 0, 0, 0, 0, 0]} 
                labels={monthLabels}
                color="purple"
              />
              <TrendChart 
                title="Hours Worked" 
                data={stats.trends?.hours || [0, 0, 0, 0, 0, 0]} 
                labels={monthLabels}
                color="blue"
              />
                </div>
          )}

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Quick Actions */}
            <QuickActions
              isAdmin={isAdmin}
              pendingApplications={stats.pendingApplications}
              activeJobs={stats.activeJobs}
              onNavigate={handleNavigate}
            />

            {/* Recent Activity */}
            <ActivityFeed 
              activities={recentActivity} 
              title="Recent Activity"
              loading={loading}
              onFilterChange={handleActivityFilterChange}
            />
          </div>

          {/* Additional Admin Features */}
          {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <PerformanceMetrics
                title="Performance Overview"
                metrics={[
                  { 
                    label: 'Application Rate', 
                    value: `${stats.metrics?.applicationRate || '0.0'} apps/job`, 
                    trend: 5 
                  },
                  { 
                    label: 'Avg. Hire Time', 
                    value: `${stats.metrics?.averageHireTime || '0.0'} days`, 
                    trend: -10 
                  },
                  { 
                    label: 'Worker Retention', 
                    value: `${stats.metrics?.workerRetention || 0}%`, 
                    trend: 2 
                  },
                  { 
                    label: 'Active Positions', 
                    value: stats.activeJobs, 
                    trend: 0 
                  }
                ]}
              />

              <TaskList
                title="Upcoming Tasks"
                tasks={tasks}
                loading={loading}
                onTaskToggle={handleTaskToggle}
                onTaskAdd={handleTaskAdd}
              />
            </div>
          )}

          {/* Worker Specific Features */}
          {!isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ApplicationStatus
                applications={getWorkerApplications()}
                loading={loading}
                onViewDetails={(id) => handleNavigate(`/dashboard/applications?id=${id}`)}
              />

              <ProfileCompletion
                sections={getProfileSections()}
                completionPercentage={stats.workerMetrics?.profileCompletion || 85}
                loading={loading}
                onNavigate={handleNavigate}
              />
                    </div>
          )}

          {/* Worker Schedule */}
          {!isAdmin && (
            <div className="mt-4 sm:mt-6">
              <WeeklySchedule
                schedule={getWorkerSchedule()}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}