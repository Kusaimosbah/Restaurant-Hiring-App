'use client';

import { useState, useEffect } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface Candidate {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  skills: string[];
  experience: string;
  certifications: string[];
  availability: string[];
  hourlyRateExpected: number;
  location: string;
  bio: string;
  rating: number;
  completedJobs: number;
  matchScore?: number;
}

interface Job {
  id: string;
  title: string;
  skillLevel: string;
  requiredSkills: string[];
  preferredCertifications: string[];
}

interface JobMetadata {
  commonSkills: string[];
  commonCertifications: string[];
  workDays: string[];
}

export default function CandidatesPage() {
  return (
    <SessionProvider>
      <CandidatesPageContent />
    </SessionProvider>
  );
}

function CandidatesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [metadata, setMetadata] = useState<JobMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [searchFilters, setSearchFilters] = useState({
    skills: [] as string[],
    certifications: [] as string[],
    experienceLevel: '',
    availability: [] as string[],
    minRating: 0,
    maxHourlyRate: 0,
    location: '',
    page: 1,
    limit: 10
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    loadMetadata();
    loadJobs();
    loadCandidates();
  }, [session, status, router, isAdmin]);

  const loadMetadata = async () => {
    try {
      const response = await fetch('/api/jobs/metadata');
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
      }
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchFilters.skills.length > 0) {
        params.append('skills', searchFilters.skills.join(','));
      }
      if (searchFilters.certifications.length > 0) {
        params.append('certifications', searchFilters.certifications.join(','));
      }
      if (searchFilters.experienceLevel) {
        params.append('experienceLevel', searchFilters.experienceLevel);
      }
      if (searchFilters.availability.length > 0) {
        params.append('availability', searchFilters.availability.join(','));
      }
      if (searchFilters.minRating > 0) {
        params.append('minRating', searchFilters.minRating.toString());
      }
      if (searchFilters.maxHourlyRate > 0) {
        params.append('maxHourlyRate', searchFilters.maxHourlyRate.toString());
      }
      if (searchFilters.location) {
        params.append('location', searchFilters.location);
      }
      params.append('page', searchFilters.page.toString());
      params.append('limit', searchFilters.limit.toString());

      const response = await fetch(`/api/candidates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error('Failed to load candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateMatches = async (jobId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/candidates/match?jobId=${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.matches || []);
      }
    } catch (error) {
      console.error('Failed to load candidate matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobMatchingChange = (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId) {
      loadCandidateMatches(jobId);
    } else {
      loadCandidates();
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof searchFilters>) => {
    const updatedFilters = { ...searchFilters, ...newFilters, page: 1 };
    setSearchFilters(updatedFilters);
  };

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowProfileModal(true);
  };

  const handleContact = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowContactModal(true);
  };

  const handleInviteToApply = async (candidate: Candidate) => {
    if (!selectedJobId) return;
    
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: selectedJobId,
          candidateId: candidate.id,
          status: 'INVITED'
        }),
      });

      if (response.ok) {
        alert('Invitation sent successfully!');
      } else {
        alert('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Error sending invitation');
    }
  };

  useEffect(() => {
    if (isAdmin && !selectedJobId) {
      loadCandidates();
    }
  }, [searchFilters, isAdmin, selectedJobId]);

  if (loading && candidates.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="Candidate Search & Management"
          subtitle="Find and match the perfect candidates for your jobs"
        />
        
        <div className="p-6">
          {/* Controls */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Candidates for Job
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={selectedJobId}
                onChange={(e) => handleJobMatchingChange(e.target.value)}
              >
                <option value="">Search all candidates</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                &nbsp;
              </label>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Advanced Search Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Skills
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {metadata?.commonSkills.map((skill) => (
                        <label key={skill} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={searchFilters.skills.includes(skill)}
                            onChange={(e) => {
                              const updatedSkills = e.target.checked
                                ? [...searchFilters.skills, skill]
                                : searchFilters.skills.filter(s => s !== skill);
                              handleFilterChange({ skills: updatedSkills });
                            }}
                          />
                          <span className="text-sm">{skill}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certifications
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                      {metadata?.commonCertifications.map((cert) => (
                        <label key={cert} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            checked={searchFilters.certifications.includes(cert)}
                            onChange={(e) => {
                              const updatedCerts = e.target.checked
                                ? [...searchFilters.certifications, cert]
                                : searchFilters.certifications.filter(c => c !== cert);
                              handleFilterChange({ certifications: updatedCerts });
                            }}
                          />
                          <span className="text-sm">{cert}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability
                    </label>
                    <div className="space-y-1">
                      {metadata?.workDays.map((day) => (
                        <label key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={searchFilters.availability.includes(day)}
                            onChange={(e) => {
                              const updatedAvailability = e.target.checked
                                ? [...searchFilters.availability, day]
                                : searchFilters.availability.filter(d => d !== day);
                              handleFilterChange({ availability: updatedAvailability });
                            }}
                          />
                          <span className="text-sm capitalize">{day.toLowerCase()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={searchFilters.experienceLevel}
                      onChange={(e) => handleFilterChange({ experienceLevel: e.target.value })}
                    >
                      <option value="">Any Level</option>
                      <option value="entry">Entry Level</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="experienced">Experienced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Rating
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={searchFilters.minRating}
                      onChange={(e) => handleFilterChange({ minRating: parseInt(e.target.value) })}
                    >
                      <option value="0">Any Rating</option>
                      <option value="3">3+ Stars</option>
                      <option value="4">4+ Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={searchFilters.maxHourlyRate || ''}
                      onChange={(e) => handleFilterChange({ maxHourlyRate: parseFloat(e.target.value) || 0 })}
                      placeholder="No limit"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={searchFilters.location}
                      onChange={(e) => handleFilterChange({ location: e.target.value })}
                      placeholder="City or area"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button onClick={loadCandidates}>Apply Filters</Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchFilters({
                        skills: [],
                        certifications: [],
                        experienceLevel: '',
                        availability: [],
                        minRating: 0,
                        maxHourlyRate: 0,
                        location: '',
                        page: 1,
                        limit: 10
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedJobId ? 'Matched Candidates' : 'All Candidates'} 
              <span className="text-sm text-gray-500 ml-2">({candidates.length} results)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {candidates.length > 0 ? (
              candidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{candidate.user?.name || 'Unknown Candidate'}</h3>
                          {candidate.matchScore && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {Math.round(candidate.matchScore * 100)}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{candidate.user?.email || 'No email provided'}</p>
                        {candidate.location && (
                          <p className="text-sm text-gray-500">📍 {candidate.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">${candidate.hourlyRateExpected || 0}/hour</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>⭐ {candidate.rating ? candidate.rating.toFixed(1) : '0.0'}</span>
                          <span className="ml-2">• {candidate.completedJobs || 0} jobs</span>
                        </div>
                      </div>
                    </div>

                    {candidate.bio && (
                      <p className="text-gray-700 mb-3">{candidate.bio}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Skills:</h4>
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.map((skill) => (
                              <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {candidate.certifications && candidate.certifications.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Certifications:</h4>
                          <div className="flex flex-wrap gap-1">
                            {candidate.certifications.map((cert) => (
                              <span key={cert} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {candidate.availability && Array.isArray(candidate.availability) && candidate.availability.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Availability:</h4>
                        <p className="text-sm text-gray-600">
                          {candidate.availability.map(day => day.charAt(0) + day.slice(1).toLowerCase()).join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleViewProfile(candidate)}>View Profile</Button>
                      <Button size="sm" variant="outline" onClick={() => handleContact(candidate)}>Contact</Button>
                      {selectedJobId && (
                        <Button size="sm" onClick={() => handleInviteToApply(candidate)}>Invite to Apply</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">
                    {selectedJobId ? 'No matching candidates found for this job.' : 'No candidates found with current filters.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {candidates.length > 0 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleFilterChange({ page: Math.max(1, searchFilters.page - 1) })}
                  disabled={searchFilters.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {searchFilters.page}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleFilterChange({ page: searchFilters.page + 1 })}
                  disabled={candidates.length < searchFilters.limit}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Candidate Profile</h2>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  {selectedCandidate.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedCandidate.user?.name || 'Unknown Candidate'}</h3>
                  <p className="text-gray-600">{selectedCandidate.user?.email}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>⭐ {selectedCandidate.rating ? selectedCandidate.rating.toFixed(1) : '0.0'}</span>
                    <span className="ml-2">• {selectedCandidate.completedJobs || 0} jobs completed</span>
                  </div>
                </div>
              </div>

              {selectedCandidate.bio && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Bio:</h4>
                  <p className="text-gray-700">{selectedCandidate.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.skills.map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedCandidate.certifications && selectedCandidate.certifications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Certifications:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.certifications.map((cert) => (
                        <span key={cert} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selectedCandidate.availability && Array.isArray(selectedCandidate.availability) && selectedCandidate.availability.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Availability:</h4>
                  <p className="text-gray-700">
                    {selectedCandidate.availability.map(day => day.charAt(0) + day.slice(1).toLowerCase()).join(', ')}
                  </p>
                </div>
              )}

              {selectedCandidate.hourlyRateExpected && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Expected Hourly Rate:</h4>
                  <p className="text-gray-700">${selectedCandidate.hourlyRateExpected}/hour</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => handleContact(selectedCandidate)}>Contact Candidate</Button>
              {selectedJobId && (
                <Button variant="outline" onClick={() => handleInviteToApply(selectedCandidate)}>
                  Invite to Apply
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowProfileModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Contact Candidate</h2>
              <button 
                onClick={() => setShowContactModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedCandidate.user?.name || 'Unknown Candidate'}</h3>
                <p className="text-gray-600">{selectedCandidate.user?.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message:
                </label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-md resize-none"
                  rows={4}
                  placeholder="Type your message here..."
                  defaultValue={selectedJobId ? 
                    `Hi ${selectedCandidate.user?.name || 'there'},\n\nI'm interested in discussing a job opportunity with you. Please let me know if you'd be available for a brief conversation.\n\nBest regards` 
                    : 'Hi there,\n\nI came across your profile and would like to connect with you regarding potential opportunities.\n\nBest regards'
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={() => {
                alert('Message sent! The candidate will receive your message via email.');
                setShowContactModal(false);
              }}>
                Send Message
              </Button>
              <Button variant="outline" onClick={() => setShowContactModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}