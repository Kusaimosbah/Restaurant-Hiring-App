'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BriefcaseIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  const adminNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Jobs', href: '/dashboard/jobs', icon: BriefcaseIcon },
    { name: 'Applications', href: '/dashboard/applications', icon: DocumentTextIcon },
    { name: 'Workers', href: '/dashboard/workers', icon: UsersIcon },
    { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
  ];

  const workerNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Find Jobs', href: '/dashboard/jobs', icon: BriefcaseIcon },
    { name: 'My Applications', href: '/dashboard/applications', icon: DocumentTextIcon },
    { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Schedule', href: '/dashboard/schedule', icon: CalendarIcon },
    { name: 'Tasks', href: '/dashboard/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
  ];

  const navItems = isAdmin ? adminNavItems : workerNavItems;

  return (
    <div className={`bg-gray-100 text-gray-900 w-64 min-h-screen sidebar-container ${className}`}>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800">Restaurant Hiring</h1>
        <p className="text-gray-600 text-sm mt-1">
          {isAdmin ? 'Admin Panel' : 'Worker Portal'}
        </p>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${
                    isActive ? 'text-gray-900' : 'text-gray-600'
                  }`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}