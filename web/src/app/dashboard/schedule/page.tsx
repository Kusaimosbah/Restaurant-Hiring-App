'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface ScheduleItem {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  job: {
    title: string;
    restaurant: {
      name: string;
      address: string;
    };
  };
  status: string;
}

export default function SchedulePage() {
  return <SchedulePageContent />;
}

function SchedulePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (isAdmin) {
      router.push('/dashboard');
      return;
    }
    loadSchedule();
  }, [session, status, router, isAdmin]);

  const loadSchedule = async () => {
    try {
      // Mock schedule data for demonstration
      const mockSchedule: ScheduleItem[] = [
        {
          id: '1',
          date: '2024-01-15',
          day: 'Monday',
          startTime: '09:00',
          endTime: '17:00',
          job: {
            title: 'Server',
            restaurant: {
              name: 'The Gourmet Bistro',
              address: '123 Main St'
            }
          },
          status: 'SCHEDULED'
        },
        {
          id: '2',
          date: '2024-01-17',
          day: 'Wednesday',
          startTime: '14:00',
          endTime: '22:00',
          job: {
            title: 'Server',
            restaurant: {
              name: 'The Gourmet Bistro',
              address: '123 Main St'
            }
          },
          status: 'SCHEDULED'
        },
        {
          id: '3',
          date: '2024-01-19',
          day: 'Friday',
          startTime: '09:00',
          endTime: '17:00',
          job: {
            title: 'Server',
            restaurant: {
              name: 'The Gourmet Bistro',
              address: '123 Main St'
            }
          },
          status: 'SCHEDULED'
        }
      ];
      
      setSchedule(mockSchedule);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateHours = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalHours = schedule.reduce((sum, item) => {
    return sum + calculateHours(item.startTime, item.endTime);
  }, 0);

  const upcomingShifts = schedule.filter(item => new Date(item.date) >= new Date());

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="My Schedule"
          subtitle="View your upcoming shifts and work schedule"
        />
        
        <div className="p-6">
          {/* Schedule Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">{upcomingShifts.length}</div>
                <div className="text-sm font-medium text-gray-900">Upcoming Shifts</div>
                <div className="text-xs text-gray-500">This week</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">{totalHours}</div>
                <div className="text-sm font-medium text-gray-900">Total Hours</div>
                <div className="text-xs text-gray-500">This week</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">$0.00</div>
                <div className="text-sm font-medium text-gray-900">Estimated Earnings</div>
                <div className="text-xs text-gray-500">This week</div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule List */}
          <Card>
            <CardHeader>
              <CardTitle>This Week's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {schedule.length > 0 ? (
                <div className="space-y-4">
                  {schedule.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.job.title}</h3>
                          <p className="text-sm text-gray-600">{item.job.restaurant.name}</p>
                          <p className="text-xs text-gray-500">{item.job.restaurant.address}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <p className="font-medium">{item.day}</p>
                          <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Start Time:</span>
                          <p className="font-medium">{item.startTime}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">End Time:</span>
                          <p className="font-medium">{item.endTime}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <p className="font-medium">{calculateHours(item.startTime, item.endTime)} hours</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No shifts scheduled yet.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Apply to jobs to get scheduled for shifts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Schedule Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Request Time Off</h4>
                  <p className="text-sm text-gray-600 mb-3">Submit a request for time off</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Submit Request
                  </button>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Swap Shifts</h4>
                  <p className="text-sm text-gray-600 mb-3">Trade shifts with other workers</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Find Swaps
                  </button>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                  <p className="text-sm text-gray-600 mb-3">Update your availability</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Update
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}