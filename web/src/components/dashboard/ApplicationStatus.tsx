'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Application {
  id: string;
  position: string;
  restaurant?: string;
  status: 'pending' | 'approved' | 'rejected' | 'interviewing' | 'withdrawn';
  appliedDate: string;
  updatedDate?: string;
}

interface ApplicationStatusProps {
  applications: Application[];
  title?: string;
  loading?: boolean;
  onViewDetails?: (id: string) => void;
}

export default function ApplicationStatus({
  applications,
  title = 'Application Status',
  loading = false,
  onViewDetails,
}: ApplicationStatusProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
            Rejected
          </span>
        );
      case 'interviewing':
        return (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Interviewing
          </span>
        );
      case 'withdrawn':
        return (
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
            Withdrawn
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>
                <div className="animate-pulse h-6 w-16 bg-gray-200 rounded-full"></div>
              </div>
            ))
          ) : applications.length > 0 ? (
            applications.map((app) => (
              <div key={app.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">{app.position}</span>
                    {app.restaurant && (
                      <span className="text-xs text-gray-500">{app.restaurant}</span>
                    )}
                  </div>
                  {getStatusBadge(app.status)}
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    Applied: {formatDate(app.appliedDate)}
                    {app.updatedDate && app.status !== 'pending' && (
                      <> • Updated: {formatDate(app.updatedDate)}</>
                    )}
                  </span>
                  
                  {onViewDetails && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(app.id)}
                      className="text-xs h-7 px-2"
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No applications</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
