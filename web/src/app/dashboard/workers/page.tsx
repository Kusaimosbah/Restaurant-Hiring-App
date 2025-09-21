'use client';

import { useState, useEffect } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface Worker {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  bio?: string;
  experience?: string;
  skills: string[];
  hourlyRate?: number;
  availability?: string;
}

export default function WorkersPage() {
  return (
    <SessionProvider>
      <WorkersPageContent />
    </SessionProvider>
  );
}

function WorkersPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    loadWorkers();
  }, [session, status, router, isAdmin]);

  const loadWorkers = async () => {
    try {
      // For now, we'll show a placeholder since we don't have a workers API endpoint yet
      // In a real app, this would fetch from /api/workers
      setWorkers([]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load workers:', error);
      setLoading(false);
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
          title="Worker Management"
          subtitle="Manage your restaurant workers and applications"
        />
        
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {workers.length > 0 ? (
              workers.map((worker) => (
                <Card key={worker.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{worker.user.name}</h3>
                        <p className="text-sm text-gray-600">{worker.user.email}</p>
                      </div>
                      <div className="text-right">
                        {worker.hourlyRate && (
                          <p className="text-lg font-bold text-green-600">${worker.hourlyRate}/hour</p>
                        )}
                      </div>
                    </div>
                    
                    {worker.bio && (
                      <p className="text-gray-700 mb-3">{worker.bio}</p>
                    )}
                    
                    {worker.experience && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Experience:</h4>
                        <p className="text-sm text-gray-600">{worker.experience}</p>
                      </div>
                    )}
                    
                    {worker.skills.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {worker.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {worker.availability && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Availability:</span> {worker.availability}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">
                    No workers to display yet. Workers will appear here once they apply and are accepted for positions.
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