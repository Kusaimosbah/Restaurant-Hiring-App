'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/dashboard/StatsCard';
import TrendChart from '@/components/dashboard/TrendChart';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BriefcaseIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon
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

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export default function StatsPage() {
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
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);

  const isAdmin = sessionData?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!sessionData) {
      router.push('/auth/signin');
      return;
    }
    loadStats();
  }, [sessionData, status, router, timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // In a real app, we would pass the timeRange as a query parameter
      const response = await fetch(`/api/dashboard/stats?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setLoading(false);
    }
  };

  // Generate labels based on time range
  const getLabels = () => {
    const labels = [];
    let format = { month: 'short' };
    let count = 6;
    let step = 1;
    
    switch(timeRange) {
      case '7d':
        format = { weekday: 'short' };
        count = 7;
        break;
      case '30d':
        format = { month: 'short', day: 'numeric' };
        count = 6;
        step = 5;
        break;
      case '90d':
        format = { month: 'short' };
        count = 3;
        break;
      case '1y':
        format = { month: 'short' };
        count = 6;
        step = 2;
        break;
      default:
        format = { month: 'short' };
        count = 6;
    }
    
    for (let i = count - 1; i >= 0; i -= step) {
      const date = new Date();
      if (timeRange === '7d') {
        date.setDate(date.getDate() - i);
      } else if (timeRange === '30d') {
        date.setDate(date.getDate() - i * step);
      } else if (timeRange === '90d') {
        date.setMonth(date.getMonth() - i);
      } else if (timeRange === '1y') {
        date.setMonth(date.getMonth() - i * step);
      } else {
        date.setMonth(date.getMonth() - i);
      }
      labels.push(date.toLocaleDateString('en-US', format));
    }
    return labels;
  };
  
  const labels = getLabels();

  // Calculate growth percentages
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Get previous period values (simplified example)
  const getPreviousValue = (current: number) => {
    // In a real app, this would come from the API
    return Math.round(current * (Math.random() * 0.4 + 0.8)); // Random value between 80% and 120% of current
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="Advanced Statistics"
          subtitle="Detailed metrics and performance analytics"
        />
        
        <div className="p-4 sm:p-6">
          {/* Time Range Selector */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <Button 
                variant={timeRange === '7d' ? 'default' : 'outline'} 
                onClick={() => setTimeRange('7d')}
                size="sm"
              >
                7 Days
              </Button>
              <Button 
                variant={timeRange === '30d' ? 'default' : 'outline'} 
                onClick={() => setTimeRange('30d')}
                size="sm"
              >
                30 Days
              </Button>
              <Button 
                variant={timeRange === '90d' ? 'default' : 'outline'} 
                onClick={() => setTimeRange('90d')}
                size="sm"
              >
                90 Days
              </Button>
              <Button 
                variant={timeRange === '1y' ? 'default' : 'outline'} 
                onClick={() => setTimeRange('1y')}
                size="sm"
              >
                1 Year
              </Button>
              <Button 
                variant={timeRange === 'all' ? 'default' : 'outline'} 
                onClick={() => setTimeRange('all')}
                size="sm"
              >
                All Time
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCompareMode(!compareMode)}
                size="sm"
              >
                {compareMode ? 'Hide Comparison' : 'Compare Periods'}
              </Button>
              <Button 
                variant="outline" 
                onClick={loadStats}
                size="sm"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {isAdmin ? (
              <>
                <StatsCard 
                  title="Total Jobs" 
                  value={stats.totalJobs} 
                  subtitle={`${stats.activeJobs} active`} 
                  color="blue"
                  trend={compareMode ? calculateGrowth(stats.totalJobs, getPreviousValue(stats.totalJobs)) : undefined}
                  icon={<BriefcaseIcon className="h-5 w-5 text-blue-600" />}
                />
                <StatsCard 
                  title="Applications" 
                  value={stats.totalApplications} 
                  subtitle={`${stats.pendingApplications} pending`} 
                  color="green"
                  trend={compareMode ? calculateGrowth(stats.totalApplications, getPreviousValue(stats.totalApplications)) : undefined}
                  icon={<DocumentTextIcon className="h-5 w-5 text-green-600" />}
                />
                <StatsCard 
                  title="Workers" 
                  value={stats.totalWorkers} 
                  subtitle={`${stats.activeWorkers} active`} 
                  color="purple"
                  trend={compareMode ? calculateGrowth(stats.totalWorkers, getPreviousValue(stats.totalWorkers)) : undefined}
                  icon={<UserGroupIcon className="h-5 w-5 text-purple-600" />}
                />
                <StatsCard 
                  title="Job Fill Rate" 
                  value={parseInt(stats.metrics?.jobFillRate || '0')} 
                  subtitle="of positions filled" 
                  color="yellow"
                  trend={compareMode ? calculateGrowth(parseInt(stats.metrics?.jobFillRate || '0'), getPreviousValue(parseInt(stats.metrics?.jobFillRate || '0'))) : undefined}
                  icon={<ChartBarIcon className="h-5 w-5 text-yellow-600" />}
                />
              </>
            ) : (
              <>
                <StatsCard 
                  title="Available Jobs" 
                  value={stats.activeJobs} 
                  subtitle="Jobs you can apply for" 
                  color="blue"
                  trend={compareMode ? calculateGrowth(stats.activeJobs, getPreviousValue(stats.activeJobs)) : undefined}
                  icon={<BriefcaseIcon className="h-5 w-5 text-blue-600" />}
                />
                <StatsCard 
                  title="My Applications" 
                  value={stats.totalApplications} 
                  subtitle={`${stats.pendingApplications} pending`} 
                  color="green"
                  trend={compareMode ? calculateGrowth(stats.totalApplications, getPreviousValue(stats.totalApplications)) : undefined}
                  icon={<DocumentTextIcon className="h-5 w-5 text-green-600" />}
                />
                <StatsCard 
                  title="Profile Views" 
                  value={Math.floor(Math.random() * 50) + 20} // Sample data
                  subtitle="Last 30 days" 
                  color="yellow"
                  trend={compareMode ? Math.floor(Math.random() * 30) - 10 : undefined}
                  icon={<UserCircleIcon className="h-5 w-5 text-yellow-600" />}
                />
                <StatsCard 
                  title="Total Earnings" 
                  value={stats.workerMetrics?.totalEarnings || 0} 
                  subtitle="This period" 
                  color="purple"
                  trend={compareMode ? calculateGrowth(stats.workerMetrics?.totalEarnings || 0, getPreviousValue(stats.workerMetrics?.totalEarnings || 0)) : undefined}
                  icon={<CurrencyDollarIcon className="h-5 w-5 text-purple-600" />}
                />
              </>
            )}
          </div>

          {/* Trend Charts */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trend Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {isAdmin ? (
              <>
                <TrendChart 
                  title="Applications Over Time" 
                  data={stats.trends?.applications || [0, 0, 0, 0, 0, 0]} 
                  labels={labels}
                  color="green"
                  height={120}
                />
                <TrendChart 
                  title="Hires Over Time" 
                  data={stats.trends?.hires || [0, 0, 0, 0, 0, 0]} 
                  labels={labels}
                  color="blue"
                  height={120}
                />
                <TrendChart 
                  title="Revenue Over Time" 
                  data={stats.trends?.revenue || [0, 0, 0, 0, 0, 0]} 
                  labels={labels}
                  color="purple"
                  height={120}
                />
                <TrendChart 
                  title="Job Fill Rate Over Time" 
                  data={[65, 70, 68, 72, 75, 78]} // Sample data
                  labels={labels}
                  color="yellow"
                  height={120}
                />
              </>
            ) : (
              <>
                <TrendChart 
                  title="Applications Over Time" 
                  data={stats.trends?.applications || [0, 0, 0, 0, 0, 0]} 
                  labels={labels}
                  color="green"
                  height={120}
                />
                <TrendChart 
                  title="Earnings Over Time" 
                  data={stats.trends?.earnings || [0, 0, 0, 0, 0, 0]} 
                  labels={labels}
                  color="purple"
                  height={120}
                />
                <TrendChart 
                  title="Hours Worked" 
                  data={stats.trends?.hours || [0, 0, 0, 0, 0, 0]} 
                  labels={labels}
                  color="blue"
                  height={120}
                />
                <TrendChart 
                  title="Profile Views Over Time" 
                  data={[5, 8, 12, 10, 15, 18]} // Sample data
                  labels={labels}
                  color="yellow"
                  height={120}
                />
              </>
            )}
          </div>

          {/* Performance Metrics */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {isAdmin ? (
              <>
                <PerformanceMetrics
                  title="Hiring Performance"
                  metrics={[
                    { 
                      label: 'Application Rate', 
                      value: `${stats.metrics?.applicationRate || '0.0'} apps/job`, 
                      trend: 5,
                      color: 'blue'
                    },
                    { 
                      label: 'Avg. Hire Time', 
                      value: `${stats.metrics?.averageHireTime || '0.0'} days`, 
                      trend: -10,
                      color: 'green'
                    },
                    { 
                      label: 'Worker Retention', 
                      value: `${stats.metrics?.workerRetention || 0}%`, 
                      trend: 2,
                      color: 'purple'
                    },
                    { 
                      label: 'Interview Success Rate', 
                      value: '68%', 
                      trend: 3,
                      color: 'blue'
                    },
                    {
                      label: 'Avg. Time to Fill',
                      value: '4.2 days',
                      trend: -8,
                      color: 'green'
                    },
                    {
                      label: 'Applicant Quality',
                      value: '76%',
                      trend: 3,
                      color: 'purple'
                    }
                  ]}
                />
                <PerformanceMetrics
                  title="Business Performance"
                  metrics={[
                    { 
                      label: 'Revenue per Worker', 
                      value: '$450', 
                      trend: 8,
                      color: 'blue'
                    },
                    { 
                      label: 'Cost per Hire', 
                      value: '$125', 
                      trend: -5,
                      color: 'green'
                    },
                    { 
                      label: 'Worker Satisfaction', 
                      value: '4.2/5.0', 
                      trend: 1,
                      color: 'yellow'
                    },
                    { 
                      label: 'No-Show Rate', 
                      value: '3.2%', 
                      trend: -12,
                      color: 'red'
                    },
                    {
                      label: 'Repeat Hire Rate',
                      value: '42%',
                      trend: 7,
                      color: 'blue'
                    },
                    {
                      label: 'Avg. Rating',
                      value: '4.7/5.0',
                      trend: 2,
                      color: 'yellow'
                    }
                  ]}
                />
              </>
            ) : (
              <>
                <PerformanceMetrics
                  title="Your Performance"
                  metrics={[
                    { 
                      label: 'Application Success Rate', 
                      value: '68%', 
                      trend: 5,
                      color: 'green'
                    },
                    { 
                      label: 'Avg. Hourly Rate', 
                      value: '$18.50', 
                      trend: 3,
                      color: 'blue'
                    },
                    { 
                      label: 'Hours This Month', 
                      value: '76 hrs', 
                      trend: 12,
                      color: 'purple'
                    },
                    { 
                      label: 'Employer Rating', 
                      value: '4.8/5.0', 
                      trend: 0,
                      color: 'yellow'
                    },
                    {
                      label: 'On-Time Rate',
                      value: '98%',
                      trend: 1,
                      color: 'green'
                    },
                    {
                      label: 'Completion Rate',
                      value: '100%',
                      trend: 0,
                      color: 'blue'
                    }
                  ]}
                />
                <PerformanceMetrics
                  title="Job Market Insights"
                  metrics={[
                    { 
                      label: 'Avg. Market Rate', 
                      value: '$17.25/hr', 
                      trend: 2,
                      color: 'blue'
                    },
                    { 
                      label: 'Your Rate Premium', 
                      value: '+7.2%', 
                      trend: 1,
                      color: 'green'
                    },
                    { 
                      label: 'Jobs in Your Area', 
                      value: '42', 
                      trend: 15,
                      color: 'purple'
                    },
                    { 
                      label: 'Demand for Your Skills', 
                      value: 'High', 
                      trend: 5,
                      color: 'yellow'
                    },
                    {
                      label: 'Avg. Competition',
                      value: '8 applicants',
                      trend: -3,
                      color: 'green'
                    },
                    {
                      label: 'Best Paying Position',
                      value: 'Chef',
                      trend: 0,
                      color: 'blue'
                    }
                  ]}
                />
              </>
            )}
          </div>

          {/* Additional Metrics */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Busiest Days */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Busiest Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                    <span className="ml-2 text-sm font-medium">Friday (90%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="ml-2 text-sm font-medium">Saturday (85%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                    <span className="ml-2 text-sm font-medium">Sunday (70%)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <span className="ml-2 text-sm font-medium">Thursday (60%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Positions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{isAdmin ? 'Top Requested Positions' : 'Top Paying Positions'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Server</span>
                    <span className="text-sm font-medium">{isAdmin ? '32%' : '$22/hr'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Chef</span>
                    <span className="text-sm font-medium">{isAdmin ? '28%' : '$28/hr'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bartender</span>
                    <span className="text-sm font-medium">{isAdmin ? '18%' : '$24/hr'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Host/Hostess</span>
                    <span className="text-sm font-medium">{isAdmin ? '12%' : '$18/hr'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendar View */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Upcoming Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center p-2 bg-blue-50 rounded-md border-l-4 border-blue-500">
                    <CalendarIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Friday, Oct 18</p>
                      <p className="text-xs text-gray-500">5 shifts scheduled</p>
                    </div>
                  </div>
                  <div className="flex items-center p-2 bg-green-50 rounded-md border-l-4 border-green-500">
                    <CalendarIcon className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Saturday, Oct 19</p>
                      <p className="text-xs text-gray-500">7 shifts scheduled</p>
                    </div>
                  </div>
                  <div className="flex items-center p-2 bg-purple-50 rounded-md border-l-4 border-purple-500">
                    <CalendarIcon className="h-5 w-5 text-purple-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Sunday, Oct 20</p>
                      <p className="text-xs text-gray-500">4 shifts scheduled</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <div className="flex justify-end mt-8">
            <Button variant="outline" size="sm" className="mr-2">
              Export as CSV
            </Button>
            <Button variant="outline" size="sm" className="mr-2">
              Export as PDF
            </Button>
            <Button variant="outline" size="sm">
              Schedule Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}