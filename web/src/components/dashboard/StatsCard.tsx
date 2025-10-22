'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  trend?: number;
  icon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  color = 'blue',
  trend,
  icon,
  loading = false,
  onClick,
}: StatsCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Map color to Tailwind classes
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
      hover: 'hover:border-blue-300',
      iconBg: 'bg-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-100',
      hover: 'hover:border-green-300',
      iconBg: 'bg-green-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
      hover: 'hover:border-purple-300',
      iconBg: 'bg-purple-100',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-100',
      hover: 'hover:border-yellow-300',
      iconBg: 'bg-yellow-100',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-100',
      hover: 'hover:border-red-300',
      iconBg: 'bg-red-100',
    },
  };

  // Get trend icon and color
  const getTrendIndicator = () => {
    if (trend === undefined || trend === 0) return null;

    if (trend > 0) {
      return (
        <div className="flex items-center text-green-600 text-xs font-medium">
          <ArrowUpIcon className="h-3 w-3 mr-1" />
          {trend}%
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600 text-xs font-medium">
          <ArrowDownIcon className="h-3 w-3 mr-1" />
          {Math.abs(trend)}%
        </div>
      );
    }
  };

  return (
    <div
      className={onClick ? 'cursor-pointer' : ''}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Card
        className={`border ${colorMap[color].border} ${
          onClick ? `${colorMap[color].hover} transition-all` : ''
        }`}
      >
        <CardContent className={`p-6 ${colorMap[color].bg}`}>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              {trend !== undefined && getTrendIndicator()}
            </div>
            
            {loading ? (
              <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-2"></div>
            ) : (
              <div className={`text-2xl font-bold ${colorMap[color].text} mt-1`}>
                {value.toLocaleString()}
              </div>
            )}
            
            {subtitle && (
              <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
            )}
          </div>
          
          {icon && (
            <div className={`p-2 rounded-full ${colorMap[color].iconBg}`}>
              {icon}
            </div>
          )}
        </div>
        
        {onClick && (
          <div className={`mt-4 flex items-center text-xs font-medium ${colorMap[color].text} ${isHovered ? 'translate-x-1' : ''} transition-transform`}>
            View details
            <ArrowRightIcon className="h-3 w-3 ml-1" />
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
