import React from 'react';
import { Card } from '@/components/ui/Card';
import { LineChart, BarChart, AreaChart } from '@/components/ui/Charts';

export interface PerformanceData {
  period: string;
  applications: number;
  acceptances: number;
  rejections: number;
  interviews: number;
  views?: number;
}

export interface PerformanceChartProps {
  data: PerformanceData[];
  title: string;
  subtitle?: string;
  type?: 'line' | 'bar' | 'area';
  showLegend?: boolean;
  height?: number;
  className?: string;
}

/**
 * Performance Chart Component
 * Displays hiring performance metrics over time
 */
export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  title,
  subtitle,
  type = 'line',
  showLegend = true,
  height = 300,
  className = ''
}) => {
  // Prepare chart data
  const chartData = {
    labels: data.map(item => item.period),
    datasets: [
      {
        label: 'Applications',
        data: data.map(item => item.applications),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        tension: 0.4
      },
      {
        label: 'Acceptances',
        data: data.map(item => item.acceptances),
        borderColor: '#10b981',
        backgroundColor: '#10b98120',
        tension: 0.4
      },
      {
        label: 'Interviews',
        data: data.map(item => item.interviews),
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b20',
        tension: 0.4
      },
      {
        label: 'Rejections',
        data: data.map(item => item.rejections),
        borderColor: '#ef4444',
        backgroundColor: '#ef444420',
        tension: 0.4
      }
    ]
  };

  const ChartComponent = type === 'bar' ? BarChart : type === 'area' ? AreaChart : LineChart;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      
      <div className="relative">
        <ChartComponent
          data={chartData}
          height={height}
          width={800}
          className="w-full"
        />
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, item) => sum + item.applications, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Applications</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.reduce((sum, item) => sum + item.acceptances, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Acceptances</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {data.reduce((sum, item) => sum + item.interviews, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Interviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {data.reduce((sum, item) => sum + item.rejections, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Rejections</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

/**
 * Conversion Funnel Chart
 * Shows the hiring funnel from applications to hires
 */
export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface ConversionFunnelProps {
  data: FunnelData[];
  title?: string;
  className?: string;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
  data,
  title = 'Hiring Conversion Funnel',
  className = ''
}) => {
  const maxCount = Math.max(...data.map(item => item.count));
  
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-yellow-500',
    'bg-purple-500',
    'bg-red-500'
  ];

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="space-y-4">
        {data.map((stage, index) => {
          const width = (stage.count / maxCount) * 100;
          const color = colors[index % colors.length];
          
          return (
            <div key={stage.stage} className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {stage.stage}
                </span>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {stage.count}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({stage.percentage}%)
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                <div
                  className={`h-3 rounded-full ${color} transition-all duration-300`}
                  style={{ width: `${width}%` }}
                />
              </div>
              
              {index < data.length - 1 && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Conversion Rates */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Conversion Rates</h4>
        <div className="grid grid-cols-2 gap-4">
          {data.slice(0, -1).map((stage, index) => {
            const nextStage = data[index + 1];
            const conversionRate = stage.count > 0 ? (nextStage.count / stage.count) * 100 : 0;
            
            return (
              <div key={`conversion-${index}`} className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {conversionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">
                  {stage.stage} → {nextStage.stage}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

/**
 * Metrics Comparison Chart
 * Compare multiple metrics side by side
 */
export interface ComparisonMetric {
  name: string;
  current: number;
  previous: number;
  target?: number;
  format?: 'number' | 'percentage' | 'currency' | 'days';
}

export interface MetricsComparisonProps {
  metrics: ComparisonMetric[];
  title?: string;
  className?: string;
}

export const MetricsComparison: React.FC<MetricsComparisonProps> = ({
  metrics,
  title = 'Performance Comparison',
  className = ''
}) => {
  const formatValue = (value: number, format: ComparisonMetric['format'] = 'number'): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'days':
        return `${value.toFixed(1)} days`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="space-y-6">
        {metrics.map((metric, index) => {
          const change = metric.current - metric.previous;
          const changePercent = metric.previous !== 0 ? (change / metric.previous) * 100 : 0;
          const isImprovement = change > 0;
          const targetProgress = metric.target ? (metric.current / metric.target) * 100 : null;
          
          return (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{metric.name}</h4>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatValue(metric.current, metric.format)}
                  </div>
                  <div className={`text-sm flex items-center ${
                    isImprovement ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      {isImprovement ? (
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      )}
                    </svg>
                    {isImprovement ? '+' : ''}{changePercent.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Previous: {formatValue(metric.previous, metric.format)}</span>
                <span>Change: {isImprovement ? '+' : ''}{formatValue(Math.abs(change), metric.format)}</span>
              </div>
              
              {metric.target && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Target: {formatValue(metric.target, metric.format)}</span>
                    <span>{targetProgress?.toFixed(1)}% of target</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        targetProgress && targetProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(targetProgress || 0, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};