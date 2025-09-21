'use client';

import { SessionProvider } from 'next-auth/react';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return (
    <SessionProvider>
      <DashboardClient />
    </SessionProvider>
  );
}