'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface Application {
  id: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  appliedAt: string;
  respondedAt?: string;
  responseNote?: string;
  job: {
    id: string;
    title: string;
    hourlyRate: number;
    restaurant?: {
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
  };
}

export default function ApplicationsPage() {
  return <ApplicationsPageContent />;
}

function ApplicationsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

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
      const endpoint = isAdmin ? '/api/applications/manage' : '/api/applications/manage';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setLoading(false);
    }
  };

  const handleUpdateApplication = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED', responseNote?: string) => {
    try {
      const response = await fetch(`/api/applications/manage?id=${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, responseNote }),
      });

      if (response.ok) {
        loadApplications();
      }
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          title={isAdmin ? 'Application Management' : 'My Applications'}
          subtitle={isAdmin ? 'Review and manage job applications' : 'Track your job applications'}
        />
        
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {applications.length > 0 ? (
              applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{application.job.title}</h3>
                        {isAdmin && application.worker ? (
                          <p className="text-sm text-gray-600">
                            Applicant: {application.worker.user.name} ({application.worker.user.email})
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {application.job.restaurant?.name} • ${application.job.hourlyRate}/hour
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    
                    {application.message && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Application Message:</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{application.message}</p>
                      </div>
                    )}
                    
                    {application.responseNote && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Response:</h4>
                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">{application.responseNote}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>Applied: {new Date(application.appliedAt).toLocaleDateString()}</span>
                      {application.respondedAt && (
                        <span>Responded: {new Date(application.respondedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    {isAdmin && application.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleUpdateApplication(application.id, 'ACCEPTED', 'Congratulations! Your application has been accepted.')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Accept
                        </Button>
                        <Button 
                          onClick={() => handleUpdateApplication(application.id, 'REJECTED', 'Thank you for your interest. We have decided to proceed with other candidates.')}
                          variant="outline"
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">
                    {isAdmin ? 'No applications received yet.' : 'You haven\'t applied to any jobs yet.'}
                  </p>
                  {!isAdmin && (
                    <Button 
                      onClick={() => router.push('/dashboard/jobs')} 
                      className="mt-4"
                    >
                      Browse Jobs
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}