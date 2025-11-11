'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PerformanceMetrics {
  timestamp: Date;
  server: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
  database: {
    connections: number;
    queryCount: number;
    averageResponseTime: number;
    slowQueries: Array<{
      query: string;
      duration: number;
      timestamp: Date;
    }>;
  };
  cache: {
    hitRate: number;
    size: number;
    evictions: number;
    memory: number;
  };
  cdn: {
    requests: number;
    bandwidth: number;
    cacheHitRate: number;
    totalFiles: number;
    totalSize: number;
  };
  bundleOptimization: {
    totalSize: number;
    chunkCount: number;
    loadingMetrics: {
      totalLoads: number;
      averageLoadTime: number;
      cacheHitRate: number;
    };
  };
  recommendations: string[];
}

interface PerformanceCardProps {
  title: string;
  value: number | string;
  unit?: string;
  status?: 'good' | 'warning' | 'critical';
  change?: number;
  icon?: React.ReactNode;
}

const PerformanceCard: React.FC<PerformanceCardProps> = ({
  title,
  value,
  unit = '',
  status = 'good',
  change,
  icon,
}) => {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      if (val > 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val > 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toFixed(1);
    }
    return val;
  };

  return (
    <Card className={`p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {change !== undefined && (
          <span className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">
          {formatValue(value)}
          {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
        </div>
      </div>
    </Card>
  );
};

interface MetricChartProps {
  title: string;
  data: Array<{ timestamp: Date; value: number }>;
  color?: string;
}

const MetricChart: React.FC<MetricChartProps> = ({ title, data, color = '#3B82F6' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value / maxValue) * 80);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-4">{title}</h3>
      <div className="h-32 w-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
          />
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <polygon
            fill={`url(#gradient-${title})`}
            points={`${points} 100,100 0,100`}
          />
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{data[0]?.timestamp.toLocaleTimeString()}</span>
        <span>{data[data.length - 1]?.timestamp.toLocaleTimeString()}</span>
      </div>
    </Card>
  );
};

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [historicalData, setHistoricalData] = useState<{
    cpu: Array<{ timestamp: Date; value: number }>;
    memory: Array<{ timestamp: Date; value: number }>;
    response: Array<{ timestamp: Date; value: number }>;
  }>({
    cpu: [],
    memory: [],
    response: [],
  });

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/performance/metrics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
        
        // Update historical data
        const now = new Date();
        setHistoricalData(prev => ({
          cpu: [...prev.cpu.slice(-29), { timestamp: now, value: data.data.server?.cpu.usage || 0 }],
          memory: [...prev.memory.slice(-29), { timestamp: now, value: data.data.server?.memory.percentage || 0 }],
          response: [...prev.response.slice(-29), { timestamp: now, value: data.data.database?.averageResponseTime || 0 }],
        }));
        
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Performance metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const getStatus = (value: number, thresholds: [number, number]): 'good' | 'warning' | 'critical' => {
    if (value >= thresholds[1]) return 'critical';
    if (value >= thresholds[0]) return 'warning';
    return 'good';
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (loading && !metrics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 border-red-200 bg-red-50">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Metrics</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchMetrics} className="bg-red-600 hover:bg-red-700">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Real-time system performance monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="5m">Last 5 minutes</option>
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          <Button onClick={fetchMetrics} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformanceCard
          title="Server Uptime"
          value={formatUptime(metrics.server?.uptime || 0)}
          status="good"
          icon={<div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />}
        />
        <PerformanceCard
          title="CPU Usage"
          value={metrics.server?.cpu.usage || 0}
          unit="%"
          status={getStatus(metrics.server?.cpu.usage || 0, [70, 90])}
        />
        <PerformanceCard
          title="Memory Usage"
          value={metrics.server?.memory.percentage || 0}
          unit="%"
          status={getStatus(metrics.server?.memory.percentage || 0, [80, 95])}
        />
        <PerformanceCard
          title="Cache Hit Rate"
          value={metrics.cache?.hitRate || 0}
          unit="%"
          status={getStatus(100 - (metrics.cache?.hitRate || 0), [20, 40])}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricChart
          title="CPU Usage Over Time"
          data={historicalData.cpu}
          color="#EF4444"
        />
        <MetricChart
          title="Memory Usage Over Time"
          data={historicalData.memory}
          color="#F59E0B"
        />
        <MetricChart
          title="Response Time Over Time"
          data={historicalData.response}
          color="#3B82F6"
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Database Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Connections:</span>
              <span className="font-medium">{metrics.database?.connections || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Query Count:</span>
              <span className="font-medium">{metrics.database?.queryCount.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response Time:</span>
              <span className="font-medium">{metrics.database?.averageResponseTime || 0}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slow Queries:</span>
              <span className={`font-medium ${(metrics.database?.slowQueries.length || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics.database?.slowQueries.length || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* CDN Metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">CDN Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Files:</span>
              <span className="font-medium">{metrics.cdn?.totalFiles.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Size:</span>
              <span className="font-medium">{formatBytes(metrics.cdn?.totalSize || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Requests:</span>
              <span className="font-medium">{metrics.cdn?.requests.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cache Hit Rate:</span>
              <span className="font-medium">{metrics.cdn?.cacheHitRate.toFixed(1) || 0}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Bundle Optimization */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bundle Optimization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatBytes(metrics.bundleOptimization?.totalSize || 0)}
            </div>
            <div className="text-sm text-gray-600">Total Bundle Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.bundleOptimization?.chunkCount || 0}
            </div>
            <div className="text-sm text-gray-600">Code Chunks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.bundleOptimization?.loadingMetrics.averageLoadTime.toFixed(0) || 0}ms
            </div>
            <div className="text-sm text-gray-600">Avg Load Time</div>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {metrics.recommendations && metrics.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Recommendations</h3>
          <div className="space-y-2">
            {metrics.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Slow Queries */}
      {metrics.database?.slowQueries && metrics.database.slowQueries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Slow Queries</h3>
          <div className="space-y-3">
            {metrics.database.slowQueries.slice(0, 5).map((query, index) => (
              <div key={index} className="border-l-4 border-red-400 pl-4">
                <div className="flex justify-between items-start">
                  <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    {query.query.substring(0, 80)}...
                  </code>
                  <span className="text-red-600 font-medium">{query.duration}ms</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(query.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(metrics.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default PerformanceDashboard;