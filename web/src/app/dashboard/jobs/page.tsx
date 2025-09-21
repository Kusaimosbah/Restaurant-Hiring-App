'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  PlusIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  hourlyRate: number;
  startDate: string;
  endDate: string;
  maxWorkers: number;
  status: 'ACTIVE' | 'FILLED' | 'CANCELLED';
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
  _count: {
    applications: number;
  };
}

export default function JobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadJobs();
  }, [session, status, router]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
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

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isSameDay = start.toDateString() === end.toDateString();
    
    if (isSameDay) {
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const applyToJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          message: 'I am interested in this position.',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply to job');
      }

      alert('Application submitted successfully!');
      loadJobs(); // Reload to update application counts
    } catch (error) {
      console.error('Error applying to job:', error);
      alert(error instanceof Error ? error.message : 'Failed to apply to job');
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
          title={isAdmin ? 'Job Management' : 'Find Jobs'}
          subtitle={isAdmin ? 'Manage your job postings' : 'Browse available job opportunities'}
        />
        
        <div className="p-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isAdmin ? 'Your Job Postings' : 'Available Jobs'}
              </h2>
              <p className="text-gray-600 mt-1">
                {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} {isAdmin ? 'posted' : 'available'}
              </p>
            </div>
            
            {isAdmin && (
              <Button className="flex items-center space-x-2">
                <PlusIcon className="h-4 w-4" />
                <span>Post New Job</span>
              </Button>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <Button variant="outline" onClick={loadJobs} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Jobs Grid */}
          <div className="grid gap-6">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            job.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            job.status === 'FILLED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status}
                          </span>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{job.restaurant.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CurrencyDollarIcon className="h-4 w-4" />
                            <span>${job.hourlyRate}/hour</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <UsersIcon className="h-4 w-4" />
                            <span>Max {job.maxWorkers} worker{job.maxWorkers !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatDateRange(job.startDate, job.endDate)}</span>
                        </div>

                        <p className="text-gray-700 mb-3 line-clamp-3">
                          {job.description}
                        </p>

                        {job.requirements && (
                          <div className="mb-3">
                            <h4 className="font-medium text-gray-900 mb-1">Requirements:</h4>
                            <p className="text-sm text-gray-600">{job.requirements}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {job._count.applications} application{job._count.applications !== 1 ? 's' : ''}
                          </div>
                          
                          <div className="flex space-x-2">
                            {isAdmin ? (
                              <>
                                <Button variant="outline" size="sm">
                                  View Applications ({job._count.applications})
                                </Button>
                                <Button variant="outline" size="sm">
                                  Edit Job
                                </Button>
                              </>
                            ) : (
                              <>
                                {job.status === 'ACTIVE' && (
                                  <Button 
                                    size="sm"
                                    onClick={() => applyToJob(job.id)}
                                  >
                                    Apply Now
                                  </Button>
                                )}
                                <Button variant="outline" size="sm">
                                  View Details
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
              <div className="text-center py-12">
                <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isAdmin ? 'No jobs posted yet' : 'No jobs available'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isAdmin 
                    ? 'Start by posting your first job to attract workers.' 
                    : 'Check back later for new job opportunities.'
                  }
                </p>
                {isAdmin && (
                  <Button className="flex items-center space-x-2 mx-auto">
                    <PlusIcon className="h-4 w-4" />
                    <span>Post Your First Job</span>
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