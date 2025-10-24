'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import CalendarWidget from '@/components/ui/CalendarWidget';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

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

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'shift' | 'availability' | 'time-off' | 'training';
  status: 'scheduled' | 'confirmed' | 'pending' | 'cancelled';
  location?: string;
  description?: string;
}

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function EnhancedSchedulePage() {
  return <EnhancedScheduleContent />;
}

function EnhancedScheduleContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'availability'>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
    loadScheduleData();
  }, [session, status, router, isAdmin]);

  const loadScheduleData = async () => {
    try {
      // Load schedule items (existing functionality)
      const mockSchedule: ScheduleItem[] = [
        {
          id: '1',
          date: '2024-12-23',
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
          date: '2024-12-25',
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
          status: 'CONFIRMED'
        },
        {
          id: '3',
          date: '2024-12-27',
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
          status: 'PENDING'
        }
      ];

      // Convert schedule items to calendar events
      const events: CalendarEvent[] = [
        ...mockSchedule.map(item => ({
          id: item.id,
          title: item.job.title,
          startTime: item.startTime,
          endTime: item.endTime,
          date: item.date,
          type: 'shift' as const,
          status: item.status.toLowerCase() as 'scheduled' | 'confirmed' | 'pending',
          location: item.job.restaurant.name,
          description: `${item.job.title} at ${item.job.restaurant.name}`
        })),
        // Add some availability slots
        {
          id: 'avail-1',
          title: 'Available',
          startTime: '10:00',
          endTime: '18:00',
          date: '2024-12-24',
          type: 'availability',
          status: 'confirmed'
        },
        {
          id: 'avail-2',
          title: 'Available',
          startTime: '12:00',
          endTime: '20:00',
          date: '2024-12-26',
          type: 'availability',
          status: 'confirmed'
        },
        // Add training event
        {
          id: 'training-1',
          title: 'Food Safety Training',
          startTime: '09:00',
          endTime: '11:00',
          date: '2024-12-30',
          type: 'training',
          status: 'scheduled',
          location: 'Training Center'
        }
      ];

      // Mock availability data
      const mockAvailability: AvailabilitySlot[] = [
        { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isActive: true },
        { id: '2', dayOfWeek: 2, startTime: '10:00', endTime: '18:00', isActive: true },
        { id: '3', dayOfWeek: 3, startTime: '14:00', endTime: '22:00', isActive: true },
        { id: '4', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isActive: true },
      ];

      setSchedule(mockSchedule);
      setCalendarEvents(events);
      setAvailability(mockAvailability);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load schedule:', error);
      setLoading(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
    // Could open a modal to add availability or request time off
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const toggleAvailability = (id: string) => {
    setAvailability(prev => 
      prev.map(slot => 
        slot.id === id ? { ...slot, isActive: !slot.isActive } : slot
      )
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="bg-gray-200 h-64 rounded-lg"></div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
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
          title="Schedule & Availability"
          subtitle="Manage your work schedule and availability preferences"
        />
        
        <div className="p-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calendar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
                Calendar View
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'availability'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClockIcon className="w-4 h-4 inline mr-2" />
                Availability
              </button>
            </nav>
          </div>

          {/* Calendar View */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <CalendarWidget
                events={calendarEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                view="month"
                editable={true}
                className="mb-6"
              />

              {/* Selected Event Details */}
              {selectedEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Event Details
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedEvent.title}</h4>
                        <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          {selectedEvent.startTime} - {selectedEvent.endTime}
                        </div>
                        {selectedEvent.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPinIcon className="w-4 h-4 mr-2" />
                            {selectedEvent.location}
                          </div>
                        )}
                        <div className="flex items-center text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            selectedEvent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* List View */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {schedule.length > 0 ? (
                schedule.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{item.job.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{item.job.restaurant.name}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center">
                              <CalendarDaysIcon className="w-4 h-4 mr-2 text-gray-400" />
                              <div>
                                <p className="font-medium">{item.day}</p>
                                <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                              <div>
                                <p className="font-medium">{item.startTime} - {item.endTime}</p>
                                <p className="text-xs text-gray-500">
                                  {Math.round((new Date(`2000-01-01 ${item.endTime}`).getTime() - 
                                              new Date(`2000-01-01 ${item.startTime}`).getTime()) / 3600000)} hours
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                              <div>
                                <p className="font-medium">Location</p>
                                <p className="text-xs text-gray-500">{item.job.restaurant.address}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end space-x-2">
                              {item.status === 'PENDING' && (
                                <>
                                  <Button size="sm" variant="outline">
                                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <XCircleIcon className="w-4 h-4 mr-1" />
                                    Decline
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No shifts scheduled</h3>
                    <p className="text-gray-600 mb-4">
                      Apply to jobs to get scheduled for shifts, or check back later for updates.
                    </p>
                    <Button onClick={() => router.push('/dashboard/jobs')}>
                      Browse Jobs
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Availability Management */}
          {activeTab === 'availability' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Availability</CardTitle>
                  <p className="text-sm text-gray-600">
                    Set your regular availability for each day of the week
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {availability.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <input
                            type="checkbox"
                            checked={slot.isActive}
                            onChange={() => toggleAvailability(slot.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {getDayName(slot.dayOfWeek)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={slot.startTime}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            disabled={!slot.isActive}
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            disabled={!slot.isActive}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t flex justify-between">
                    <Button variant="outline">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Time Slot
                    </Button>
                    <Button>
                      Save Availability
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <XCircleIcon className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Request Time Off</h4>
                        <p className="text-sm text-gray-600">Submit time off requests for future dates</p>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" variant="outline">
                      Submit Request
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <UserGroupIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Shift Swaps</h4>
                        <p className="text-sm text-gray-600">Trade shifts with other workers</p>
                      </div>
                    </div>
                    <Button className="mt-4 w-full" variant="outline">
                      Find Swaps
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}