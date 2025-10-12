'use client';

import BusinessProfile from '@/components/BusinessProfile';
import { useSession } from 'next-auth/react';
import JobSeekerProfile from '@/components/JobSeekerProfile';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Show the appropriate profile based on user role
  if (session?.user?.role === 'RESTAURANT_OWNER') {
    return <BusinessProfile />;
  } else if (session?.user?.role === 'WORKER') {
    // This will be implemented later
    return <div>Job Seeker Profile will be implemented here.</div>;
  }

  // Fallback for unauthenticated users
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-yellow-50 p-4 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800">Authentication Required</h3>
        <p className="mt-2 text-yellow-600">
          Please log in to view your profile.
        </p>
      </div>
    </div>
  );
}