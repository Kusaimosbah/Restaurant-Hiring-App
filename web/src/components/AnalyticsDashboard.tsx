import React, { useState } from 'react';
import { useOverviewAnalytics, useWorkerAnalytics, useAnalyticsFilters, useAnalyticsExport } from '@/hooks/useAnalytics';
import { KPIGrid, ComparisonKPI, ProgressKPI } from '@/components/ui/KPICard';
import { LineChart, BarChart, DoughnutChart, AreaChart } from '@/components/ui/Charts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface AnalyticsDashboardProps {
  className?: string;
}

/**
 * Advanced Analytics Dashboard
 * Comprehensive hiring analytics and insights
 */
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'workers'>('overview');
  const { filters, setPresetRange, updateDateRange } = useAnalyticsFilters();
  const { exportToCsv, isExporting } = useAnalyticsExport();

  const overviewAnalytics = useOverviewAnalytics(filters);
  const workerAnalytics = useWorkerAnalytics(filters);

  // Icons for KPI cards
  const JobsIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
    </svg>
  );

  const ApplicationsIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const WorkersIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const handleExport = async (type: 'overview' | 'jobs' | 'workers') => {
    try {
      let data;
      let filename;

      switch (type) {
        case 'overview':
          data = overviewAnalytics.data;
          filename = 'hiring-overview-analytics';
          break;
        case 'workers':
          data = workerAnalytics.data;
          filename = 'worker-analytics';
          break;
        default:
          return;
      }

      if (data) {
        await exportToCsv(data, filename, type);
      }
    } catch (error) {
      console.error('Export failed:', error);
      // You could add toast notification here
    }
  };

  const renderOverviewTab = () => {
    if (overviewAnalytics.loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      );
    }

    if (overviewAnalytics.error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{overviewAnalytics.error}</p>
          <Button onClick={overviewAnalytics.refresh} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    const data = overviewAnalytics.data;
    if (!data) return null;

    // Calculate growth for trend indicators
    const applicationGrowth = {
      value: data.applicationGrowthRate,
      isPositive: data.applicationGrowthRate > 0,
      period: 'last month'
    };

    // KPI data
    const kpis = [
      {
        title: 'Total Jobs',
        value: data.totalJobs,
        subtitle: `${data.activeJobs} active`,
        icon: <JobsIcon />,
        color: 'blue' as const
      },
      {
        title: 'Total Applications',
        value: data.totalApplications,
        trend: applicationGrowth,
        icon: <ApplicationsIcon />,
        color: 'green' as const
      },
      {
        title: 'Active Workers',
        value: data.totalWorkers,
        subtitle: 'In current period',
        icon: <WorkersIcon />,
        color: 'purple' as const
      },
      {
        title: 'Avg. Time to Hire',
        value: `${data.averageTimeToHire} days`,
        subtitle: `${data.acceptanceRate.toFixed(1)}% acceptance rate`,
        icon: <ClockIcon />,
        color: 'yellow' as const
      }
    ];

    // Application trends chart data
    const trendChartData = {
      labels: data.applicationTrends.map(trend => 
        new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Applications',
          data: data.applicationTrends.map(trend => trend.applications),
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f620',
          tension: 0.4
        },
        {
          label: 'Acceptances',
          data: data.applicationTrends.map(trend => trend.acceptances),
          borderColor: '#10b981',
          backgroundColor: '#10b98120',
          tension: 0.4
        }
      ]
    };

    // Status distribution chart data
    const statusChartData = {
      labels: ['Pending', 'Accepted', 'Rejected', 'Interviewed'],
      datasets: [{
        data: [
          data.applicationsByStatus.pending,
          data.applicationsByStatus.accepted,
          data.applicationsByStatus.rejected,
          data.applicationsByStatus.interviewed
        ],
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6']
      }]
    };

    // Top performing jobs chart data
    const topJobsChartData = {
      labels: data.topPerformingJobs.map(job => job.title.slice(0, 20)),
      datasets: [{
        label: 'Applications',
        data: data.topPerformingJobs.map(job => job.applicationCount),
        backgroundColor: '#3b82f6',
        borderWidth: 1
      }]
    };

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPIGrid kpis={kpis} columns={4} />

        {/* Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ComparisonKPI
            title="Monthly Applications"
            current={{
              label: 'This Month',
              value: data.applicationsThisMonth
            }}
            previous={{
              label: 'Last Month',
              value: data.applicationsLastMonth
            }}
          />
          <ComparisonKPI
            title="Acceptance Rate"
            current={{
              label: 'Current',
              value: data.acceptanceRate
            }}
            previous={{
              label: 'Target',
              value: 25 // Example target
            }}
            format="percentage"
          />
          <ProgressKPI
            title="Monthly Hiring Goal"
            current={data.applicationsByStatus.accepted}
            target={50} // Example target
            color="green"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Application Trends</h3>
            <AreaChart
              data={trendChartData}
              width={500}
              height={300}
              className="w-full"
            />
          </Card>

          {/* Status Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Application Status Distribution</h3>
            <DoughnutChart
              data={statusChartData}
              width={300}
              height={300}
              className="w-full"
            />
          </Card>

          {/* Top Performing Jobs */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Top Performing Jobs</h3>
            <BarChart
              data={topJobsChartData}
              width={800}
              height={300}
              className="w-full"
            />
          </Card>
        </div>
      </div>
    );
  };

  const renderWorkersTab = () => {
    if (workerAnalytics.loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading worker analytics...</span>
        </div>
      );
    }

    if (workerAnalytics.error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{workerAnalytics.error}</p>
          <Button onClick={workerAnalytics.refresh} variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    const data = workerAnalytics.data;
    if (!data) return null;

    // Worker KPIs
    const workerKpis = [
      {
        title: 'Active Workers',
        value: data.totalActiveWorkers,
        color: 'blue' as const,
        icon: <WorkersIcon />
      },
      {
        title: 'New Workers',
        value: data.newWorkersThisMonth,
        subtitle: 'This month',
        color: 'green' as const,
        icon: <WorkersIcon />
      },
      {
        title: 'Retention Rate',
        value: `${data.workerRetentionRate.toFixed(1)}%`,
        color: 'purple' as const
      },
      {
        title: 'Avg Applications',
        value: data.averageApplicationsPerWorker.toFixed(1),
        subtitle: 'Per worker',
        color: 'yellow' as const
      }
    ];

    // Top skills chart
    const skillsChartData = {
      labels: data.topSkills.map(skill => skill.skill),
      datasets: [{
        label: 'Skill Count',
        data: data.topSkills.map(skill => skill.count),
        backgroundColor: '#8b5cf6',
        borderWidth: 1
      }]
    };

    return (
      <div className="space-y-6">
        {/* Worker KPIs */}
        <KPIGrid kpis={workerKpis} columns={4} />

        {/* Most Active Workers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Active Workers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applications
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.mostActiveWorkers.map((worker) => (
                  <tr key={worker.workerId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {worker.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {worker.applicationCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {worker.successRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Skills */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Common Skills</h3>
          <BarChart
            data={skillsChartData}
            width={600}
            height={300}
            className="w-full"
          />
        </Card>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive hiring insights and performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Range Presets */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetRange('week')}
            >
              Last Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetRange('month')}
            >
              Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPresetRange('quarter')}
            >
              Last Quarter
            </Button>
          </div>
          {/* Export Button */}
          <Button
            onClick={() => handleExport(activeTab)}
            disabled={isExporting}
            className="min-w-[100px]"
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'jobs', label: 'Jobs', icon: '💼' },
            { id: 'workers', label: 'Workers', icon: '👥' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'workers' && renderWorkersTab()}
        {activeTab === 'jobs' && (
          <div className="text-center py-12">
            <p className="text-gray-500">Job-specific analytics coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};