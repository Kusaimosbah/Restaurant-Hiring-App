'use client';

import { useSession } from 'next-auth/react';

export default function JobSeekerProfile() {
  const { data: session } = useSession();

  // This is just a placeholder component that will be implemented later
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Job Seeker Profile</h1>
      <div className="bg-yellow-50 p-4 rounded-md">
        <p className="text-yellow-700">
          Job Seeker Profile will be implemented in a future phase.
        </p>
      </div>
    </div>
  );
}
