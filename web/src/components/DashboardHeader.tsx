'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import NotificationIcon from './notifications/NotificationIcon';
import MobileNav from './dashboard/MobileNav';
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  const handleLogout = async () => {
    try {
      // Call our custom logout API first to clear refresh token
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // Clear any local storage that might have session data
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Then call NextAuth signOut which clears session and redirects
    await signOut({
      callbackUrl: '/',
      redirect: true
    });
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="lg:hidden mr-4">
              <MobileNav isAdmin={isAdmin} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:block">
              <NotificationIcon />
            </div>
            
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {session?.user?.name || session?.user?.email}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {isAdmin ? 'Admin' : 'Worker'}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-0 sm:space-x-2 px-2 sm:px-3"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}