import React from 'react';
import { Card } from './Card';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  className?: string;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600'
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    trend: 'text-yellow-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600'
  },
  gray: {
    bg: 'bg-gray-50',
    icon: 'text-gray-600',
    trend: 'text-gray-600'
  }
};

/**
 * KPI Card Component
 * Displays key performance indicators with trends and icons
 */
export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  className = '',
  onClick
}) => {
  const colors = colorClasses[color];

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with commas
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString();
    }
    return val;
  };

  const TrendIcon = ({ isPositive }: { isPositive: boolean }) => (
    <svg
      className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {isPositive ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      )}
    </svg>
  );

  return (
    <Card 
      className={`p-6 transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center">
              <TrendIcon isPositive={trend.isPositive} />
              <span
                className={`ml-1 text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              <span className="ml-1 text-sm text-gray-500">
                vs {trend.period}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <div className={`w-8 h-8 ${colors.icon}`}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * KPI Grid Component
 * Displays multiple KPI cards in a responsive grid
 */
export interface KPIGridProps {
  kpis: KPICardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  columns = 4,
  className = ''
}) => {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
};

/**
 * Comparison KPI Card
 * Shows comparison between two values
 */
export interface ComparisonKPIProps {
  title: string;
  current: {
    label: string;
    value: number;
    color?: string;
  };
  previous: {
    label: string;
    value: number;
    color?: string;
  };
  format?: 'number' | 'percentage' | 'currency';
  className?: string;
}

export const ComparisonKPI: React.FC<ComparisonKPIProps> = ({
  title,
  current,
  previous,
  format = 'number',
  className = ''
}) => {
  const formatValue = (value: number): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  const percentageChange = previous.value !== 0 
    ? ((current.value - previous.value) / previous.value) * 100
    : current.value > 0 ? 100 : 0;

  const isImprovement = percentageChange > 0;

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>
      
      <div className="space-y-4">
        {/* Current Value */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{current.label}</span>
          <span className="text-2xl font-bold text-gray-900">
            {formatValue(current.value)}
          </span>
        </div>

        {/* Previous Value */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{previous.label}</span>
          <span className="text-lg font-semibold text-gray-600">
            {formatValue(previous.value)}
          </span>
        </div>

        {/* Change Indicator */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Change</span>
            <div className="flex items-center">
              <div className={`flex items-center ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isImprovement ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  )}
                </svg>
                <span className="font-semibold">
                  {isImprovement ? '+' : ''}{percentageChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Progress KPI Card
 * Shows progress towards a goal
 */
export interface ProgressKPIProps {
  title: string;
  current: number;
  target: number;
  format?: 'number' | 'percentage' | 'currency';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  className?: string;
}

export const ProgressKPI: React.FC<ProgressKPIProps> = ({
  title,
  current,
  target,
  format = 'number',
  color = 'blue',
  className = ''
}) => {
  const formatValue = (value: number): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  const progress = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  const progressColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {isComplete && (
          <div className="flex items-center text-green-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Complete</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-gray-900">
            {formatValue(current)}
          </span>
          <span className="text-sm text-gray-600">
            of {formatValue(target)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${progressColors[color]}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {progress.toFixed(1)}% complete
          </span>
          <span className="text-gray-600">
            {formatValue(target - current)} remaining
          </span>
        </div>
      </div>
    </Card>
  );
};