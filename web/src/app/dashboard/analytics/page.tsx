'use client';

import { useState, useEffect } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface AnalyticsData {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  applicationRate: number;
  avgHireTime: number;
  workerRetention: number;
}

export default function AnalyticsPage() {
  return (
    <SessionProvider>
      <AnalyticsPageContent />
    </SessionProvider>
  );
}

function AnalyticsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    applicationRate: 0,
    avgHireTime: 0,
    workerRetention: 0,
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    loadAnalytics();
  }, [session, status, router, isAdmin]);

  const loadAnalytics = async () => {
    try {
      // For now, we'll use the dashboard stats endpoint and calculate some metrics
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const stats = await response.json();
        setAnalytics({
          totalJobs: stats.totalJobs,
          activeJobs: stats.activeJobs,
          totalApplications: stats.totalApplications,
          pendingApplications: stats.pendingApplications,
          applicationRate: stats.totalJobs > 0 ? (stats.totalApplications / stats.totalJobs) : 0,
          avgHireTime: 5.3, // Mock data
          workerRetention: 87, // Mock data
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, subtitle, color = 'blue' }: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    color?: string 
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className={`text-2xl font-bold text-${color}-600 mb-1`}>{value}</div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
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
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="Analytics & Insights"
          subtitle="Track your restaurant's hiring performance"
        />
        
        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard 
              title="Total Jobs Posted" 
              value={analytics.totalJobs} 
              subtitle={`${analytics.activeJobs} currently active`}
              color="blue" 
            />
            <MetricCard 
              title="Total Applications" 
              value={analytics.totalApplications} 
              subtitle={`${analytics.pendingApplications} pending review`}
              color="green" 
            />
            <MetricCard 
              title="Application Rate" 
              value={analytics.applicationRate.toFixed(1)} 
              subtitle="applications per job"
              color="purple" 
            />
            <MetricCard 
              title="Avg. Hire Time" 
              value={`${analytics.avgHireTime} days`} 
              subtitle="from post to hire"
              color="orange" 
            />
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Worker Retention Rate</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${analytics.workerRetention}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analytics.workerRetention}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Application Success Rate</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: '65%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: '80%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">2.1 days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Job Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Server</span>
                    <span className="text-sm font-medium">45% of jobs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kitchen Staff</span>
                    <span className="text-sm font-medium">30% of jobs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bartender</span>
                    <span className="text-sm font-medium">15% of jobs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Host/Hostess</span>
                    <span className="text-sm font-medium">10% of jobs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights and Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📈 What's Working Well</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• High application rate indicates attractive job postings</li>
                    <li>• Good worker retention suggests positive work environment</li>
                    <li>• Quick response time maintains candidate interest</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">💡 Improvement Opportunities</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Consider posting more diverse job types</li>
                    <li>• Streamline hiring process to reduce time-to-hire</li>
                    <li>• Implement feedback system for rejected candidates</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}