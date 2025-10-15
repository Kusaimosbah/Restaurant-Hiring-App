'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ScheduleItem {
  id: string;
  day: string;
  startTime?: string;
  endTime?: string;
  isOff?: boolean;
  location?: string;
  position?: string;
}

interface WeeklyScheduleProps {
  schedule: ScheduleItem[];
  title?: string;
  loading?: boolean;
}

export default function WeeklySchedule({
  schedule,
  title = "This Week's Schedule",
  loading = false,
}: WeeklyScheduleProps) {
  // Sort schedule by day of week
  const sortedSchedule = [...schedule].sort((a, b) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.indexOf(a.day) - days.indexOf(b.day);
  });

  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            // Loading skeleton
            Array(7).fill(0).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="animate-pulse h-4 w-20 bg-gray-200 rounded"></div>
                <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : sortedSchedule.length > 0 ? (
            sortedSchedule.map((item) => (
              <div 
                key={item.id} 
                className={`flex justify-between items-center p-2 rounded-md ${
                  item.day === today ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-sm font-medium ${item.day === today ? 'text-indigo-700' : 'text-gray-900'}`}>
                    {item.day}
                  </span>
                  {item.position && (
                    <span className="text-xs text-gray-500">{item.position}</span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-700">
                    {item.isOff ? (
                      'Off'
                    ) : (
                      `${item.startTime} - ${item.endTime}`
                    )}
                  </span>
                  {item.location && !item.isOff && (
                    <span className="text-xs text-gray-500">{item.location}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No schedule available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
