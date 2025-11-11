import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import JobMatchingDashboard from '@/components/JobMatchingDashboard';

export const metadata = {
  title: 'Job Matching - Restaurant Hiring Platform',
  description: 'AI-powered job matching with comprehensive scoring analysis',
};

interface PageProps {
  searchParams: {
    jobId?: string;
    workerId?: string;
    mode?: 'worker-matches' | 'job-matches';
  };
}

export default async function JobMatchingPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { jobId, workerId, mode = 'worker-matches' } = searchParams;

  // Determine default mode based on user role
  const defaultMode = session.user.role === 'RESTAURANT_OWNER' ? 'worker-matches' : 'job-matches';
  const actualMode = mode || defaultMode;

  // Validate access permissions
  if (actualMode === 'worker-matches' && session.user.role !== 'RESTAURANT_OWNER') {
    redirect('/dashboard');
  }

  if (actualMode === 'job-matches' && !session.user.workerProfile && session.user.role === 'WORKER') {
    redirect('/dashboard');
  }

  // Get IDs based on mode and user
  let targetJobId = jobId;
  let targetWorkerId = workerId;

  if (actualMode === 'job-matches' && session.user.role === 'WORKER') {
    targetWorkerId = session.user.workerProfile?.id;
  }

  if (!targetJobId && !targetWorkerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Job Matching System</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please specify a job ID or worker ID to view matches
          </p>
          <div className="mt-4 flex space-x-3 justify-center">
            <a
              href="/dashboard/jobs"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View Jobs
            </a>
            {session.user.role === 'RESTAURANT_OWNER' && (
              <a
                href="/dashboard/workers"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Workers
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JobMatchingDashboard
        jobId={targetJobId}
        workerId={targetWorkerId}
        mode={actualMode}
      />
    </div>
  );
}