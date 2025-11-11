'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface JobMatchScore {
  jobId: string;
  workerId: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  locationScore: number;
  availabilityScore: number;
  salaryScore: number;
  cultureScore: number;
  breakdown: {
    skills: {
      matched: string[];
      missing: string[];
      score: number;
    };
    experience: {
      required: number;
      actual: number;
      score: number;
    };
    location: {
      distance: number;
      score: number;
    };
    availability: {
      overlap: number;
      score: number;
    };
    salary: {
      expected: number;
      offered: number;
      score: number;
    };
    culture: {
      factors: string[];
      score: number;
    };
  };
  confidence: number;
  reasons: string[];
  recommendations: string[];
  job?: any;
  worker?: any;
}

interface JobRecommendationsProps {
  workerId: string;
  userRole: 'WORKER' | 'RESTAURANT_OWNER' | 'ADMIN';
}

export function JobRecommendations({ workerId, userRole }: JobRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<JobMatchScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    limit: 10,
    minScore: 60,
    includeApplied: false,
    maxDistance: 50,
    categories: [] as string[],
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [workerId, filters]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: filters.limit.toString(),
        minScore: filters.minScore.toString(),
        includeApplied: filters.includeApplied.toString(),
        maxDistance: filters.maxDistance.toString(),
        ...(filters.categories.length > 0 && { categories: filters.categories.join(',') }),
      });

      const response = await fetch(`/api/job-matching/recommendations/${workerId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/job-matching/recommendations/${workerId}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh recommendations');
      }

      await fetchRecommendations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  if (loading && !recommendations.length) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Job Recommendations</h2>
          <Button disabled>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            Loading...
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error loading recommendations</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchRecommendations}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Job Recommendations</h2>
          <p className="text-gray-600">AI-powered job matches based on your profile</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshRecommendations}
            disabled={refreshing}
          >
            {refreshing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600 mr-2"></div>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Score
            </label>
            <select
              value={filters.minScore}
              onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={50}>50% or higher</option>
              <option value={60}>60% or higher</option>
              <option value={70}>70% or higher</option>
              <option value={80}>80% or higher</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Distance
            </label>
            <select
              value={filters.maxDistance}
              onChange={(e) => setFilters({ ...filters, maxDistance: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={10}>Within 10 miles</option>
              <option value={25}>Within 25 miles</option>
              <option value={50}>Within 50 miles</option>
              <option value={100}>Within 100 miles</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Results Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={5}>5 jobs</option>
              <option value={10}>10 jobs</option>
              <option value={20}>20 jobs</option>
              <option value={50}>50 jobs</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.includeApplied}
                onChange={(e) => setFilters({ ...filters, includeApplied: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Include applied jobs</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500 mb-2">No recommendations found</div>
          <p className="text-sm text-gray-400">
            Try adjusting your filters or updating your profile to get better matches.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {recommendations.map((rec) => (
            <JobRecommendationCard key={`${rec.jobId}-${rec.workerId}`} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobRecommendationCard({ recommendation }: { recommendation: JobMatchScore }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold">{recommendation.job?.title}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(recommendation.overallScore)}`}>
              {Math.round(recommendation.overallScore)}% {getScoreLabel(recommendation.overallScore)}
            </span>
          </div>
          <div className="flex items-center text-gray-600 mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{recommendation.job?.restaurant?.name}</span>
            <span className="mx-2">•</span>
            <span>${recommendation.job?.hourlyRate}/hr</span>
            <span className="mx-2">•</span>
            <span>{recommendation.breakdown.location.distance} mi away</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <span>Confidence: {recommendation.confidence}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Less Details' : 'More Details'}
          </Button>
          <Button size="sm">
            Apply Now
          </Button>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
        <ScoreIndicator label="Skills" score={recommendation.skillsScore} />
        <ScoreIndicator label="Experience" score={recommendation.experienceScore} />
        <ScoreIndicator label="Location" score={recommendation.locationScore} />
        <ScoreIndicator label="Schedule" score={recommendation.availabilityScore} />
        <ScoreIndicator label="Salary" score={recommendation.salaryScore} />
        <ScoreIndicator label="Culture" score={recommendation.cultureScore} />
      </div>

      {/* Reasons */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Why this is a good match:</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {recommendation.reasons.slice(0, 3).map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t pt-4 space-y-4">
          {/* Skills Breakdown */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Skills Analysis</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-green-600 font-medium mb-1">
                  Matched Skills ({recommendation.breakdown.skills.matched.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {recommendation.breakdown.skills.matched.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {recommendation.breakdown.skills.missing.length > 0 && (
                <div>
                  <div className="text-sm text-orange-600 font-medium mb-1">
                    Skills to Develop ({recommendation.breakdown.skills.missing.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.breakdown.skills.missing.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Experience Details */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Experience Requirements</h4>
            <div className="text-sm text-gray-600">
              Required: {recommendation.breakdown.experience.required} years • 
              Your Experience: {recommendation.breakdown.experience.actual} years
            </div>
          </div>

          {/* Recommendations */}
          {recommendation.recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Recommendations for Success</h4>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {recommendation.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ScoreIndicator({ label, score }: { label: string; score: number }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-sm font-bold ${getScoreColor(score)}`}>
        {Math.round(score)}%
      </div>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreLabel(score: number) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Poor';
}