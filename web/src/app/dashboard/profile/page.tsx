'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  UserIcon,
  PencilIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'RESTAURANT_OWNER' | 'WORKER';
}

interface RestaurantProfile {
  id: string;
  name: string;
  address: string;
  phone?: string;
  description?: string;
  cuisineType?: string;
}

interface WorkerProfile {
  id: string;
  bio?: string;
  skills?: string;
  experience?: string;
  hourlyRate?: number;
  availabilitySlots: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadProfile();
  }, [session, status, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // For now, we'll use dummy data since we need to create API endpoints
      setTimeout(() => {
        setUserProfile({
          id: session?.user?.id || '1',
          name: session?.user?.name || 'John Doe',
          email: session?.user?.email || 'john@example.com',
          role: session?.user?.role as 'RESTAURANT_OWNER' | 'WORKER' || 'WORKER',
        });

        if (isAdmin) {
          setRestaurantProfile({
            id: '1',
            name: 'The Golden Fork',
            address: '123 Main Street, Downtown',
            phone: '+1 (555) 123-4567',
            description: 'Fine dining restaurant specializing in contemporary American cuisine with a focus on locally sourced ingredients.',
            cuisineType: 'Contemporary American',
          });
        } else {
          setWorkerProfile({
            id: '1',
            bio: 'Experienced server with a passion for hospitality and creating memorable dining experiences for guests.',
            skills: 'Customer service, POS systems, wine knowledge, conflict resolution, team collaboration',
            experience: '3+ years in fine dining, 2 years in casual dining, certified in food safety',
            hourlyRate: 18.00,
            availabilitySlots: [
              { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
              { id: '2', dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
              { id: '3', dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
              { id: '4', dayOfWeek: 5, startTime: '18:00', endTime: '23:00' },
              { id: '5', dayOfWeek: 6, startTime: '18:00', endTime: '23:00' },
            ],
          });
        }
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // This would be an API call in a real implementation
      alert('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
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
          title="Profile Management"
          subtitle="Manage your profile information and settings"
        />
        
        <div className="p-6 max-w-4xl">
          {/* User Profile Card */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
                className="flex items-center space-x-1"
              >
                <PencilIcon className="h-4 w-4" />
                <span>{editing ? 'Cancel' : 'Edit'}</span>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={userProfile?.name || ''}
                        onChange={(e) => setUserProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{userProfile?.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{userProfile?.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-gray-900 capitalize">
                      {userProfile?.role?.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>
              
              {editing && (
                <div className="mt-6 flex space-x-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Restaurant Profile (Admin Only) */}
          {isAdmin && restaurantProfile && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BriefcaseIcon className="h-5 w-5" />
                  <span>Restaurant Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Restaurant Name</label>
                      {editing ? (
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={restaurantProfile.name}
                          onChange={(e) => setRestaurantProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{restaurantProfile.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Address</label>
                      {editing ? (
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={2}
                          value={restaurantProfile.address}
                          onChange={(e) => setRestaurantProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                        />
                      ) : (
                        <div className="mt-1 flex items-center space-x-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">{restaurantProfile.address}</p>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      {editing ? (
                        <input
                          type="tel"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={restaurantProfile.phone || ''}
                          onChange={(e) => setRestaurantProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        />
                      ) : (
                        <div className="mt-1 flex items-center space-x-2">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">{restaurantProfile.phone || 'Not provided'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Cuisine Type</label>
                      {editing ? (
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          value={restaurantProfile.cuisineType || ''}
                          onChange={(e) => setRestaurantProfile(prev => prev ? { ...prev, cuisineType: e.target.value } : null)}
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{restaurantProfile.cuisineType || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      {editing ? (
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={4}
                          value={restaurantProfile.description || ''}
                          onChange={(e) => setRestaurantProfile(prev => prev ? { ...prev, description: e.target.value } : null)}
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{restaurantProfile.description || 'No description provided'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Worker Profile (Worker Only) */}
          {!isAdmin && workerProfile && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5" />
                    <span>Professional Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Bio</label>
                      {editing ? (
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          value={workerProfile.bio || ''}
                          onChange={(e) => setWorkerProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{workerProfile.bio || 'No bio provided'}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Skills</label>
                        {editing ? (
                          <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                            value={workerProfile.skills || ''}
                            onChange={(e) => setWorkerProfile(prev => prev ? { ...prev, skills: e.target.value } : null)}
                          />
                        ) : (
                          <p className="mt-1 text-gray-900">{workerProfile.skills || 'No skills listed'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Experience</label>
                        {editing ? (
                          <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={3}
                            value={workerProfile.experience || ''}
                            onChange={(e) => setWorkerProfile(prev => prev ? { ...prev, experience: e.target.value } : null)}
                          />
                        ) : (
                          <p className="mt-1 text-gray-900">{workerProfile.experience || 'No experience listed'}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Expected Hourly Rate</label>
                      {editing ? (
                        <div className="mt-1 flex items-center space-x-2">
                          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            step="0.50"
                            min="0"
                            className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={workerProfile.hourlyRate || ''}
                            onChange={(e) => setWorkerProfile(prev => prev ? { ...prev, hourlyRate: parseFloat(e.target.value) } : null)}
                          />
                          <span className="text-gray-600">per hour</span>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center space-x-2">
                          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">
                            ${workerProfile.hourlyRate?.toFixed(2) || 'Not specified'}/hour
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5" />
                    <span>Availability Schedule</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const slot = workerProfile.availabilitySlots.find(s => s.dayOfWeek === index);
                      return (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium text-gray-700 w-24">{day}</span>
                          {slot ? (
                            <div className="flex items-center space-x-2 text-sm text-gray-900">
                              <span>{slot.startTime} - {slot.endTime}</span>
                              {editing && (
                                <Button variant="outline" size="sm">
                                  Edit
                                </Button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">Not available</span>
                              {editing && (
                                <Button variant="outline" size="sm">
                                  Add
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {editing && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button variant="outline" size="sm">
                        Add Availability Slot
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}