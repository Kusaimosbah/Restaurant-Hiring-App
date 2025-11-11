'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { WorkflowDashboard } from '@/components/WorkflowDashboard';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

export default function WorkflowsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user is a restaurant owner
    if (session.user.role !== 'RESTAURANT_OWNER') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'RESTAURANT_OWNER') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="Workflow Automation"
          subtitle="Automate your hiring processes with intelligent workflows"
        />
        
        <div className="p-6">
          <WorkflowDashboard />
        </div>
      </div>
    </div>
  );
}