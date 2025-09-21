'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Session } from 'next-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  totalWorkers: number;
  activeWorkers: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'job' | 'worker';
  message: string;
  time: string;
}

interface DashboardClientProps {
  session: Session;
}

export default function DashboardClient({ session }: DashboardClientProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalWorkers: 0,
    activeWorkers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate API calls - replace with actual API calls
      setTimeout(() => {
        if (isAdmin) {
          setStats({
            totalJobs: 12,
            activeJobs: 8,
            totalApplications: 45,
            pendingApplications: 15,
            totalWorkers: 23,
            activeWorkers: 18,
          });
          setRecentActivity([
            {
              id: '1',
              type: 'application',
              message: 'John Doe applied for Kitchen Assistant position',
              time: '2 hours ago'
            },
            {
              id: '2',
              type: 'job',
              message: 'Server position was posted',
              time: '4 hours ago'
            },
            {
              id: '3',
              type: 'worker',
              message: 'Sarah Smith completed onboarding',
              time: '1 day ago'
            }
          ]);
        } else {
          setStats({
            totalJobs: 8,
            activeJobs: 6,
            totalApplications: 3,
            pendingApplications: 1,
            totalWorkers: 0,
            activeWorkers: 0,
          });
          setRecentActivity([
            {
              id: '1',
              type: 'application',
              message: 'You applied for Server position',
              time: '1 day ago'
            },
            {
              id: '2',
              type: 'application',
              message: 'Your application for Cook position was approved',
              time: '3 days ago'
            }
          ]);
        }
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = 'blue' }: { 
    title: string; 
    value: number; 
    subtitle: string; 
    color?: string 
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
        <div className="text-sm font-medium text-gray-900 mt-1">{title}</div>
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
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title={isAdmin ? 'Admin Dashboard' : 'Worker Dashboard'}
          subtitle={isAdmin ? 'Manage your restaurant operations' : 'Track your job applications and shifts'}
        />
        
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {isAdmin ? (
              <>
                <StatCard title="Total Jobs" value={stats.totalJobs} subtitle={`${stats.activeJobs} active`} color="blue" />
                <StatCard title="Applications" value={stats.totalApplications} subtitle={`${stats.pendingApplications} pending`} color="green" />
                <StatCard title="Workers" value={stats.totalWorkers} subtitle={`${stats.activeWorkers} active`} color="purple" />
              </>
            ) : (
              <>
                <StatCard title="Available Jobs" value={stats.activeJobs} subtitle="Jobs you can apply for" color="blue" />
                <StatCard title="My Applications" value={stats.totalApplications} subtitle={`${stats.pendingApplications} pending`} color="green" />
                <StatCard title="Profile Completion" value={85} subtitle="Complete your profile" color="yellow" />
              </>
            )}
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {isAdmin ? (
                    <>
                      <Button className="w-full justify-start">
                        + Post New Job
                      </Button>
                      <Button variant="secondary" className="w-full justify-start">
                        Review Applications ({stats.pendingApplications})
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Manage Workers
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        View Analytics
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="w-full justify-start">
                        Browse Jobs ({stats.activeJobs} available)
                      </Button>
                      <Button variant="secondary" className="w-full justify-start">
                        Update Profile
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        View My Applications
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Check Schedule
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'application' ? 'bg-green-500' :
                          activity.type === 'job' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Admin Features */}
          {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Application Rate</span>
                      <span className="text-sm font-medium">3.2 apps/job</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg. Hire Time</span>
                      <span className="text-sm font-medium">5.3 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Worker Retention</span>
                      <span className="text-sm font-medium">87%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Positions</span>
                      <span className="text-sm font-medium">{stats.activeJobs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Review {stats.pendingApplications} pending applications</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Schedule interviews for Server position</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Update job descriptions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Send welcome email to new hires</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Worker Specific Features */}
          {!isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Server Position</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cook Position</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Approved</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bartender Position</span>
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Interviewing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This Week's Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monday</span>
                      <span className="text-sm text-gray-600">9:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Tuesday</span>
                      <span className="text-sm text-gray-600">Off</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Wednesday</span>
                      <span className="text-sm text-gray-600">2:00 PM - 10:00 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Thursday</span>
                      <span className="text-sm text-gray-600">9:00 AM - 5:00 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}