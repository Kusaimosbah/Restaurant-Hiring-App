'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/Button';
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

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {session?.user?.name || session?.user?.email}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {session?.user?.role === 'RESTAURANT_OWNER' ? 'Admin' : 'Worker'}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center space-x-2"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}