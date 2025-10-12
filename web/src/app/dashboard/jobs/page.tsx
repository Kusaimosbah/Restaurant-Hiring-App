'use client';

import { useState, useEffect } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  hourlyRate: number;
  startDate: string;
  endDate: string;
  status: string;
  maxWorkers: number;
  // Enhanced fields
  jobType?: string;
  skillLevel?: string;
  urgency?: string;
  requiredSkills?: string[];
  preferredCertifications?: string[];
  workDays?: string[];
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
  isPhysicallyDemanding?: boolean;
  location?: string;
  benefits?: string;
  dresscode?: string;
  equipmentProvided?: string;
  trainingProvided?: boolean;
  backgroundCheckRequired?: boolean;
  minimumAge?: number;
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
  _count: {
    applications: number;
  };
}

interface JobMetadata {
  jobTypes: Array<{value: string; label: string; description: string}>;
  skillLevels: Array<{value: string; label: string; description: string}>;
  urgencyLevels: Array<{value: string; label: string; description: string}>;
  jobStatuses: Array<{value: string; label: string; description: string}>;
  commonSkills: string[];
  commonCertifications: string[];
  workDays: string[];
}

export default function JobsPage() {
  return (
    <SessionProvider>
      <JobsPageContent />
    </SessionProvider>
  );
}

function JobsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [metadata, setMetadata] = useState<JobMetadata | null>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    hourlyRate: 0,
    startDate: '',
    endDate: '',
    maxWorkers: 1,
    // Enhanced fields
    jobType: 'SINGLE_SHIFT',
    skillLevel: 'NO_EXPERIENCE',
    urgency: 'MEDIUM',
    requiredSkills: [] as string[],
    preferredCertifications: [] as string[],
    workDays: [] as string[],
    startTime: '',
    endTime: '',
    breakDuration: 30,
    isPhysicallyDemanding: false,
    location: '',
    benefits: '',
    dresscode: '',
    equipmentProvided: '',
    trainingProvided: true,
    backgroundCheckRequired: false,
    minimumAge: 18
  });

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadJobs();
    loadMetadata();
  }, [session, status, router]);

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
      setLoading(false);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newJob,
          startDate: new Date(newJob.startDate).toISOString(),
          endDate: new Date(newJob.endDate).toISOString(),
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewJob({
          title: '',
          description: '',
          requirements: '',
          hourlyRate: 0,
          startDate: '',
          endDate: '',
          maxWorkers: 1,
          jobType: 'SINGLE_SHIFT',
          skillLevel: 'NO_EXPERIENCE',
          urgency: 'MEDIUM',
          requiredSkills: [] as string[],
          preferredCertifications: [] as string[],
          workDays: [] as string[],
          startTime: '',
          endTime: '',
          breakDuration: 30,
          isPhysicallyDemanding: false,
          location: '',
          benefits: '',
          dresscode: '',
          equipmentProvided: '',
          trainingProvided: true,
          backgroundCheckRequired: false,
          minimumAge: 18
        });
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        loadJobs();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Failed to apply to job:', error);
      alert('Failed to apply to job');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title={isAdmin ? 'Manage Jobs' : 'Available Jobs'}
          subtitle={isAdmin ? 'Create and manage job postings' : 'Browse and apply to jobs'}
        />
        
        <div className="p-6">
          {isAdmin && (
            <div className="mb-6">
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                {showCreateForm ? 'Cancel' : '+ Post New Job'}
              </Button>
            </div>
          )}

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Job</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateJob} className="space-y-6">
                  {/* Basic Information */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.title}
                          onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.hourlyRate}
                          onChange={(e) => setNewJob({ ...newJob, hourlyRate: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        required
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newJob.description}
                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Job Classification */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Job Classification</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Type
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.jobType}
                          onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                        >
                          {metadata?.jobTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Skill Level Required
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.skillLevel}
                          onChange={(e) => setNewJob({ ...newJob, skillLevel: e.target.value })}
                        >
                          {metadata?.skillLevels.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Urgency Level
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.urgency}
                          onChange={(e) => setNewJob({ ...newJob, urgency: e.target.value })}
                        >
                          {metadata?.urgencyLevels.map((urgency) => (
                            <option key={urgency.value} value={urgency.value}>
                              {urgency.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Skills & Certifications */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Skills & Certifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Required Skills
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                          {metadata?.commonSkills.map((skill) => (
                            <label key={skill} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                checked={newJob.requiredSkills.includes(skill)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewJob({ ...newJob, requiredSkills: [...newJob.requiredSkills, skill] });
                                  } else {
                                    setNewJob({ ...newJob, requiredSkills: newJob.requiredSkills.filter(s => s !== skill) });
                                  }
                                }}
                              />
                              <span className="text-sm">{skill}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Preferred Certifications
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                          {metadata?.commonCertifications.map((cert) => (
                            <label key={cert} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                checked={newJob.preferredCertifications.includes(cert)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewJob({ ...newJob, preferredCertifications: [...newJob.preferredCertifications, cert] });
                                  } else {
                                    setNewJob({ ...newJob, preferredCertifications: newJob.preferredCertifications.filter(c => c !== cert) });
                                  }
                                }}
                              />
                              <span className="text-sm">{cert}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Requirements
                      </label>
                      <textarea
                        rows={2}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newJob.requirements}
                        onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                        placeholder="Any additional requirements or qualifications..."
                      />
                    </div>
                  </div>

                  {/* Schedule & Timing */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule & Timing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.startDate}
                          onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.endDate}
                          onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.startTime}
                          onChange={(e) => setNewJob({ ...newJob, startTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.endTime}
                          onChange={(e) => setNewJob({ ...newJob, endTime: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Break Duration (min)
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.breakDuration}
                          onChange={(e) => setNewJob({ ...newJob, breakDuration: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Workers
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.maxWorkers}
                          onChange={(e) => setNewJob({ ...newJob, maxWorkers: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Days
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {metadata?.workDays.map((day) => (
                          <label key={day} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newJob.workDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewJob({ ...newJob, workDays: [...newJob.workDays, day] });
                                } else {
                                  setNewJob({ ...newJob, workDays: newJob.workDays.filter(d => d !== day) });
                                }
                              }}
                            />
                            <span className="text-sm capitalize">{day.toLowerCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Job Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location/Area
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.location}
                          onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                          placeholder="e.g., Kitchen, Dining Area, Bar"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Age
                        </label>
                        <input
                          type="number"
                          min="16"
                          max="99"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.minimumAge}
                          onChange={(e) => setNewJob({ ...newJob, minimumAge: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dress Code
                        </label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.dresscode}
                          onChange={(e) => setNewJob({ ...newJob, dresscode: e.target.value })}
                          placeholder="Uniform requirements, appearance standards..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Equipment Provided
                        </label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.equipmentProvided}
                          onChange={(e) => setNewJob({ ...newJob, equipmentProvided: e.target.value })}
                          placeholder="Tools, uniforms, safety equipment..."
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Benefits & Perks
                      </label>
                      <textarea
                        rows={2}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        value={newJob.benefits}
                        onChange={(e) => setNewJob({ ...newJob, benefits: e.target.value })}
                        placeholder="Employee discounts, meals, tips, bonuses..."
                      />
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newJob.isPhysicallyDemanding}
                          onChange={(e) => setNewJob({ ...newJob, isPhysicallyDemanding: e.target.checked })}
                        />
                        <span className="text-sm">This job is physically demanding</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newJob.trainingProvided}
                          onChange={(e) => setNewJob({ ...newJob, trainingProvided: e.target.checked })}
                        />
                        <span className="text-sm">Training will be provided</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newJob.backgroundCheckRequired}
                          onChange={(e) => setNewJob({ ...newJob, backgroundCheckRequired: e.target.checked })}
                        />
                        <span className="text-sm">Background check required</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit">Create Job</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          {job.jobType && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {metadata?.jobTypes.find(t => t.value === job.jobType)?.label || job.jobType}
                            </span>
                          )}
                          {job.urgency && job.urgency !== 'MEDIUM' && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              job.urgency === 'URGENT' ? 'bg-red-100 text-red-800' : 
                              job.urgency === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {metadata?.urgencyLevels.find(u => u.value === job.urgency)?.label || job.urgency}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{job.restaurant.name} • {job.restaurant.address}</p>
                        {job.location && <p className="text-sm text-gray-700">Location: {job.location}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">${job.hourlyRate}/hour</p>
                        <p className="text-sm text-gray-700">{job._count.applications} applications</p>
                        {job.skillLevel && (
                          <p className="text-xs text-gray-700">
                            {metadata?.skillLevels.find(s => s.value === job.skillLevel)?.label || job.skillLevel}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{job.description}</p>
                    
                    {/* Enhanced Information Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Schedule Info */}
                      {(job.startTime || job.endTime || job.workDays?.length) && (
                        <div className="border-l-2 border-blue-500 pl-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Schedule</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Dates: {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}</p>
                            {job.startTime && job.endTime && (
                              <p>Hours: {job.startTime} - {job.endTime}</p>
                            )}
                            {job.breakDuration && (
                              <p>Break: {job.breakDuration} minutes</p>
                            )}
                            {job.workDays && job.workDays.length > 0 && (
                              <p>Days: {job.workDays.map(d => d.charAt(0) + d.slice(1).toLowerCase()).join(', ')}</p>
                            )}
                            <p>Positions Available: {job.maxWorkers}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Job Details */}
                      <div className="border-l-2 border-green-500 pl-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Job Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {job.minimumAge && job.minimumAge > 16 && (
                            <p>Min Age: {job.minimumAge}</p>
                          )}
                          {job.isPhysicallyDemanding && (
                            <p className="text-orange-600">⚠ Physically Demanding</p>
                          )}
                          {job.trainingProvided && (
                            <p className="text-green-600">✓ Training Provided</p>
                          )}
                          {job.backgroundCheckRequired && (
                            <p className="text-blue-600">🔍 Background Check Required</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skills & Requirements */}
                    {((job.requiredSkills && job.requiredSkills.length > 0) || (job.preferredCertifications && job.preferredCertifications.length > 0) || job.requirements) && (
                      <div className="mb-4">
                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Required Skills:</h4>
                            <div className="flex flex-wrap gap-1">
                              {job.requiredSkills.map((skill) => (
                                <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {job.preferredCertifications && job.preferredCertifications.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Preferred Certifications:</h4>
                            <div className="flex flex-wrap gap-1">
                              {job.preferredCertifications.map((cert) => (
                                <span key={cert} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {cert}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {job.requirements && (
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Additional Requirements:</h4>
                            <p className="text-sm text-gray-600">{job.requirements}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Benefits & Perks */}
                    {(job.benefits || job.dresscode || job.equipmentProvided) && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                          {job.benefits && (
                            <div>
                              <span className="font-medium">Benefits:</span> {job.benefits}
                            </div>
                          )}
                          {job.dresscode && (
                            <div>
                              <span className="font-medium">Dress Code:</span> {job.dresscode}
                            </div>
                          )}
                          {job.equipmentProvided && (
                            <div>
                              <span className="font-medium">Equipment:</span> {job.equipmentProvided}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {!isAdmin && (
                      <Button onClick={() => handleApplyToJob(job.id)} className="w-full">
                        Apply Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700">
                    {isAdmin ? 'No jobs posted yet. Create your first job!' : 'No jobs available at the moment.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}