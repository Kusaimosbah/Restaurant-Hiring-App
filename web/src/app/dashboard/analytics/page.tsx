'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Sidebar } from '@/components/Sidebar';

interface JobAnalytics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  avgApplicationsPerJob: number;
  topJobTypes: Array<{ type: string; count: number }>;
  topSkillLevels: Array<{ level: string; count: number }>;
  avgHourlyRate: number;
  applicationTrends: Array<{ date: string; count: number }>;
  locationStats: Array<{ location: string; jobCount: number; avgRate: number }>;
  urgencyStats: Array<{ urgency: string; count: number; avgFillTime: number }>;
}

interface ApplicationAnalytics {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  acceptanceRate: number;
  avgResponseTime: number;
  dailyStats: Array<{ date: string; applications: number; accepted: number }>;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobAnalytics, setJobAnalytics] = useState<JobAnalytics | null>(null);
  const [appAnalytics, setAppAnalytics] = useState<ApplicationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');

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
      setLoading(true);
      const [jobsResponse, appsResponse] = await Promise.all([
        fetch('/api/jobs/stats'),
        fetch('/api/applications/analytics')
      ]);
      
      if (jobsResponse.ok) {
        const jobData = await jobsResponse.json();
        setJobAnalytics(jobData);
      }
      
      if (appsResponse.ok) {
        const appData = await appsResponse.json();
        setAppAnalytics(appData);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <DashboardHeader title="Analytics" subtitle="Loading analytics..." />
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <DashboardHeader title="Access Denied" subtitle="Admin access required" />
          <div className="p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Only restaurant owners can access analytics.</p>
              </CardContent>
            </Card>
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
          title="Analytics Dashboard" 
          subtitle="Comprehensive insights and performance metrics" 
        />
        
        <div className="p-6 space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'jobs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Job Analytics
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Application Analytics
            </button>
          </div>

          {/* Job Analytics Tab */}
          {activeTab === 'jobs' && jobAnalytics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                        <p className="text-3xl font-bold text-gray-900">{jobAnalytics.totalJobs}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                        <p className="text-3xl font-bold text-green-600">{jobAnalytics.activeJobs}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Hourly Rate</p>
                        <p className="text-3xl font-bold text-purple-600">${jobAnalytics.avgHourlyRate}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Apps/Job</p>
                        <p className="text-3xl font-bold text-orange-600">{jobAnalytics.avgApplicationsPerJob}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Job Type and Skill Level Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Types Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {jobAnalytics.topJobTypes.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">{item.type}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(item.count / jobAnalytics.totalJobs) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Skill Level Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {jobAnalytics.topSkillLevels.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">{item.level}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(item.count / jobAnalytics.totalJobs) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Location and Urgency Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Location Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {jobAnalytics.locationStats.map((item, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{item.location}</span>
                            <span className="text-sm text-gray-500">{item.jobCount} jobs</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Avg Rate: ${item.avgRate}/hour</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Urgency Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {jobAnalytics.urgencyStats.map((item, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{item.urgency}</span>
                            <span className="text-sm text-gray-500">{item.count} jobs</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Avg Fill Time: {item.avgFillTime} days</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Application Analytics Tab */}
          {activeTab === 'applications' && appAnalytics && (
            <>
              {/* Application Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Applications</p>
                        <p className="text-3xl font-bold text-blue-600">{appAnalytics.totalApplications}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-3xl font-bold text-yellow-600">{appAnalytics.pendingApplications}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Accepted</p>
                        <p className="text-3xl font-bold text-green-600">{appAnalytics.acceptedApplications}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Acceptance Rate</p>
                        <p className="text-3xl font-bold text-purple-600">{appAnalytics.acceptanceRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Application Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Trends (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appAnalytics.dailyStats.slice(0, 10).map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{new Date(stat.date).toLocaleDateString()}</span>
                        <div className="flex space-x-4">
                          <span className="text-sm text-gray-600">Applications: {stat.applications}</span>
                          <span className="text-sm text-green-600">Accepted: {stat.accepted}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
