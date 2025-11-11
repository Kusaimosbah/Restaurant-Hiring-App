'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MatchingAnalytics {
  timeframe: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalCalculations: number;
    averageScores: {
      overall: number;
      skills: number;
      experience: number;
      location: number;
      availability: number;
      salary: number;
      culture: number;
      confidence: number;
    };
    performance: {
      applicationRate: number;
      hireRate: number;
      totalApplications: number;
      totalHires: number;
    };
  };
  charts: {
    scoreDistribution: Array<{
      scoreRange: string;
      count: number;
    }>;
    topSkills: Array<{
      name: string;
      avgScore: number;
      matches: number;
    }>;
    recentActivity: Array<{
      id: string;
      score: number;
      confidence: number;
      jobTitle: string;
      restaurantName: string;
      workerName: string;
      calculatedAt: string;
    }>;
  };
}

interface MatchingAnalyticsDashboardProps {
  restaurantId?: string; // Optional - for restaurant-specific analytics
}

export function MatchingAnalyticsDashboard({ restaurantId }: MatchingAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<MatchingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe, restaurantId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeframe,
        ...(restaurantId && { restaurantId }),
      });

      const response = await fetch(`/api/job-matching?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Job Matching Analytics</h2>
          <Button disabled>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading analytics</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Matching Analytics</h2>
          <p className="text-gray-600">
            AI-powered matching performance and insights
            {restaurantId && ' for your restaurant'}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Matches"
          value={analytics.summary.totalCalculations.toLocaleString()}
          subtitle="Calculated matches"
          icon="📊"
        />
        <MetricCard
          title="Average Match Score"
          value={`${analytics.summary.averageScores.overall}%`}
          subtitle="Overall compatibility"
          icon="🎯"
        />
        <MetricCard
          title="Application Rate"
          value={`${analytics.summary.performance.applicationRate}%`}
          subtitle="Matches that led to applications"
          icon="📝"
        />
        <MetricCard
          title="Hire Rate"
          value={`${analytics.summary.performance.hireRate}%`}
          subtitle="Applications that led to hires"
          icon="✅"
        />
      </div>

      {/* Score Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Average Matching Scores</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <ScoreBar label="Overall" score={analytics.summary.averageScores.overall} />
          <ScoreBar label="Skills" score={analytics.summary.averageScores.skills} />
          <ScoreBar label="Experience" score={analytics.summary.averageScores.experience} />
          <ScoreBar label="Location" score={analytics.summary.averageScores.location} />
          <ScoreBar label="Schedule" score={analytics.summary.averageScores.availability} />
          <ScoreBar label="Salary" score={analytics.summary.averageScores.salary} />
          <ScoreBar label="Culture" score={analytics.summary.averageScores.culture} />
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Match Score Distribution</h3>
          <div className="space-y-3">
            {analytics.charts.scoreDistribution.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-32 text-sm text-gray-600">{item.scoreRange}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ 
                        width: `${Math.min(100, (Number(item.count) / Math.max(...analytics.charts.scoreDistribution.map(d => Number(d.count)))) * 100)}%` 
                      }}
                    >
                      <span className="text-white text-xs font-medium">
                        {item.count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Skills */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Matching Skills</h3>
          <div className="space-y-3">
            {analytics.charts.topSkills.slice(0, 8).map((skill, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{skill.name}</div>
                  <div className="text-xs text-gray-500">{skill.matches} matches</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{Math.round(Number(skill.avgScore))}%</div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, Number(skill.avgScore))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Matching Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Job</th>
                <th className="text-left py-2">Restaurant</th>
                <th className="text-left py-2">Worker</th>
                <th className="text-left py-2">Match Score</th>
                <th className="text-left py-2">Confidence</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics.charts.recentActivity.slice(0, 10).map((activity) => (
                <tr key={activity.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{activity.jobTitle}</td>
                  <td className="py-2">{activity.restaurantName}</td>
                  <td className="py-2">{activity.workerName}</td>
                  <td className="py-2">
                    <span className={`font-medium ${getScoreColor(activity.score)}`}>
                      {Math.round(activity.score)}%
                    </span>
                  </td>
                  <td className="py-2">{Math.round(activity.confidence)}%</td>
                  <td className="py-2 text-gray-500">
                    {new Date(activity.calculatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Conversion Funnel</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Matches Calculated</span>
                <span className="font-semibold">{analytics.summary.totalCalculations.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Applications Submitted</span>
                <span className="font-semibold text-blue-600">
                  {analytics.summary.performance.totalApplications.toLocaleString()}
                  <span className="text-xs text-gray-500 ml-1">
                    ({analytics.summary.performance.applicationRate}%)
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Successful Hires</span>
                <span className="font-semibold text-green-600">
                  {analytics.summary.performance.totalHires.toLocaleString()}
                  <span className="text-xs text-gray-500 ml-1">
                    ({analytics.summary.performance.hireRate}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Key Recommendations</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {analytics.summary.averageScores.skills < 70 && (
                <li>• Consider improving job skill requirements clarity</li>
              )}
              {analytics.summary.averageScores.location < 60 && (
                <li>• Location may be limiting candidate pool</li>
              )}
              {analytics.summary.performance.applicationRate < 15 && (
                <li>• Low application rate - review job attractiveness</li>
              )}
              {analytics.summary.performance.hireRate > 50 && (
                <li>• ✅ Excellent hiring success rate</li>
              )}
              {analytics.summary.averageScores.overall > 80 && (
                <li>• ✅ Strong overall matching performance</li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon }: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className="text-2xl mr-3">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
      </div>
    </Card>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
        <div
          className={`h-3 rounded-full ${getScoreBarColor(score)}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
      <div className="text-sm font-semibold">{Math.round(score)}%</div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-blue-500';
  if (score >= 70) return 'bg-yellow-500';
  if (score >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}