'use client';

import { useState } from 'react';
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
  AcademicCapIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function MobileSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="lg:hidden">
      <button 
        onClick={() => setIsOpen(true)}
        className="p-3 text-gray-700 focus:outline-none"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-gray-800 bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div 
            className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h1 className="text-xl font-semibold text-gray-600">Restaurant Hiring</h1>
                <p className="text-sm text-gray-500">Admin Panel</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="overflow-y-auto py-4">
              <ul className="space-y-1 px-2">
                {filteredNavItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-md ${
                        isActive(item.href)
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            
            <div className="p-4 text-xs text-gray-500 border-t">
              <p>© 2025 Restaurant Hiring</p>
              <p>v1.0.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}