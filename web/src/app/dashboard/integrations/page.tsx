import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import IntegrationHubDashboard from '@/components/IntegrationHubDashboard';

export const metadata = {
  title: 'Integration Hub - Restaurant Hiring Platform',
  description: 'Connect your restaurant with third-party services for seamless hiring operations',
};

export default async function IntegrationHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Only restaurant owners can access integration hub
  if (session.user.role !== 'RESTAURANT_OWNER') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <IntegrationHubDashboard />
    </div>
  );
}