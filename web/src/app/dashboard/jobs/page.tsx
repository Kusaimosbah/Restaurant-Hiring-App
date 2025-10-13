'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  hourlyRate: number;
  startDate: string;
  endDate: string;
  status: string;
  maxWorkers: number;
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
  return <JobsPageContent />;
}

function JobsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    hourlyRate: 0,
    startDate: '',
    endDate: '',
    maxWorkers: 1
  });

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
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newJob,
          startDate: new Date(newJob.startDate).toISOString(),
          endDate: new Date(newJob.endDate).toISOString(),
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewJob({
          title: '',
          description: '',
          requirements: '',
          hourlyRate: 0,
          startDate: '',
          endDate: '',
          maxWorkers: 1
        });
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        loadJobs();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Failed to apply to job:', error);
      alert('Failed to apply to job');
    }
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title={isAdmin ? 'Manage Jobs' : 'Available Jobs'}
          subtitle={isAdmin ? 'Create and manage job postings' : 'Browse and apply to jobs'}
        />
        
        <div className="p-6">
          {isAdmin && (
            <div className="mb-6">
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                {showCreateForm ? 'Cancel' : '+ Post New Job'}
              </Button>
            </div>
          )}

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Job</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newJob.hourlyRate}
                        onChange={(e) => setNewJob({ ...newJob, hourlyRate: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirements
                    </label>
                    <textarea
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newJob.startDate}
                        onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newJob.endDate}
                        onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Workers
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newJob.maxWorkers}
                        onChange={(e) => setNewJob({ ...newJob, maxWorkers: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit">Create Job</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.restaurant.name} • {job.restaurant.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">${job.hourlyRate}/hour</p>
                        <p className="text-sm text-gray-500">{job._count.applications} applications</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{job.description}</p>
                    
                    {job.requirements && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Requirements:</h4>
                        <p className="text-sm text-gray-600">{job.requirements}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>Start: {new Date(job.startDate).toLocaleDateString()}</span>
                      <span>End: {new Date(job.endDate).toLocaleDateString()}</span>
                      <span>Positions: {job.maxWorkers}</span>
                    </div>
                    
                    {!isAdmin && (
                      <Button onClick={() => handleApplyToJob(job.id)} className="w-full">
                        Apply Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">
                    {isAdmin ? 'No jobs posted yet. Create your first job!' : 'No jobs available at the moment.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}