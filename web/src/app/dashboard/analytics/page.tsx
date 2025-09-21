'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  UsersIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    pendingApplications: number;
    totalWorkers: number;
    activeWorkers: number;
    avgHourlyRate: number;
    totalHours: number;
  };
  trends: {
    jobsPosted: Array<{ month: string; count: number }>;
    applicationsReceived: Array<{ month: string; count: number }>;
    workersHired: Array<{ month: string; count: number }>;
    revenueGenerated: Array<{ month: string; amount: number }>;
  };
  performance: {
    avgApplicationsPerJob: number;
    avgTimeToHire: number;
    workerRetentionRate: number;
    jobFillRate: number;
  };
  topPerformers: {
    workers: Array<{
      id: string;
      name: string;
      jobsCompleted: number;
      rating: number;
      totalHours: number;
    }>;
    jobCategories: Array<{
      category: string;
      count: number;
      avgRate: number;
    }>;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user?.role !== 'RESTAURANT_OWNER') {
      router.push('/dashboard');
      return;
    }
    loadAnalytics();
  }, [session, status, router, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // For now, we'll use dummy data since we need to create API endpoints
      setTimeout(() => {
        setAnalytics({
          overview: {
            totalJobs: 45,
            activeJobs: 12,
            totalApplications: 156,
            pendingApplications: 23,
            totalWorkers: 28,
            activeWorkers: 18,
            avgHourlyRate: 18.50,
            totalHours: 1247,
          },
          trends: {
            jobsPosted: [
              { month: 'Aug', count: 8 },
              { month: 'Sep', count: 12 },
              { month: 'Oct', count: 15 },
              { month: 'Nov', count: 18 },
              { month: 'Dec', count: 14 },
              { month: 'Jan', count: 22 },
            ],
            applicationsReceived: [
              { month: 'Aug', count: 32 },
              { month: 'Sep', count: 45 },
              { month: 'Oct', count: 38 },
              { month: 'Nov', count: 52 },
              { month: 'Dec', count: 29 },
              { month: 'Jan', count: 68 },
            ],
            workersHired: [
              { month: 'Aug', count: 5 },
              { month: 'Sep', count: 8 },
              { month: 'Oct', count: 6 },
              { month: 'Nov', count: 9 },
              { month: 'Dec', count: 4 },
              { month: 'Jan', count: 12 },
            ],
            revenueGenerated: [
              { month: 'Aug', amount: 8950 },
              { month: 'Sep', amount: 12450 },
              { month: 'Oct', amount: 9800 },
              { month: 'Nov', amount: 15200 },
              { month: 'Dec', amount: 7600 },
              { month: 'Jan', amount: 18750 },
            ],
          },
          performance: {
            avgApplicationsPerJob: 3.47,
            avgTimeToHire: 5.2,
            workerRetentionRate: 87.5,
            jobFillRate: 94.3,
          },
          topPerformers: {
            workers: [
              { id: '1', name: 'Mike Johnson', jobsCompleted: 24, rating: 4.9, totalHours: 192 },
              { id: '2', name: 'Sarah Williams', jobsCompleted: 18, rating: 4.8, totalHours: 144 },
              { id: '3', name: 'David Brown', jobsCompleted: 15, rating: 4.7, totalHours: 120 },
              { id: '4', name: 'Emma Davis', jobsCompleted: 12, rating: 4.6, totalHours: 96 },
            ],
            jobCategories: [
              { category: 'Server', count: 18, avgRate: 18.50 },
              { category: 'Kitchen Staff', count: 12, avgRate: 16.75 },
              { category: 'Bartender', count: 8, avgRate: 22.00 },
              { category: 'Host/Hostess', count: 7, avgRate: 15.25 },
            ],
          },
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrend = (data: Array<{ month: string; count?: number; amount?: number }>) => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    const currentValue = current.count || current.amount || 0;
    const previousValue = previous.count || previous.amount || 0;
    
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="grid gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="Analytics Dashboard"
          subtitle="Monitor your restaurant hiring performance and trends"
        />
        
        <div className="p-6">
          {/* Time Range Selector */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Overview</h2>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalJobs}</p>
                    <div className="flex items-center mt-1">
                      {getTrend(analytics.trends.jobsPosted) >= 0 ? (
                        <TrendingUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ml-1 ${
                        getTrend(analytics.trends.jobsPosted) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(getTrend(analytics.trends.jobsPosted)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <BriefcaseIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalApplications}</p>
                    <div className="flex items-center mt-1">
                      {getTrend(analytics.trends.applicationsReceived) >= 0 ? (
                        <TrendingUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ml-1 ${
                        getTrend(analytics.trends.applicationsReceived) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(getTrend(analytics.trends.applicationsReceived)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Workers</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.activeWorkers}</p>
                    <div className="flex items-center mt-1">
                      {getTrend(analytics.trends.workersHired) >= 0 ? (
                        <TrendingUpIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDownIcon className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ml-1 ${
                        getTrend(analytics.trends.workersHired) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.abs(getTrend(analytics.trends.workersHired)).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <UsersIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Hourly Rate</p>
                    <p className="text-2xl font-bold text-gray-900">${analytics.overview.avgHourlyRate}</p>
                    <p className="text-sm text-gray-600 mt-1">Per hour</p>
                  </div>
                  <CurrencyDollarIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Applications per Job</span>
                    <span className="text-sm font-medium">{analytics.performance.avgApplicationsPerJob}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Time to Hire</span>
                    <span className="text-sm font-medium">{analytics.performance.avgTimeToHire} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Worker Retention Rate</span>
                    <span className="text-sm font-medium">{formatPercentage(analytics.performance.workerRetentionRate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Job Fill Rate</span>
                    <span className="text-sm font-medium">{formatPercentage(analytics.performance.jobFillRate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.trends.revenueGenerated.slice(-4).map((data, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{data.month}</span>
                      <span className="text-sm font-medium">{formatCurrency(data.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total Revenue</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(analytics.trends.revenueGenerated.reduce((sum, data) => sum + data.amount, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Jobs Posted Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.trends.jobsPosted.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{data.month}</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="bg-blue-500 h-2 rounded"
                          style={{ width: `${(data.count / Math.max(...analytics.trends.jobsPosted.map(d => d.count))) * 100}px` }}
                        />
                        <span className="text-sm font-medium w-8 text-right">{data.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Applications Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.trends.applicationsReceived.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{data.month}</span>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="bg-green-500 h-2 rounded"
                          style={{ width: `${(data.count / Math.max(...analytics.trends.applicationsReceived.map(d => d.count))) * 100}px` }}
                        />
                        <span className="text-sm font-medium w-8 text-right">{data.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPerformers.workers.map((worker, index) => (
                    <div key={worker.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{worker.name}</p>
                          <p className="text-xs text-gray-600">{worker.jobsCompleted} jobs • {worker.totalHours}h</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium">⭐ {worker.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Job Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPerformers.jobCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{category.category}</p>
                        <p className="text-xs text-gray-600">{category.count} jobs posted</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${category.avgRate}/hr</p>
                        <p className="text-xs text-gray-600">avg rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}