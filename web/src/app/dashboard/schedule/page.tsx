'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface ScheduleShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  job: {
    id: string;
    title: string;
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
    hourlyRate: number;
  };
  estimatedEarnings: number;
  actualHours?: number;
  actualEarnings?: number;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shifts, setShifts] = useState<ScheduleShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user?.role !== 'WORKER') {
      router.push('/dashboard');
      return;
    }
    loadSchedule();
  }, [session, status, router]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      // For now, we'll use dummy data since we need to create API endpoints
      setTimeout(() => {
        const today = new Date();
        setShifts([
          {
            id: '1',
            date: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            startTime: '09:00',
            endTime: '17:00',
            status: 'CONFIRMED',
            job: {
              id: 'job1',
              title: 'Server - Weekend Shift',
              restaurant: {
                id: 'rest1',
                name: 'The Golden Fork',
                address: '123 Main Street'
              },
              hourlyRate: 18.00
            },
            estimatedEarnings: 144.00,
          },
          {
            id: '2',
            date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
            startTime: '14:00',
            endTime: '22:00',
            status: 'PENDING',
            job: {
              id: 'job2',
              title: 'Kitchen Assistant',
              restaurant: {
                id: 'rest2',
                name: 'Bistro Central',
                address: '456 Oak Avenue'
              },
              hourlyRate: 16.00
            },
            estimatedEarnings: 128.00,
          },
          {
            id: '3',
            date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
            startTime: '18:00',
            endTime: '23:00',
            status: 'CONFIRMED',
            job: {
              id: 'job3',
              title: 'Bartender',
              restaurant: {
                id: 'rest3',
                name: 'The Night Owl',
                address: '789 Pine Street'
              },
              hourlyRate: 22.00
            },
            estimatedEarnings: 110.00,
          },
          {
            id: '4',
            date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            startTime: '10:00',
            endTime: '18:00',
            status: 'COMPLETED',
            job: {
              id: 'job4',
              title: 'Server',
              restaurant: {
                id: 'rest1',
                name: 'The Golden Fork',
                address: '123 Main Street'
              },
              hourlyRate: 18.00
            },
            estimatedEarnings: 144.00,
            actualHours: 8,
            actualEarnings: 144.00,
          },
          {
            id: '5',
            date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last week
            startTime: '12:00',
            endTime: '20:00',
            status: 'COMPLETED',
            job: {
              id: 'job5',
              title: 'Host',
              restaurant: {
                id: 'rest4',
                name: 'Garden Cafe',
                address: '321 Elm Street'
              },
              hourlyRate: 15.00
            },
            estimatedEarnings: 120.00,
            actualHours: 8,
            actualEarnings: 120.00,
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setError('Failed to load schedule');
      setLoading(false);
    }
  };

  const updateShiftStatus = async (shiftId: string, status: 'CONFIRMED' | 'CANCELLED') => {
    try {
      setShifts(prev => 
        prev.map(shift => 
          shift.id === shiftId ? { ...shift, status } : shift
        )
      );
      alert(`Shift ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Error updating shift:', error);
      alert('Failed to update shift status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const getShiftsForDate = (date: Date) => {
    const dateString = date.toDateString();
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      return shiftDate.toDateString() === dateString;
    });
  };

  const upcomingShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    const today = new Date();
    return shiftDate >= today && (shift.status === 'CONFIRMED' || shift.status === 'PENDING');
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    const today = new Date();
    return shiftDate < today && shift.status === 'COMPLETED';
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const totalEarningsThisWeek = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    const weekDates = getWeekDates();
    const startOfWeek = weekDates[0];
    const endOfWeek = weekDates[6];
    return shiftDate >= startOfWeek && shiftDate <= endOfWeek && shift.status === 'COMPLETED';
  }).reduce((sum, shift) => sum + (shift.actualEarnings || 0), 0);

  const hoursThisWeek = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    const weekDates = getWeekDates();
    const startOfWeek = weekDates[0];
    const endOfWeek = weekDates[6];
    return shiftDate >= startOfWeek && shiftDate <= endOfWeek && shift.status === 'COMPLETED';
  }).reduce((sum, shift) => sum + (shift.actualHours || 0), 0);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
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
          title="My Schedule"
          subtitle="View and manage your work schedule"
        />
        
        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Week's Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{hoursThisWeek}h</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">This Week's Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">${totalEarningsThisWeek.toFixed(2)}</p>
                  </div>
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Shifts</p>
                    <p className="text-2xl font-bold text-gray-900">{upcomingShifts.length}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Toggle */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Schedule View</h2>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week View
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month View
              </Button>
            </div>
          </div>

          {/* Week View */}
          {viewMode === 'week' && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Week of {getWeekDates()[0].toLocaleDateString()}</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setDate(newDate.getDate() - 7);
                        setCurrentDate(newDate);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setDate(newDate.getDate() + 7);
                        setCurrentDate(newDate);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDates().map((date, index) => {
                    const dayShifts = getShiftsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={index} className={`p-3 border rounded-lg ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                        <div className="text-center mb-2">
                          <p className="text-xs text-gray-600">{DAYS_OF_WEEK[date.getDay()]}</p>
                          <p className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {date.getDate()}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          {dayShifts.map(shift => (
                            <div
                              key={shift.id}
                              className={`text-xs p-2 rounded ${getStatusColor(shift.status)}`}
                            >
                              <p className="font-medium">{shift.job.title}</p>
                              <p>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</p>
                            </div>
                          ))}
                          
                          {dayShifts.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">No shifts</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Shifts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingShifts.length > 0 ? (
                    upcomingShifts.map((shift) => (
                      <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{shift.job.title}</h4>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                              <MapPinIcon className="h-4 w-4" />
                              <span>{shift.job.restaurant.name}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
                            {shift.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(shift.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>${shift.estimatedEarnings.toFixed(2)} estimated</span>
                          </div>
                        </div>
                        
                        {shift.status === 'PENDING' && (
                          <div className="flex space-x-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => updateShiftStatus(shift.id, 'CONFIRMED')}
                              className="flex items-center space-x-1"
                            >
                              <CheckIcon className="h-4 w-4" />
                              <span>Accept</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateShiftStatus(shift.id, 'CANCELLED')}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                              <span>Decline</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No upcoming shifts scheduled</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Shifts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Shifts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentShifts.length > 0 ? (
                    recentShifts.map((shift) => (
                      <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{shift.job.title}</h4>
                            <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                              <MapPinIcon className="h-4 w-4" />
                              <span>{shift.job.restaurant.name}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shift.status)}`}>
                            {shift.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(shift.date)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>{shift.actualHours}h worked</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>${shift.actualEarnings?.toFixed(2)} earned</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No recent shifts completed</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}