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
  worker?: any;
}

interface WorkerCandidatesProps {
  jobId: string;
  jobTitle: string;
  restaurantName: string;
}

export function WorkerCandidates({ jobId, jobTitle, restaurantName }: WorkerCandidatesProps) {
  const [candidates, setCandidates] = useState<JobMatchScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    limit: 20,
    minScore: 50,
    excludeApplied: true,
    activeOnly: true,
  });
  const [inviting, setInviting] = useState<Set<string>>(new Set());
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCandidates();
  }, [jobId, filters]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: filters.limit.toString(),
        minScore: filters.minScore.toString(),
        excludeApplied: filters.excludeApplied.toString(),
        activeOnly: filters.activeOnly.toString(),
      });

      const response = await fetch(`/api/job-matching/candidates/${jobId}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const data = await response.json();
      setCandidates(data.candidates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inviteWorker = async (workerId: string) => {
    try {
      setInviting(prev => new Set([...prev, workerId]));
      
      const response = await fetch(`/api/job-matching/candidates/${jobId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerIds: [workerId],
          message: `We think you'd be a great fit for our ${jobTitle} position at ${restaurantName}. We'd love to have you apply!`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      const data = await response.json();
      
      // Show success message or update UI
      alert('Invitation sent successfully!');
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(prev => {
        const newSet = new Set(prev);
        newSet.delete(workerId);
        return newSet;
      });
    }
  };

  const inviteSelected = async () => {
    if (selectedCandidates.size === 0) return;

    try {
      const workerIds = Array.from(selectedCandidates);
      setInviting(new Set(workerIds));
      
      const response = await fetch(`/api/job-matching/candidates/${jobId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerIds,
          message: `We think you'd be a great fit for our ${jobTitle} position at ${restaurantName}. We'd love to have you apply!`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send invitations');
      }

      const data = await response.json();
      
      alert(`Successfully sent ${data.totalSent} invitations!`);
      setSelectedCandidates(new Set());
      
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invitations');
    } finally {
      setInviting(new Set());
    }
  };

  const toggleSelectCandidate = (workerId: string) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workerId)) {
        newSet.delete(workerId);
      } else {
        newSet.add(workerId);
      }
      return newSet;
    });
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

  if (loading && !candidates.length) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Recommended Candidates</h2>
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
          <div className="text-red-600 mb-2">Error loading candidates</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchCandidates}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Recommended Candidates</h2>
          <p className="text-gray-600">AI-matched workers for "{jobTitle}"</p>
        </div>
        <div className="flex gap-2">
          {selectedCandidates.size > 0 && (
            <Button
              onClick={inviteSelected}
              disabled={inviting.size > 0}
            >
              {inviting.size > 0 ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600 mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a1 1 0 001.42 0L21 7M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              Invite Selected ({selectedCandidates.size})
            </Button>
          )}
          <Button variant="outline" onClick={fetchCandidates}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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
              <option value={30}>30% or higher</option>
              <option value={50}>50% or higher</option>
              <option value={60}>60% or higher</option>
              <option value={70}>70% or higher</option>
              <option value={80}>80% or higher</option>
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
              <option value={10}>10 candidates</option>
              <option value={20}>20 candidates</option>
              <option value={50}>50 candidates</option>
              <option value={100}>100 candidates</option>
            </select>
          </div>
          <div className="flex items-end space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.excludeApplied}
                onChange={(e) => setFilters({ ...filters, excludeApplied: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Exclude applied</span>
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.activeOnly}
                onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Active users only</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Candidates */}
      {candidates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500 mb-2">No candidates found</div>
          <p className="text-sm text-gray-400">
            Try adjusting your filters or updating the job requirements to find more candidates.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {candidates.map((candidate) => (
            <WorkerCandidateCard 
              key={`${candidate.jobId}-${candidate.workerId}`} 
              candidate={candidate}
              selected={selectedCandidates.has(candidate.workerId)}
              onSelectToggle={() => toggleSelectCandidate(candidate.workerId)}
              onInvite={() => inviteWorker(candidate.workerId)}
              inviting={inviting.has(candidate.workerId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WorkerCandidateCard({ 
  candidate, 
  selected, 
  onSelectToggle, 
  onInvite, 
  inviting 
}: { 
  candidate: JobMatchScore;
  selected: boolean;
  onSelectToggle: () => void;
  onInvite: () => void;
  inviting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelectToggle}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold">{candidate.worker?.user?.name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(candidate.overallScore)}`}>
                  {Math.round(candidate.overallScore)}% {getScoreLabel(candidate.overallScore)}
                </span>
              </div>
              <div className="flex items-center text-gray-600 mb-2">
                <span>{candidate.worker?.title || 'Restaurant Worker'}</span>
                <span className="mx-2">•</span>
                <span>{candidate.worker?.yearsOfExperience || 0} years experience</span>
                <span className="mx-2">•</span>
                <span>{candidate.breakdown.location.distance} mi away</span>
                {candidate.worker?.hourlyRate && (
                  <>
                    <span className="mx-2">•</span>
                    <span>${candidate.worker.hourlyRate}/hr expected</span>
                  </>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <span>Confidence: {candidate.confidence}%</span>
                {candidate.worker?.user?.lastLoginAt && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Last active: {new Date(candidate.worker.user.lastLoginAt).toLocaleDateString()}</span>
                  </>
                )}
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
              <Button 
                size="sm" 
                onClick={onInvite}
                disabled={inviting}
              >
                {inviting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                ) : (
                  'Invite'
                )}
              </Button>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            <ScoreIndicator label="Skills" score={candidate.skillsScore} />
            <ScoreIndicator label="Experience" score={candidate.experienceScore} />
            <ScoreIndicator label="Location" score={candidate.locationScore} />
            <ScoreIndicator label="Schedule" score={candidate.availabilityScore} />
            <ScoreIndicator label="Salary" score={candidate.salaryScore} />
            <ScoreIndicator label="Culture" score={candidate.cultureScore} />
          </div>

          {/* Reasons */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Why this is a good match:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {candidate.reasons.slice(0, 3).map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>

          {/* Worker Skills */}
          {candidate.worker?.workerSkills && candidate.worker.workerSkills.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {candidate.worker.workerSkills.slice(0, 8).map((skill: any, index: number) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                  >
                    {skill.skill?.name || skill.name} ({skill.level})
                  </span>
                ))}
                {candidate.worker.workerSkills.length > 8 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{candidate.worker.workerSkills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Expanded Details */}
          {expanded && (
            <div className="border-t pt-4 space-y-4">
              {/* Skills Analysis */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Skills Analysis</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-green-600 font-medium mb-1">
                      Matched Skills ({candidate.breakdown.skills.matched.length})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {candidate.breakdown.skills.matched.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  {candidate.breakdown.skills.missing.length > 0 && (
                    <div>
                      <div className="text-sm text-orange-600 font-medium mb-1">
                        Skills to Train ({candidate.breakdown.skills.missing.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {candidate.breakdown.skills.missing.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews */}
              {candidate.worker?.reviewsFromRestaurants && candidate.worker.reviewsFromRestaurants.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Recent Reviews</h4>
                  <div className="space-y-2">
                    {candidate.worker.reviewsFromRestaurants.slice(0, 2).map((review: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center mb-1">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {review.restaurant?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {candidate.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Hiring Recommendations</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {candidate.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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