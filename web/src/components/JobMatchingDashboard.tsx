import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Job Matching Dashboard Component
 * 
 * Displays AI-powered job matches with:
 * - Comprehensive scoring breakdown
 * - Skills analysis and compatibility
 * - Location-based matching
 * - Experience evaluation
 * - Real-time match recalculation
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
  isActive: boolean;
  matchedAt: string;
  worker?: {
    id: string;
    user: {
      name: string;
      email: string;
    };
    title?: string;
    yearsOfExperience?: number;
    skills: Array<{
      name: string;
      level: string;
      yearsExperience?: number;
    }>;
  };
  job?: {
    id: string;
    title: string;
    hourlyRate: number;
    restaurant: {
      name: string;
    };
  };
}

interface JobMatchingDashboardProps {
  jobId?: string;
  workerId?: string;
  mode: 'worker-matches' | 'job-matches';
}

export default function JobMatchingDashboard({ 
  jobId, 
  workerId, 
  mode 
}: JobMatchingDashboardProps) {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [filters, setFilters] = useState({
    minScore: 50,
    maxResults: 20,
    includeInactive: false
  });

  useEffect(() => {
    if ((jobId && mode === 'worker-matches') || (workerId && mode === 'job-matches')) {
      loadMatches();
    }
  }, [jobId, workerId, mode, filters]);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'worker-matches' 
        ? `/api/jobs/${jobId}/matches`
        : `/api/workers/${workerId}/matches`;

      const params = new URLSearchParams({
        minScore: filters.minScore.toString(),
        maxResults: filters.maxResults.toString(),
        includeInactive: filters.includeInactive.toString()
      });

      const response = await fetch(`${endpoint}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load matches');
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    
    try {
      const endpoint = mode === 'worker-matches' 
        ? `/api/jobs/${jobId}/matches`
        : `/api/workers/${workerId}/matches`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'recalculate',
          criteria: filters
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to recalculate matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to recalculate matches');
      console.error('Error recalculating matches:', error);
    } finally {
      setRecalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading matches...</p>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">
                {mode === 'worker-matches' ? 'Worker Matches' : 'Job Recommendations'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                AI-powered matching with comprehensive scoring analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {recalculating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recalculating...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Recalculate Matches
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Score</label>
              <select
                value={filters.minScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Any</option>
                <option value={20}>20+</option>
                <option value={40}>40+</option>
                <option value={60}>60+</option>
                <option value={80}>80+</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Results</label>
              <select
                value={filters.maxResults}
                onChange={(e) => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                className="mt-1 block w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={filters.includeInactive}
                onChange={(e) => setFilters(prev => ({ ...prev, includeInactive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Include inactive matches</label>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Matches List */}
        {matches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or recalculating matches
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {mode === 'worker-matches' ? (
                          <h3 className="text-lg font-semibold text-gray-900">
                            {match.worker?.user.name}
                          </h3>
                        ) : (
                          <h3 className="text-lg font-semibold text-gray-900">
                            {match.job?.title}
                          </h3>
                        )}
                        <p className="text-sm text-gray-600">
                          {mode === 'worker-matches' 
                            ? match.worker?.title || 'Restaurant Worker'
                            : `${match.job?.restaurant.name} • $${match.job?.hourlyRate}/hr`
                          }
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.overallScore)}`}>
                          {match.overallScore}% Match
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(match.matchedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      {[
                        { label: 'Skills', score: match.skillScore, weight: '35%' },
                        { label: 'Experience', score: match.experienceScore, weight: '25%' },
                        { label: 'Location', score: match.locationScore, weight: '20%' },
                        { label: 'Schedule', score: match.availabilityScore, weight: '15%' },
                        { label: 'Salary', score: match.salaryScore, weight: '5%' }
                      ].map((metric) => (
                        <div key={metric.label} className="text-center">
                          <div className="relative w-16 h-16 mx-auto mb-2">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                              <circle
                                cx="32" cy="32" r="28"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="4"
                              />
                              <circle
                                cx="32" cy="32" r="28"
                                fill="none"
                                stroke={metric.score >= 80 ? '#10b981' : metric.score >= 60 ? '#3b82f6' : metric.score >= 40 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="4"
                                strokeDasharray={`${metric.score * 1.76} 176`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-semibold text-gray-900">{metric.score}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">{metric.label}</div>
                          <div className="text-xs text-gray-400">{metric.weight}</div>
                        </div>
                      ))}
                    </div>

                    {/* Worker Skills (for worker matches) */}
                    {mode === 'worker-matches' && match.worker?.skills && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.worker.skills.slice(0, 6).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill.name} ({skill.level})
                            </span>
                          ))}
                          {match.worker.skills.length > 6 && (
                            <span className="text-xs text-gray-500">
                              +{match.worker.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Experience Info */}
                    {mode === 'worker-matches' && match.worker?.yearsOfExperience && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{match.worker.yearsOfExperience}</span> years of experience
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          match.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {match.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View Details
                        </button>
                        {mode === 'worker-matches' && (
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                            Contact Worker
                          </button>
                        )}
                        {mode === 'job-matches' && (
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}