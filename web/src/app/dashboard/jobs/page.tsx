'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LocationAutocomplete from '@/components/ui/LocationAutocomplete';
import { toast } from 'react-hot-toast';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import JobSearch from '@/components/jobs/JobSearch';
import { 
  PlusIcon, 
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  hourlyRate: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'DRAFT';
  maxWorkers: number;
  restaurant: {
    id: string;
    name: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    formattedAddress: string;
  };
  _count: {
    applications: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface JobFilters {
  status: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const JOB_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'PAUSED', label: 'Paused', color: 'yellow' },
  { value: 'CLOSED', label: 'Closed', color: 'red' },
  { value: 'DRAFT', label: 'Draft', color: 'gray' }
];

export default function JobsPage() {
  return <JobsPageContent />;
}

function JobsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Filters and sorting
  const [filters, setFilters] = useState<JobFilters>({
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  });

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    hourlyRate: 0,
    salary_min: 0,
    salary_max: 0,
    location: '',
    workType: 'PART_TIME',
    department: '',
    startDate: '',
    endDate: '',
    maxWorkers: 1
  });

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadJobs();
  }, [session, status, router, filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/jobs?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle the API response format: {"success":false,"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}
        const errorMessage = errorData.error?.message || errorData.message || `Failed to load jobs (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setJobs(data.jobs || data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load jobs';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async (jobId: string, updates: Partial<Job>) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        loadJobs();
        setEditingJob(null);
      }
    } catch (error) {
      console.error('Failed to update job:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.length === 0) return;

    try {
      const response = await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: selectedJobs,
          action: action
        }),
      });

      if (response.ok) {
        setSelectedJobs([]);
        setShowBulkActions(false);
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    }
  };

  const handleJobSelection = (jobId: string, selected: boolean) => {
    if (selected) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedJobs(jobs.map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL parameters
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    router.push(`/dashboard/jobs?${params.toString()}`);
  };

  const handleDuplicateJob = (job: Job) => {
    setNewJob({
      title: `${job.title} (Copy)`,
      description: job.description,
      requirements: job.requirements || '',
      hourlyRate: job.hourlyRate,
      salary_min: 0,
      salary_max: 0,
      location: '',
      workType: 'PART_TIME',
      department: '',
      startDate: '',
      endDate: '',
      maxWorkers: job.maxWorkers || 1
    });
    setShowCreateForm(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = JOB_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;

    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[statusConfig.color]}`}>
        {statusConfig.label}
      </span>
    );
  };

  const filteredAndSortedJobs = jobs
    .filter(job => {
      if (filters.search && !job.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !job.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && job.status !== filters.status) return false;
      return true;
    })
    .sort((a, b) => {
      const aValue = filters.sortBy === 'createdAt' ? new Date(a.createdAt).getTime() :
                     filters.sortBy === 'title' ? a.title.toLowerCase() :
                     filters.sortBy === 'hourlyRate' ? a.hourlyRate :
                     filters.sortBy === 'applications' ? a._count.applications : 0;
      
      const bValue = filters.sortBy === 'createdAt' ? new Date(b.createdAt).getTime() :
                     filters.sortBy === 'title' ? b.title.toLowerCase() :
                     filters.sortBy === 'hourlyRate' ? b.hourlyRate :
                     filters.sortBy === 'applications' ? b._count.applications : 0;

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TEMPORARY: Skip client-side authentication checks since NextAuth has issues
    // TODO: Re-enable these checks once NextAuth is fixed
    console.log('Bypassing client-side auth checks - NextAuth having issues');

    try {
      console.log('Creating job with temporary auth bypass');
      console.log('Job data being sent:', {
        ...newJob,
        startDate: new Date(newJob.startDate).toISOString(),
        endDate: new Date(newJob.endDate).toISOString(),
      });
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newJob,
          startDate: new Date(newJob.startDate).toISOString(),
          endDate: new Date(newJob.endDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        console.error('Job creation failed - Response status:', response.status);
        console.error('Job creation failed - Error data:', errorData);
        
        if (response.status === 401) {
          alert('Your session has expired. Please log in again.');
          router.push('/auth/signin');
          return;
        }
        
        // Handle the API response format: {"success":false,"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}
        const errorMessage = errorData.error?.message || errorData.message || `Failed to create job (${response.status})`;
        console.error('Job creation failed - Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setShowCreateForm(false);
      setNewJob({
        title: '',
        description: '',
        requirements: '',
        hourlyRate: 0,
        salary_min: 0,
        salary_max: 0,
        location: '',
        workType: 'PART_TIME',
        department: '',
        startDate: '',
        endDate: '',
        maxWorkers: 1
      });
      loadJobs();
      toast.success('Job created successfully!');
    } catch (error) {
      console.error('Failed to create job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
      
      // Show detailed error for debugging
      alert(`DETAILED ERROR: ${errorMessage}\n\nCheck console for full details`);
      console.error('Full error object:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      toast.error(errorMessage);
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

  const handleSaveJob = async (jobId: string, saved: boolean) => {
    try {
      const response = await fetch('/api/jobs/saved', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, saved }),
      });

      if (!response.ok) {
        console.error('Failed to save job');
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  if (loading && jobs.length === 0) {
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
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title={isAdmin ? 'Manage Jobs' : 'Find Jobs'}
          subtitle={isAdmin ? 'Create and manage job postings' : 'Browse and apply to jobs'}
        />
        
        <div className="p-4 sm:p-6">
          {isAdmin ? (
            <>
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Your Jobs 
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({filteredAndSortedJobs.length} total)
                    </span>
                  </h1>
                  {selectedJobs.length > 0 && (
                    <div className="relative">
                      <Button
                        variant="outline"
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="flex items-center space-x-2"
                      >
                        <span>{selectedJobs.length} selected</span>
                        <ChevronDownIcon className="h-4 w-4" />
                      </Button>
                      {showBulkActions && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleBulkAction('activate')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Activate Selected
                            </button>
                            <button
                              onClick={() => handleBulkAction('pause')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Pause Selected
                            </button>
                            <button
                              onClick={() => handleBulkAction('close')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Close Selected
                            </button>
                            <button
                              onClick={() => handleBulkAction('delete')}
                              className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                            >
                              Delete Selected
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Post New Job</span>
                  </Button>
                </div>
              </div>

              {/* Filters and Search */}
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2">
                      <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search jobs..."
                          className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={filters.search}
                          onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <select
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {JOB_STATUSES.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <select
                        className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      >
                        <option value="createdAt">Date Created</option>
                        <option value="title">Title</option>
                        <option value="hourlyRate">Pay Rate</option>
                        <option value="applications">Applications</option>
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="flex-1"
                      >
                        {filters.sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadJobs}
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="selectAll"
                          checked={selectedJobs.length === filteredAndSortedJobs.length && filteredAndSortedJobs.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="selectAll" className="text-sm text-gray-600">
                          Select All
                        </label>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      Showing {filteredAndSortedJobs.length} of {jobs.length} jobs
                    </p>
                  </div>
                </CardContent>
              </Card>

              {showCreateForm && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Create New Job</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateJob} className="space-y-4">
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

                      {/* Salary Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Salary ($)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={newJob.salary_min}
                            onChange={(e) => setNewJob({ ...newJob, salary_min: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Salary ($)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={newJob.salary_max}
                            onChange={(e) => setNewJob({ ...newJob, salary_max: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                      </div>

                      {/* Location and Work Type */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <LocationAutocomplete
                            value={newJob.location}
                            onChange={(value) => setNewJob({ ...newJob, location: value })}
                            placeholder="e.g., Kuala Lumpur, KL"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Work Type
                          </label>
                          <select
                            required
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            value={newJob.workType}
                            onChange={(e) => setNewJob({ ...newJob, workType: e.target.value })}
                          >
                            <option value="FULL_TIME">Full Time</option>
                            <option value="PART_TIME">Part Time</option>
                            <option value="CONTRACT">Contract</option>
                            <option value="TEMPORARY">Temporary</option>
                          </select>
                        </div>
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <select
                          required
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.department}
                          onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                        >
                          <option value="">Select Department</option>
                          <option value="Kitchen">Kitchen</option>
                          <option value="Front of House">Front of House</option>
                          <option value="Management">Management</option>
                          <option value="Bar">Bar</option>
                          <option value="Cleaning">Cleaning</option>
                          <option value="Delivery">Delivery</option>
                          <option value="Administration">Administration</option>
                          <option value="Security">Security</option>
                        </select>
                      </div>
                      
                      <div>
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
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requirements
                        </label>
                        <textarea
                          rows={2}
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={newJob.requirements}
                          onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              {/* Jobs List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredAndSortedJobs.length > 0 ? (
                  filteredAndSortedJobs.map((job) => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4">
                            <input
                              type="checkbox"
                              checked={selectedJobs.includes(job.id)}
                              onChange={(e) => handleJobSelection(job.id, e.target.checked)}
                              className="mt-1 rounded border-gray-300"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                {getStatusBadge(job.status)}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center space-x-1">
                                  <MapPinIcon className="h-4 w-4" />
                                  <span>{job.restaurant.name} • {job.restaurant.formattedAddress}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <CurrencyDollarIcon className="h-4 w-4" />
                                  <span>${job.hourlyRate}/hour</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <UserGroupIcon className="h-4 w-4" />
                                  <span>{job._count.applications} applications</span>
                                </div>
                              </div>

                              <p className="text-gray-700 mb-3">{job.description}</p>

                              {job.requirements && (
                                <div className="mb-3">
                                  <h5 className="text-sm font-medium text-gray-900 mb-1">Requirements:</h5>
                                  <p className="text-sm text-gray-600">{job.requirements}</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-1">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}</span>
                                  </div>
                                  <span>Positions: {job.maxWorkers}</span>
                                </div>
                                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <Button
                                variant="outline"
                                className="p-2"
                                onClick={() => setViewingJob(viewingJob?.id === job.id ? null : job)}
                              >
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </Button>
                              {viewingJob?.id === job.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                  <div className="py-1">
                                    <button
                                      onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                      <span>View Details</span>
                                    </button>
                                    <button
                                      onClick={() => router.push(`/dashboard/applications?jobId=${job.id}`)}
                                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <UserGroupIcon className="h-4 w-4" />
                                      <span>View Applications ({job._count.applications})</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingJob(job);
                                        setNewJob({
                                          title: job.title,
                                          description: job.description,
                                          requirements: job.requirements || '',
                                          hourlyRate: job.hourlyRate,
                                          salary_min: 0,
                                          salary_max: 0,
                                          location: '',
                                          workType: 'PART_TIME',
                                          department: '',
                                          startDate: job.startDate.split('T')[0],
                                          endDate: job.endDate.split('T')[0],
                                          maxWorkers: job.maxWorkers
                                        });
                                        setShowCreateForm(true);
                                        setViewingJob(null);
                                      }}
                                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                      <span>Edit Job</span>
                                    </button>
                                    <button
                                      onClick={() => handleDuplicateJob(job)}
                                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <DocumentDuplicateIcon className="h-4 w-4" />
                                      <span>Duplicate</span>
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    {job.status === 'ACTIVE' ? (
                                      <button
                                        onClick={() => handleUpdateJob(job.id, { status: 'PAUSED' })}
                                        className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        <PauseIcon className="h-4 w-4" />
                                        <span>Pause Job</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleUpdateJob(job.id, { status: 'ACTIVE' })}
                                        className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                      >
                                        <PlayIcon className="h-4 w-4" />
                                        <span>Activate Job</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleUpdateJob(job.id, { status: 'CLOSED' })}
                                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <CheckCircleIcon className="h-4 w-4" />
                                      <span>Close Job</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDeleteJob(job.id);
                                        setViewingJob(null);
                                      }}
                                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                      <span>Delete Job</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <PlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No jobs found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {filters.search || filters.status ? 
                          'Try adjusting your filters to see more jobs.' :
                          'Create your first job posting to start hiring!'
                        }
                      </p>
                      {!filters.search && !filters.status && (
                        <Button
                          onClick={() => setShowCreateForm(true)}
                          className="flex items-center space-x-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          <span>Post Your First Job</span>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <JobSearch
              initialJobs={jobs}
              onApply={handleApplyToJob}
              onSave={handleSaveJob}
            />
          )}
        </div>
      </div>
    </div>
  );
}