'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  UsersIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  StarIcon,
  ClockIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

interface Worker {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  bio?: string;
  skills?: string;
  experience?: string;
  hourlyRate?: number;
  rating?: number;
  totalJobs?: number;
  availabilitySlots: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  lastActive?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

const DAYS_OF_WEEK = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
];

export default function WorkersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

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
    loadWorkers();
  }, [session, status, router]);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      // For now, we'll use dummy data since we need to create API endpoints
      setTimeout(() => {
        setWorkers([
          {
            id: '1',
            user: {
              id: 'user1',
              name: 'John Doe',
              email: 'john@example.com'
            },
            bio: 'Experienced server with a passion for hospitality and creating memorable dining experiences.',
            skills: 'Customer service, POS systems, wine knowledge, conflict resolution',
            experience: '3+ years in fine dining, 2 years in casual dining',
            hourlyRate: 18.00,
            rating: 4.8,
            totalJobs: 24,
            availabilitySlots: [
              { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
              { id: '2', dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
              { id: '3', dayOfWeek: 5, startTime: '18:00', endTime: '23:00' },
              { id: '4', dayOfWeek: 6, startTime: '18:00', endTime: '23:00' },
            ],
            lastActive: new Date(Date.now() - 3600000).toISOString(),
            status: 'ACTIVE'
          },
          {
            id: '2',
            user: {
              id: 'user2',
              name: 'Jane Smith',
              email: 'jane@example.com'
            },
            bio: 'Hardworking kitchen assistant with experience in fast-paced environments.',
            skills: 'Food prep, cleaning, teamwork, inventory management',
            experience: '2 years in kitchen operations, food safety certified',
            hourlyRate: 16.00,
            rating: 4.6,
            totalJobs: 18,
            availabilitySlots: [
              { id: '5', dayOfWeek: 0, startTime: '10:00', endTime: '18:00' },
              { id: '6', dayOfWeek: 3, startTime: '14:00', endTime: '22:00' },
              { id: '7', dayOfWeek: 4, startTime: '14:00', endTime: '22:00' },
            ],
            lastActive: new Date(Date.now() - 7200000).toISOString(),
            status: 'ACTIVE'
          },
          {
            id: '3',
            user: {
              id: 'user3',
              name: 'Mike Johnson',
              email: 'mike@example.com'
            },
            bio: 'Professional bartender with extensive cocktail knowledge and experience.',
            skills: 'Mixology, customer service, inventory management, cash handling',
            experience: '5+ years bartending, certified sommelier level 1',
            hourlyRate: 22.00,
            rating: 4.9,
            totalJobs: 35,
            availabilitySlots: [
              { id: '8', dayOfWeek: 4, startTime: '17:00', endTime: '02:00' },
              { id: '9', dayOfWeek: 5, startTime: '17:00', endTime: '02:00' },
              { id: '10', dayOfWeek: 6, startTime: '17:00', endTime: '02:00' },
            ],
            lastActive: new Date(Date.now() - 86400000).toISOString(),
            status: 'ACTIVE'
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading workers:', error);
      setError('Failed to load workers');
      setLoading(false);
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getAvailabilityString = (slots: Worker['availabilitySlots']) => {
    if (slots.length === 0) return 'No availability set';
    
    const daySlots = slots.map(slot => ({
      day: DAYS_OF_WEEK[slot.dayOfWeek],
      time: `${slot.startTime}-${slot.endTime}`
    }));
    
    return daySlots.map(slot => `${slot.day}`).join(', ');
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.skills?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || worker.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const contactWorker = (worker: Worker) => {
    // This would open email client or messaging system
    window.location.href = `mailto:${worker.user.email}`;
  };

  const toggleWorkerStatus = async (workerId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      setWorkers(prev => 
        prev.map(worker => 
          worker.id === workerId ? { ...worker, status: newStatus } : worker
        )
      );
      alert(`Worker status updated to ${newStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Error updating worker status:', error);
      alert('Failed to update worker status');
    }
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
          title="Worker Management"
          subtitle="Manage and review your worker database"
        />
        
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Workers</p>
                    <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
                  </div>
                  <UsersIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Workers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {workers.filter(w => w.status === 'ACTIVE').length}
                    </p>
                  </div>
                  <UserIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {(workers.reduce((sum, w) => sum + (w.rating || 0), 0) / workers.length).toFixed(1)}
                    </p>
                  </div>
                  <StarIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {workers.reduce((sum, w) => sum + (w.totalJobs || 0), 0)}
                    </p>
                  </div>
                  <BriefcaseIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search workers by name, email, or skills..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <Button variant="outline" onClick={loadWorkers} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Workers List */}
          <div className="space-y-4">
            {filteredWorkers.length > 0 ? (
              filteredWorkers.map((worker) => (
                <Card key={worker.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {worker.user.name}
                              </h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <EnvelopeIcon className="h-4 w-4" />
                                <span>{worker.user.email}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              worker.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              worker.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {worker.status}
                            </span>
                            
                            {worker.rating && (
                              <div className="flex items-center space-x-1">
                                <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-medium">{worker.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Experience</h4>
                            <p className="text-sm text-gray-600">
                              {worker.experience || 'Not specified'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Skills</h4>
                            <p className="text-sm text-gray-600">
                              {worker.skills || 'Not specified'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Availability</h4>
                            <p className="text-sm text-gray-600">
                              {getAvailabilityString(worker.availabilitySlots)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <CurrencyDollarIcon className="h-4 w-4" />
                              <span>${worker.hourlyRate?.toFixed(2) || 'Not set'}/hour</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <BriefcaseIcon className="h-4 w-4" />
                              <span>{worker.totalJobs || 0} jobs completed</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>Last active {formatLastActive(worker.lastActive || new Date().toISOString())}</span>
                            </div>
                          </div>
                        </div>

                        {worker.bio && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-1">Bio</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {worker.bio}
                            </p>
                          </div>
                        )}

                        <div className="flex space-x-2 pt-4 border-t border-gray-200">
                          <Button
                            size="sm"
                            onClick={() => contactWorker(worker)}
                            className="flex items-center space-x-1"
                          >
                            <EnvelopeIcon className="h-4 w-4" />
                            <span>Contact</span>
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            Job History
                          </Button>
                          
                          {worker.status === 'ACTIVE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleWorkerStatus(worker.id, 'SUSPENDED')}
                              className="text-red-600 hover:text-red-700"
                            >
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleWorkerStatus(worker.id, 'ACTIVE')}
                              className="text-green-600 hover:text-green-700"
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'ALL' ? 'No workers found' : 'No workers registered yet'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'ALL' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Workers will appear here when they register and apply to your jobs.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}