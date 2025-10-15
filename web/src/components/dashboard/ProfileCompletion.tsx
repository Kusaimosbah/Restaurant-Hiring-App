'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ProfileSection {
  id: string;
  name: string;
  completed: boolean;
  requiredForApplying?: boolean;
  link: string;
}

interface ProfileCompletionProps {
  sections: ProfileSection[];
  completionPercentage: number;
  title?: string;
  loading?: boolean;
  onNavigate?: (link: string) => void;
}

export default function ProfileCompletion({
  sections,
  completionPercentage,
  title = 'Profile Completion',
  loading = false,
  onNavigate,
}: ProfileCompletionProps) {
  const handleNavigate = (link: string) => {
    if (onNavigate) {
      onNavigate(link);
    } else {
      window.location.href = link;
    }
  };

  // Determine color based on completion percentage
  const getCompletionColor = () => {
    if (completionPercentage < 50) return 'text-red-600';
    if (completionPercentage < 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse h-6 w-full bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="animate-pulse h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Profile Completion
                </span>
                <span className={`text-sm font-medium ${getCompletionColor()}`}>
                  {completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    completionPercentage < 50
                      ? 'bg-red-600'
                      : completionPercentage < 80
                      ? 'bg-yellow-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                        section.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {section.completed ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-xs">!</span>
                      )}
                    </div>
                    <span className={`text-sm ${section.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                      {section.name}
                      {section.requiredForApplying && !section.completed && (
                        <span className="ml-2 text-xs text-red-500">Required</span>
                      )}
                    </span>
                  </div>
                  {!section.completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleNavigate(section.link)}
                      className="text-xs h-7 px-2"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
