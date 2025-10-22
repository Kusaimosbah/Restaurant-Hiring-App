'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  PlusIcon,
  DocumentMagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  path: string;
  badge?: number;
  highlight?: boolean;
}

interface QuickActionsProps {
  isAdmin: boolean;
  pendingApplications?: number;
  activeJobs?: number;
  onNavigate: (path: string) => void;
  title?: string;
}

export default function QuickActions({
  isAdmin,
  pendingApplications = 0,
  activeJobs = 0,
  onNavigate,
  title = 'Quick Actions',
}: QuickActionsProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const adminActions: ActionItem[] = [
    {
      id: 'post-job',
      label: 'Post New Job',
      icon: <PlusIcon className="h-5 w-5" />,
      variant: 'primary',
      path: '/dashboard/jobs/new',
      highlight: true,
    },
    {
      id: 'review-applications',
      label: `Review Applications`,
      icon: <DocumentMagnifyingGlassIcon className="h-5 w-5" />,
      variant: 'secondary',
      path: '/dashboard/applications',
      badge: pendingApplications,
    },
    {
      id: 'manage-workers',
      label: 'Manage Workers',
      icon: <UserGroupIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/workers',
    },
    {
      id: 'view-analytics',
      label: 'View Analytics',
      icon: <ChartBarIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/analytics',
    },
    {
      id: 'update-profile',
      label: 'Update Business Profile',
      icon: <BuildingStorefrontIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/profile',
    },
    {
      id: 'manage-schedule',
      label: 'Manage Schedule',
      icon: <CalendarIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/schedule',
    },
  ];

  const workerActions: ActionItem[] = [
    {
      id: 'browse-jobs',
      label: `Browse Jobs`,
      icon: <MagnifyingGlassIcon className="h-5 w-5" />,
      variant: 'primary',
      path: '/dashboard/jobs',
      badge: activeJobs,
      highlight: true,
    },
    {
      id: 'update-profile',
      label: 'Update Profile',
      icon: <UserCircleIcon className="h-5 w-5" />,
      variant: 'secondary',
      path: '/dashboard/profile/worker',
    },
    {
      id: 'view-applications',
      label: 'My Applications',
      icon: <DocumentCheckIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/applications',
    },
    {
      id: 'check-schedule',
      label: 'Check Schedule',
      icon: <CalendarIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/schedule',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/messages',
    },
    {
      id: 'earnings',
      label: 'View Earnings',
      icon: <BanknotesIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/earnings',
    },
    {
      id: 'availability',
      label: 'Set Availability',
      icon: <ClockIcon className="h-5 w-5" />,
      variant: 'outline',
      path: '/dashboard/availability',
    },
  ];

  const actions = isAdmin ? adminActions : workerActions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              onClick={() => onNavigate(action.path)}
              className={`justify-start h-auto py-3 px-4 ${
                hoveredAction === action.id ? 'transform scale-[1.02] transition-transform' : ''
              } ${action.highlight ? 'ring-2 ring-offset-2 ring-indigo-500 ring-opacity-50' : ''}`}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
            >
              <div className="flex items-center w-full">
                <div className={`mr-3 ${action.variant === 'primary' ? 'text-white' : ''}`}>
                  {action.icon}
                </div>
                <span className="flex-grow">{action.label}</span>
                {action.badge !== undefined && action.badge > 0 && (
                  <span className={`
                    inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none 
                    rounded-full ml-2 
                    ${action.variant === 'primary' 
                      ? 'bg-white text-indigo-600' 
                      : 'bg-indigo-100 text-indigo-600'}
                  `}>
                    {action.badge}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
