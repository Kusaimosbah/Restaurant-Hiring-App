'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import TrendChart from './TrendChart';

interface MetricItem {
  label: string;
  value: string | number;
  trend?: number;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
}

interface PerformanceMetricsProps {
  title: string;
  metrics: MetricItem[];
  loading?: boolean;
}

export default function PerformanceMetrics({
  title,
  metrics,
  loading = false,
}: PerformanceMetricsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="animate-pulse h-4 w-24 bg-gray-200 rounded"></div>
                <div className="animate-pulse h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            metrics.map((metric, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{metric.label}</span>
                <div className="flex items-center space-x-2">
                  {metric.trend !== undefined && (
                    <span 
                      className={`text-xs font-medium ${
                        metric.trend > 0 
                          ? 'text-green-600' 
                          : metric.trend < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                      }`}
                    >
                      {metric.trend > 0 ? '↑' : metric.trend < 0 ? '↓' : ''}
                      {Math.abs(metric.trend)}%
                    </span>
                  )}
                  <span className={`text-sm font-medium ${
                    metric.color ? `text-${metric.color}-600` : 'text-gray-900'
                  }`}>
                    {metric.value}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
