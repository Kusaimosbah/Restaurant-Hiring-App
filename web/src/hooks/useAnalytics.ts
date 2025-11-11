import { useState, useEffect, useCallback } from 'react';
import { AnalyticsMetrics, WorkerAnalytics, DetailedJobAnalytics } from '@/lib/services/AnalyticsService';

export interface AnalyticsFilters {
  dateRange: {
    from: Date;
    to: Date;
  };
  jobId?: string;
  status?: string;
}

export interface UseAnalyticsResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching overview analytics
 */
export function useOverviewAnalytics(filters: AnalyticsFilters): UseAnalyticsResult<AnalyticsMetrics> {
  const [data, setData] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: 'overview',
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString()
      });

      const response = await fetch(`/api/analytics?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Analytics request failed');
      }

    } catch (err) {
      console.error('Error fetching overview analytics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange.from, filters.dateRange.to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

/**
 * Hook for fetching worker analytics
 */
export function useWorkerAnalytics(filters: AnalyticsFilters): UseAnalyticsResult<WorkerAnalytics> {
  const [data, setData] = useState<WorkerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: 'workers',
        from: filters.dateRange.from.toISOString(),
        to: filters.dateRange.to.toISOString()
      });

      const response = await fetch(`/api/analytics?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch worker analytics');
      }

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Worker analytics request failed');
      }

    } catch (err) {
      console.error('Error fetching worker analytics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters.dateRange.from, filters.dateRange.to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

/**
 * Hook for fetching job-specific analytics
 */
export function useJobAnalytics(jobId: string): UseAnalyticsResult<DetailedJobAnalytics> {
  const [data, setData] = useState<DetailedJobAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/analytics/jobs/${jobId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch job analytics');
      }

      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Job analytics request failed');
      }

    } catch (err) {
      console.error('Error fetching job analytics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

/**
 * Hook for managing analytics filters
 */
export function useAnalyticsFilters() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date()
    }
  });

  const updateDateRange = useCallback((from: Date, to: Date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { from, to }
    }));
  }, []);

  const setPresetRange = useCallback((preset: 'week' | 'month' | 'quarter' | 'year') => {
    const now = new Date();
    let from: Date;

    switch (preset) {
      case 'week':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    updateDateRange(from, now);
  }, [updateDateRange]);

  const updateJobFilter = useCallback((jobId?: string) => {
    setFilters(prev => ({
      ...prev,
      jobId
    }));
  }, []);

  const updateStatusFilter = useCallback((status?: string) => {
    setFilters(prev => ({
      ...prev,
      status
    }));
  }, []);

  return {
    filters,
    updateDateRange,
    setPresetRange,
    updateJobFilter,
    updateStatusFilter
  };
}

/**
 * Custom hook for exporting analytics data
 */
export function useAnalyticsExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCsv = useCallback(async (
    data: any,
    filename: string,
    type: 'overview' | 'jobs' | 'workers'
  ) => {
    try {
      setIsExporting(true);

      let csvContent = '';
      
      switch (type) {
        case 'overview':
          csvContent = generateOverviewCsv(data);
          break;
        case 'jobs':
          csvContent = generateJobsCsv(data);
          break;
        case 'workers':
          csvContent = generateWorkersCsv(data);
          break;
      }

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    exportToCsv,
    isExporting
  };
}

// Helper functions for CSV generation
function generateOverviewCsv(data: AnalyticsMetrics): string {
  const headers = [
    'Metric',
    'Value',
    'Type'
  ];

  const rows = [
    ['Total Jobs', data.totalJobs.toString(), 'Overview'],
    ['Active Jobs', data.activeJobs.toString(), 'Overview'],
    ['Total Applications', data.totalApplications.toString(), 'Overview'],
    ['Total Workers', data.totalWorkers.toString(), 'Overview'],
    ['Applications This Month', data.applicationsThisMonth.toString(), 'Overview'],
    ['Applications Last Month', data.applicationsLastMonth.toString(), 'Overview'],
    ['Growth Rate (%)', data.applicationGrowthRate.toFixed(2), 'Overview'],
    ['Average Time to Hire (days)', data.averageTimeToHire.toString(), 'Performance'],
    ['Acceptance Rate (%)', data.acceptanceRate.toFixed(2), 'Performance'],
    ['Response Rate (%)', data.responseRate.toFixed(2), 'Performance'],
    ['Pending Applications', data.applicationsByStatus.pending.toString(), 'Status'],
    ['Accepted Applications', data.applicationsByStatus.accepted.toString(), 'Status'],
    ['Rejected Applications', data.applicationsByStatus.rejected.toString(), 'Status'],
    ['Interviewed Applications', data.applicationsByStatus.interviewed.toString(), 'Status']
  ];

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateJobsCsv(data: DetailedJobAnalytics): string {
  const headers = [
    'Job ID',
    'Title',
    'Status',
    'Created Date',
    'Total Applications',
    'Pending',
    'Accepted',
    'Rejected',
    'Conversion Rate (%)',
    'Quality Score'
  ];

  const row = [
    data.jobId,
    `"${data.title}"`,
    data.status,
    data.createdAt.toISOString().split('T')[0],
    data.totalApplications.toString(),
    data.pendingApplications.toString(),
    data.acceptedApplications.toString(),
    data.rejectedApplications.toString(),
    data.conversionRate.toFixed(2),
    data.qualityScore.toFixed(2)
  ];

  return [headers, row].map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
}

function generateWorkersCsv(data: WorkerAnalytics): string {
  const headers = [
    'Metric',
    'Value'
  ];

  const rows = [
    ['Total Active Workers', data.totalActiveWorkers.toString()],
    ['New Workers This Month', data.newWorkersThisMonth.toString()],
    ['Worker Retention Rate (%)', data.workerRetentionRate.toFixed(2)],
    ['Average Applications Per Worker', data.averageApplicationsPerWorker.toFixed(2)]
  ];

  // Add top skills
  data.topSkills.forEach(skill => {
    rows.push([`Skill: ${skill.skill}`, skill.count.toString()]);
  });

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}