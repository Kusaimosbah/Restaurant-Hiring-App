import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Advanced Job Matching Dashboard Component
 * Displays AI-powered job matches with detailed scoring and analytics
 */

interface JobMatch {
  id: string;
  jobId: string;
  workerId: string;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  locationScore: number;
  availabilityScore: number;
  salaryScore: number;
  matchedAt: string;
  lastUpdated: string;
  job?: {
    id: string;
    title: string;
    description: string;
    hourlyRate: number;
    startDate: string;
    endDate: string;
    restaurant: {
      name: string;
      city?: string;
      state?: string;
    };
  };
  worker?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    expectedHourlyRate?: number;
    availableForWork: boolean;
    workerSkills: Array<{
      name: string;
      level: string;
    }>;
  };
  skillMatches?: Array<{
    skillName: string;
    requiredLevel?: string;
    workerLevel: string;
    matchScore: number;
    weight: number;
  }>;
}

interface MatchingFilters {
  minScore: number;
  jobId?: string;
  workerId?: string;
  includeInactive: boolean;
  sortBy: 'overallScore' | 'matchedAt' | 'skillScore' | 'locationScore';
  sortOrder: 'asc' | 'desc';
}

export default function JobMatchesDashboard() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  
  const [filters, setFilters] = useState<MatchingFilters>({
    minScore: 60,
    includeInactive: false,
    sortBy: 'overallScore',
    sortOrder: 'desc'
  });

  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Load matches and stats
  useEffect(() => {
    if (session?.user) {
      loadMatches();
      loadStats();
    }
  }, [session, filters]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        minScore: filters.minScore.toString(),
        includeInactive: filters.includeInactive.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.jobId && { jobId: filters.jobId }),
        ...(filters.workerId && { workerId: filters.workerId })
      });

      const response = await fetch(`/api/matching/matches?${queryParams}`);
      
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      } else {
        throw new Error('Failed to load matches');
      }

    } catch (error) {
      setError('Failed to load job matches');
      console.error('Match loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/matching');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Stats loading error:', error);
    }
  };

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recalculate' })
      });

      if (response.ok) {
        await loadMatches();
        await loadStats();
      } else {
        throw new Error('Failed to recalculate matches');
      }

    } catch (error) {
      console.error('Recalculation error:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return '🎯';
    if (score >= 80) return '⭐';
    if (score >= 70) return '✅';
    if (score >= 60) return '🔶';
    return '⚠️';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Matching Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                AI-powered job matching with detailed scoring analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
              <button
                onClick={handleRecalculateAll}
                disabled={recalculating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {recalculating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recalculating...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recalculate All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Matches</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-500">High Quality (90+)</h3>
              <p className="text-2xl font-bold text-green-600">{stats.highQualityMatches || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.averageScore || 0}%</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
              <p className="text-sm text-gray-600">{stats.lastCalculated ? formatDate(stats.lastCalculated) : 'Never'}</p>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Score</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{filters.minScore}%</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="overallScore">Overall Score</option>
                  <option value="skillScore">Skills Score</option>
                  <option value="locationScore">Location Score</option>
                  <option value="matchedAt">Match Date</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Highest First</option>
                  <option value="asc">Lowest First</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includeInactive}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeInactive: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include Inactive</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Matches Grid */}
        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.899a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or recalculating matches</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedMatch(match)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {match.job?.title || 'Job'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {match.worker?.user.name || 'Worker'} • {match.job?.restaurant.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getScoreIcon(match.overallScore)}</span>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(match.overallScore)}`}>
                        {match.overallScore}%
                      </span>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Skills</span>
                      <span className={`px-2 py-1 rounded ${getScoreColor(match.skillScore)}`}>
                        {match.skillScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Experience</span>
                      <span className={`px-2 py-1 rounded ${getScoreColor(match.experienceScore)}`}>
                        {match.experienceScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Location</span>
                      <span className={`px-2 py-1 rounded ${getScoreColor(match.locationScore)}`}>
                        {match.locationScore}%
                      </span>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Rate</span>
                      <span className="font-medium">${match.job?.hourlyRate}/hr</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Start Date</span>
                      <span className="font-medium">
                        {match.job?.startDate ? new Date(match.job.startDate).toLocaleDateString() : 'TBD'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Matched</span>
                      <span>{formatDate(match.matchedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

// Match Detail Modal Component
function MatchDetailModal({
  match,
  onClose
}: {
  match: JobMatch;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Match Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Job Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Job Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Title:</span>
                    <p className="text-sm text-gray-900">{match.job?.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Restaurant:</span>
                    <p className="text-sm text-gray-900">{match.job?.restaurant.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Rate:</span>
                    <p className="text-sm text-gray-900">${match.job?.hourlyRate}/hour</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Duration:</span>
                    <p className="text-sm text-gray-900">
                      {match.job?.startDate && match.job?.endDate && 
                        `${new Date(match.job.startDate).toLocaleDateString()} - ${new Date(match.job.endDate).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Worker Information */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Worker Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <p className="text-sm text-gray-900">{match.worker?.user.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <p className="text-sm text-gray-900">{match.worker?.user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Expected Rate:</span>
                    <p className="text-sm text-gray-900">
                      {match.worker?.expectedHourlyRate ? `$${match.worker.expectedHourlyRate}/hour` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Availability:</span>
                    <p className="text-sm text-gray-900">
                      {match.worker?.availableForWork ? 'Available' : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Scoring */}
            <div className="mt-8">
              <h4 className="text-md font-medium text-gray-900 mb-4">Match Scoring Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Overall', score: match.overallScore, weight: '100%' },
                  { label: 'Skills', score: match.skillScore, weight: '35%' },
                  { label: 'Experience', score: match.experienceScore, weight: '25%' },
                  { label: 'Location', score: match.locationScore, weight: '20%' },
                  { label: 'Availability', score: match.availabilityScore, weight: '15%' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold ${
                      item.score >= 90 ? 'bg-green-500' :
                      item.score >= 80 ? 'bg-green-400' :
                      item.score >= 70 ? 'bg-yellow-500' :
                      item.score >= 60 ? 'bg-yellow-400' :
                      item.score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {item.score}%
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-2">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.weight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Matches */}
            {match.skillMatches && match.skillMatches.length > 0 && (
              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Skill Matching Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {match.skillMatches.map((skillMatch, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{skillMatch.skillName}</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          skillMatch.matchScore >= 90 ? 'text-green-600 bg-green-100' :
                          skillMatch.matchScore >= 80 ? 'text-green-600 bg-green-50' :
                          skillMatch.matchScore >= 70 ? 'text-yellow-600 bg-yellow-100' :
                          skillMatch.matchScore >= 60 ? 'text-yellow-600 bg-yellow-50' :
                          'text-red-600 bg-red-100'
                        }`}>
                          {skillMatch.matchScore}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Required: {skillMatch.requiredLevel || 'Any'}</span>
                          <span>Worker: {skillMatch.workerLevel}</span>
                        </div>
                        <div className="mt-1">
                          <span>Weight: {skillMatch.weight}x</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Handle contact worker action
                  window.location.href = `mailto:${match.worker?.user.email}`;
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Contact Worker
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}