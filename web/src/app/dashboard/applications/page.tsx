'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Application {
  id: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  job: {
    id: string;
    title: string;
    description: string;
    hourlyRate: number;
    startDate: string;
    endDate: string;
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
  };
  worker?: {
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
  };
}

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadApplications();
  }, [session, status, router]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      // For now, we'll use dummy data since we need to create API endpoints
      // In a real implementation, you would fetch from /api/applications
      setTimeout(() => {
        if (isAdmin) {
          setApplications([
            {
              id: '1',
              message: 'I have 3+ years of fine dining experience and would love to work at your restaurant.',
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              job: {
                id: 'job1',
                title: 'Server - Weekend Shifts',
                description: 'Weekend server position for busy restaurant',
                hourlyRate: 18.00,
                startDate: new Date('2025-01-15').toISOString(),
                endDate: new Date('2025-01-15').toISOString(),
                restaurant: {
                  id: 'rest1',
                  name: 'The Golden Fork',
                  address: '123 Main St'
                }
              },
              worker: {
                id: 'worker1',
                user: {
                  id: 'user1',
                  name: 'John Doe',
                  email: 'john@example.com'
                },
                bio: 'Experienced server with a passion for hospitality',
                skills: 'Customer service, POS systems, wine knowledge',
                experience: '3 years in fine dining',
                hourlyRate: 16.00
              }
            },
            {
              id: '2',
              message: 'I am available for kitchen work and have experience with prep and cooking.',
              status: 'PENDING',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              job: {
                id: 'job2',
                title: 'Kitchen Assistant',
                description: 'Help with food prep and kitchen operations',
                hourlyRate: 16.00,
                startDate: new Date('2025-01-20').toISOString(),
                endDate: new Date('2025-01-20').toISOString(),
                restaurant: {
                  id: 'rest1',
                  name: 'The Golden Fork',
                  address: '123 Main St'
                }
              },
              worker: {
                id: 'worker2',
                user: {
                  id: 'user2',
                  name: 'Jane Smith',
                  email: 'jane@example.com'
                },
                bio: 'Hardworking kitchen assistant',
                skills: 'Food prep, cleaning, teamwork',
                experience: '2 years in kitchen operations',
                hourlyRate: 15.00
              }
            }
          ]);
        } else {
          setApplications([
            {
              id: '1',
              message: 'I have 3+ years of fine dining experience and would love to work at your restaurant.',
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              job: {
                id: 'job1',
                title: 'Server - Weekend Shifts',
                description: 'Weekend server position for busy restaurant',
                hourlyRate: 18.00,
                startDate: new Date('2025-01-15').toISOString(),
                endDate: new Date('2025-01-15').toISOString(),
                restaurant: {
                  id: 'rest1',
                  name: 'The Golden Fork',
                  address: '123 Main St'
                }
              }
            },
            {
              id: '2',
              message: 'Looking forward to contributing to your team.',
              status: 'ACCEPTED',
              createdAt: new Date(Date.now() - 172800000).toISOString(),
              job: {
                id: 'job2',
                title: 'Cook Position',
                description: 'Full-time cook position',
                hourlyRate: 20.00,
                startDate: new Date('2025-01-10').toISOString(),
                endDate: new Date('2025-01-10').toISOString(),
                restaurant: {
                  id: 'rest2',
                  name: 'Bistro Central',
                  address: '456 Oak Ave'
                }
              }
            }
          ]);
        }
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading applications:', error);
      setError('Failed to load applications');
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      // This would be an API call in a real implementation
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status } : app
        )
      );
      alert(`Application ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          title={isAdmin ? 'Application Management' : 'My Applications'}
          subtitle={isAdmin ? 'Review and manage job applications' : 'Track your job application status'}
        />
        
        <div className="p-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {applications.filter(app => app.status === 'PENDING').length}
                    </p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold text-green-600">
                      {applications.filter(app => app.status === 'ACCEPTED').length}
                    </p>
                  </div>
                  <CheckIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <Button variant="outline" onClick={loadApplications} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Applications List */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isAdmin ? 'Recent Applications' : 'Your Applications'}
            </h2>
            
            {applications.length > 0 ? (
              <div className="grid gap-4">
                {applications.map((application) => (
                  <Card key={application.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {application.job.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span>{application.job.restaurant.name}</span>
                            <span>${application.job.hourlyRate}/hour</span>
                            <span>Applied {formatDate(application.createdAt)}</span>
                          </div>

                          {isAdmin && application.worker && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-3">
                              <div className="flex items-center space-x-3 mb-2">
                                <UserIcon className="h-5 w-5 text-gray-500" />
                                <div>
                                  <p className="font-medium text-gray-900">{application.worker.user.name}</p>
                                  <p className="text-sm text-gray-600">{application.worker.user.email}</p>
                                </div>
                              </div>
                              
                              {application.worker.bio && (
                                <p className="text-sm text-gray-700 mb-2">{application.worker.bio}</p>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {application.worker.skills && (
                                  <div>
                                    <span className="font-medium text-gray-900">Skills: </span>
                                    <span className="text-gray-600">{application.worker.skills}</span>
                                  </div>
                                )}
                                {application.worker.experience && (
                                  <div>
                                    <span className="font-medium text-gray-900">Experience: </span>
                                    <span className="text-gray-600">{application.worker.experience}</span>
                                  </div>
                                )}
                              </div>
                              
                              {application.worker.hourlyRate && (
                                <div className="mt-2 text-sm">
                                  <span className="font-medium text-gray-900">Expected Rate: </span>
                                  <span className="text-gray-600">${application.worker.hourlyRate}/hour</span>
                                </div>
                              )}
                            </div>
                          )}

                          {application.message && (
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-900 mb-1">Application Message:</h4>
                              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                                {application.message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {isAdmin && application.status === 'PENDING' && (
                        <div className="flex space-x-2 pt-4 border-t border-gray-200">
                          <Button
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'ACCEPTED')}
                            className="flex items-center space-x-1"
                          >
                            <CheckIcon className="h-4 w-4" />
                            <span>Accept</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'REJECTED')}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                            <span>Reject</span>
                          </Button>
                          <Button variant="outline" size="sm">
                            Contact Applicant
                          </Button>
                        </div>
                      )}

                      {!isAdmin && (
                        <div className="pt-4 border-t border-gray-200">
                          <Button variant="outline" size="sm">
                            View Job Details
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isAdmin ? 'No applications received yet' : 'No applications submitted yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isAdmin 
                    ? 'Applications will appear here when workers apply to your jobs.' 
                    : 'Start applying to jobs to see your applications here.'
                  }
                </p>
                {!isAdmin && (
                  <Button>
                    Browse Available Jobs
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}