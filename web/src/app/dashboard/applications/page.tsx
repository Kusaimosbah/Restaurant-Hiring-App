'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

function ApplicationsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
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
      const response = await fetch('/api/applications/manage');
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <DashboardHeader title="Applications" subtitle="Loading applications..." />
          <div className="p-6">Loading...</div>
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
        
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600">Enhanced applications management coming soon...</p>
          </div>

          <Card>
            <CardContent className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-700 text-lg">
                    {isAdmin ? 'No applications found.' : 'You haven\'t applied to any jobs yet.'}
                  </p>
                  {!isAdmin && (
                    <Button 
                      onClick={() => router.push('/dashboard/jobs')} 
                      className="mt-4"
                    >
                      Browse Jobs
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {isAdmin ? 
                          (application.worker?.user?.name || 'Unknown Applicant') : 
                          application.job?.title
                        }
                      </h3>
                      <p className="text-sm text-gray-600">
                        Status: {application.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  return <ApplicationsPageContent />;
}
