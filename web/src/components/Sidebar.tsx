'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  UserIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  StarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Training',
      href: '/training',
      icon: AcademicCapIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Jobs',
      href: '/dashboard/jobs',
      icon: BriefcaseIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Applications',
      href: '/dashboard/applications',
      icon: DocumentTextIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Workers',
      href: '/dashboard/workers',
      icon: UserGroupIcon,
      roles: ['RESTAURANT_OWNER']
    },
    {
      name: 'Messages',
      href: '/dashboard/messages',
      icon: ChatBubbleLeftRightIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: ChartBarIcon,
      roles: ['RESTAURANT_OWNER']
    },
    {
      name: 'Schedule',
      href: '/dashboard/schedule',
      icon: CalendarIcon,
      roles: ['WORKER']
    },
    {
      name: 'Tasks',
      href: '/dashboard/tasks',
      icon: ClipboardDocumentCheckIcon,
      roles: ['WORKER']
    },
    {
      name: 'Activity',
      href: '/dashboard/activity',
      icon: ClipboardDocumentCheckIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Reviews',
      href: '/dashboard/reviews',
      icon: StarIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Stats',
      href: '/dashboard/stats',
      icon: ChartBarIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications',
      icon: BellIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    },
    {
      name: 'Profile',
      href: isAdmin ? '/dashboard/profile' : '/dashboard/profile/worker',
      icon: UserIcon,
      roles: ['RESTAURANT_OWNER', 'WORKER']
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    !session?.user?.role || item.roles.includes(session.user.role)
  );

  return (
    <div className="hidden lg:block h-full w-64 bg-gray-100 sidebar-container">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-600">Restaurant Hiring</h1>
          <p className="text-sm text-gray-500">Admin Panel</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-2 rounded-md text-sm ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 text-xs text-gray-500">
          <p>© 2025 Restaurant Hiring</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  );
}