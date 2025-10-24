'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'shift' | 'availability' | 'time-off' | 'training';
  status: 'scheduled' | 'confirmed' | 'pending' | 'cancelled';
  location?: string;
  description?: string;
  color?: string;
}

interface CalendarWidgetProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  view?: 'month' | 'week';
  editable?: boolean;
  className?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarWidget({
  events = [],
  onEventClick,
  onDateClick,
  view = 'month',
  editable = false,
  className = ''
}: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getEventColor = (event: CalendarEvent): string => {
    if (event.color) return event.color;
    
    switch (event.type) {
      case 'shift': return 'bg-blue-500';
      case 'availability': return 'bg-green-500';
      case 'time-off': return 'bg-red-500';
      case 'training': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'border-2 border-green-400';
      case 'pending': return 'border-2 border-yellow-400 opacity-70';
      case 'cancelled': return 'opacity-50 line-through';
      default: return '';
    }
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the starting day of week for the first day of month
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Date[] = [];
    
    // Add empty days for previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push(prevDate);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // Add empty days for next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days = 42
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(event);
    }
  };

  if (view === 'week') {
    // Week view implementation would go here
    // For now, we'll focus on month view
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <h2 className="text-lg font-semibold text-gray-900">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Today
          </button>
          <div className="text-sm text-gray-500">
            {events.length} events
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {getDaysInMonth(currentDate).map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDay = isToday(date);
          const isSelectedDay = isSelected(date);

          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                min-h-[100px] p-2 border-r border-b last:border-r-0 cursor-pointer
                hover:bg-gray-50 transition-colors relative
                ${!isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : ''}
                ${isTodayDay ? 'bg-blue-50' : ''}
                ${isSelectedDay ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {/* Date Number */}
              <div className={`
                text-sm font-medium mb-1
                ${isTodayDay ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}
              `}>
                {date.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className={`
                      text-xs px-2 py-1 rounded text-white cursor-pointer
                      hover:opacity-80 transition-opacity
                      ${getEventColor(event)} ${getStatusStyle(event.status)}
                    `}
                    title={`${event.title} (${event.startTime} - ${event.endTime})`}
                  >
                    <div className="flex items-center space-x-1">
                      {event.type === 'shift' && <ClockIcon className="w-3 h-3" />}
                      {event.type === 'training' && <UserGroupIcon className="w-3 h-3" />}
                      {event.location && <MapPinIcon className="w-3 h-3" />}
                      <span className="truncate">
                        {event.startTime} {event.title}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Show more indicator */}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Shifts</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Time Off</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Training</span>
            </div>
          </div>
          
          {selectedDate && (
            <div className="text-sm text-gray-600">
              Selected: {selectedDate.toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}