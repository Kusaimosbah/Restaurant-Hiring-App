'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface MobileNavProps {
  isAdmin: boolean;
}

export default function MobileNav({ isAdmin }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const adminNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { href: '/dashboard/jobs', label: 'Jobs', icon: <BriefcaseIcon className="h-5 w-5" /> },
    { href: '/dashboard/applications', label: 'Applications', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { href: '/dashboard/workers', label: 'Workers', icon: <UserGroupIcon className="h-5 w-5" /> },
    { href: '/dashboard/analytics', label: 'Analytics', icon: <ChartBarIcon className="h-5 w-5" /> },
    { href: '/dashboard/messages', label: 'Messages', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" /> },
    { href: '/dashboard/profile', label: 'Profile', icon: <UserCircleIcon className="h-5 w-5" /> },
  ];

  const workerNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { href: '/dashboard/jobs', label: 'Jobs', icon: <BriefcaseIcon className="h-5 w-5" /> },
    { href: '/dashboard/applications', label: 'Applications', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { href: '/dashboard/schedule', label: 'Schedule', icon: <CalendarIcon className="h-5 w-5" /> },
    { href: '/dashboard/messages', label: 'Messages', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" /> },
    { href: '/dashboard/profile/worker', label: 'Profile', icon: <UserCircleIcon className="h-5 w-5" /> },
  ];

  const navItems = isAdmin ? adminNavItems : workerNavItems;

  return (
    <div className="lg:hidden">
      {/* Mobile menu button */}
      <button
        type="button"
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        onClick={toggleMenu}
        aria-expanded={isOpen}
      >
        <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
        {isOpen ? (
          <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
        ) : (
          <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Mobile menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={closeMenu}
            aria-hidden="true"
          ></div>

          {/* Menu panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="pt-5 pb-4">
              <div className="flex items-center justify-between px-4">
                <div className="font-bold text-xl text-gray-900">
                  Restaurant Hiring
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  onClick={closeMenu}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-5 px-2 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center px-4 py-3 text-base font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={closeMenu}
                    >
                      <div
                        className={`mr-3 ${
                          isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-600'
                        }`}
                      >
                        {item.icon}
                      </div>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 group block">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">
                      {isAdmin ? 'Restaurant Owner' : 'Job Seeker'}
                    </p>
                    <p className="text-xs font-medium text-gray-500">
                      {isAdmin ? 'Admin Dashboard' : 'Worker Dashboard'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
