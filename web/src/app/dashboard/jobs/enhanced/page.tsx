'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
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
  status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';
  maxWorkers: number;
  category?: 'KITCHEN' | 'SERVER' | 'CASHIER' | 'CLEANER' | 'MANAGER' | 'OTHER';
  experienceLevel?: 'ENTRY' | 'INTERMEDIATE' | 'EXPERIENCED' | 'EXPERT';
  benefits?: string[];
  tags?: string[];
  location?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
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
  analytics?: {
    views: number;
    applicationsThisWeek: number;
    responseRate: number;
    averageTimeToApply: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface JobFilters {
  status: string;
  category: string;
  experienceLevel: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface JobTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  requirements?: string;
  category: string;
  experienceLevel: string;
  benefits: string[];
  hourlyRate: number;
}

const JOB_CATEGORIES = [
  { value: 'KITCHEN', label: 'Kitchen Staff' },
  { value: 'SERVER', label: 'Server' },
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'OTHER', label: 'Other' }
];

const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'EXPERIENCED', label: 'Experienced' },
  { value: 'EXPERT', label: 'Expert' }
];

const JOB_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'gray' },
  { value: 'PUBLISHED', label: 'Published', color: 'green' },
  { value: 'PAUSED', label: 'Paused', color: 'yellow' },
  { value: 'CLOSED', label: 'Closed', color: 'red' },
  { value: 'ARCHIVED', label: 'Archived', color: 'gray' }
];

export default function EnhancedJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobTemplates, setJobTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Filters and sorting
  const [filters, setFilters] = useState<JobFilters>({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    experienceLevel: searchParams.get('experience') || '',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  });

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    hourlyRate: 15,
    startDate: '',
    endDate: '',
    maxWorkers: 1,
    category: 'OTHER' as const,
    experienceLevel: 'ENTRY' as const,
    benefits: [] as string[],
    tags: [] as string[],
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadJobs();
    if (isAdmin) {
      loadJobTemplates();
    }
  }, [session, status, router, isAdmin, filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/jobs?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobTemplates = async () => {
    try {
      const response = await fetch('/api/jobs/templates');
      if (response.ok) {
        const data = await response.json();
        setJobTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load job templates:', error);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });

      if (response.ok) {
        setShowCreateForm(false);
        resetNewJobForm();
        loadJobs();
      }
    } catch (error) {
      console.error('Failed to create job:', error);
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

  const resetNewJobForm = () => {
    setNewJob({
      title: '',
      description: '',
      requirements: '',
      hourlyRate: 15,
      startDate: '',
      endDate: '',
      maxWorkers: 1,
      category: 'OTHER',
      experienceLevel: 'ENTRY',
      benefits: [],
      tags: [],
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: ''
      }
    });
  };

  const handleApplyTemplate = (template: JobTemplate) => {
    setNewJob({
      ...newJob,
      title: template.title,
      description: template.description,
      requirements: template.requirements || '',
      category: template.category as any,
      experienceLevel: template.experienceLevel as any,
      benefits: template.benefits,
      hourlyRate: template.hourlyRate
    });
    setShowTemplateModal(false);
  };

  const handleDuplicateJob = (job: Job) => {
    setNewJob({
      title: `${job.title} (Copy)`,
      description: job.description,
      requirements: job.requirements || '',
      hourlyRate: job.hourlyRate,
      startDate: '',
      endDate: '',
      maxWorkers: job.maxWorkers,
      category: job.category || 'OTHER',
      experienceLevel: job.experienceLevel || 'ENTRY',
      benefits: job.benefits || [],
      tags: job.tags || [],
      location: job.location || {
        address: '',
        city: '',
        state: '',
        zipCode: ''
      }
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
      if (filters.category && job.category !== filters.category) return false;
      if (filters.experienceLevel && job.experienceLevel !== filters.experienceLevel) return false;
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

  if (status === 'loading') {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white h-32 rounded-lg"></div>
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
          title={isAdmin ? "Job Management" : "Browse Jobs"}
          subtitle={isAdmin ? "Manage your job postings" : "Find your next opportunity"}
        />
        
        <div className="p-4 sm:p-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {isAdmin ? 'Your Jobs' : 'Available Jobs'} 
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
                          onClick={() => handleBulkAction('publish')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Publish Selected
                        </button>
                        <button
                          onClick={() => handleBulkAction('pause')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Pause Selected
                        </button>
                        <button
                          onClick={() => handleBulkAction('archive')}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Archive Selected
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
            
            {isAdmin && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center space-x-2"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  <span>Templates</span>
                </Button>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Post New Job</span>
                </Button>
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Category Filter */}
                <div>
                  <select
                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {JOB_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Experience Filter */}
                <div>
                  <select
                    className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.experienceLevel}
                    onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                  >
                    <option value="">All Levels</option>
                    {EXPERIENCE_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex space-x-2">
                  <select
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="title">Title</option>
                    <option value="hourlyRate">Pay Rate</option>
                    <option value="applications">Applications</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3"
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
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
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="selectAll"
                        checked={selectedJobs.length === jobs.length && jobs.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="selectAll" className="text-sm text-gray-600">
                        Select All
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Showing {filteredAndSortedJobs.length} of {jobs.length} jobs
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Job Creation Form */}
          {showCreateForm && isAdmin && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{editingJob ? 'Edit Job' : 'Create New Job'}</span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingJob(null);
                      resetNewJobForm();
                    }}
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateJob} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        placeholder="e.g. Kitchen Assistant"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hourly Rate ($) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newJob.hourlyRate}
                        onChange={(e) => setNewJob({ ...newJob, hourlyRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newJob.category}
                        onChange={(e) => setNewJob({ ...newJob, category: e.target.value as any })}
                      >
                        {JOB_CATEGORIES.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience Level *
                      </label>
                      <select
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newJob.experienceLevel}
                        onChange={(e) => setNewJob({ ...newJob, experienceLevel: e.target.value as any })}
                      >
                        {EXPERIENCE_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Positions Available *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newJob.maxWorkers}
                        onChange={(e) => setNewJob({ ...newJob, maxWorkers: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newJob.startDate}
                        onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newJob.endDate}
                        onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newJob.requirements}
                      onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                      placeholder="List any specific requirements, skills, or qualifications..."
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingJob(null);
                        resetNewJobForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex items-center space-x-2"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>{editingJob ? 'Update Job' : 'Create Job'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Job Templates Modal */}
          {showTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Job Templates</h3>
                  <Button
                    variant="ghost"
                    onClick={() => setShowTemplateModal(false)}
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{template.title}</p>
                        <p className="text-xs text-gray-500 mb-2">{template.description.substring(0, 100)}...</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-green-600 font-medium">${template.hourlyRate}/hr</span>
                          <span className="text-gray-500">{EXPERIENCE_LEVELS.find(l => l.value === template.experienceLevel)?.label}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
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
                        {isAdmin && (
                          <input
                            type="checkbox"
                            checked={selectedJobs.includes(job.id)}
                            onChange={(e) => handleJobSelection(job.id, e.target.checked)}
                            className="mt-1 rounded border-gray-300"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {getStatusBadge(job.status)}
                            {job.category && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {JOB_CATEGORIES.find(c => c.value === job.category)?.label}
                              </span>
                            )}
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

                          {/* Job Analytics (Admin Only) */}
                          {isAdmin && job.analytics && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Performance</h5>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Views:</span>
                                  <span className="ml-1 font-medium">{job.analytics.views}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">This Week:</span>
                                  <span className="ml-1 font-medium">{job.analytics.applicationsThisWeek}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Response Rate:</span>
                                  <span className="ml-1 font-medium">{job.analytics.responseRate}%</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Avg. Apply Time:</span>
                                  <span className="ml-1 font-medium">{job.analytics.averageTimeToApply}h</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {isAdmin ? (
                          <div className="relative">
                            <Button
                              variant="ghost"
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
                                        startDate: job.startDate.split('T')[0],
                                        endDate: job.endDate.split('T')[0],
                                        maxWorkers: job.maxWorkers,
                                        category: job.category || 'OTHER',
                                        experienceLevel: job.experienceLevel || 'ENTRY',
                                        benefits: job.benefits || [],
                                        tags: job.tags || [],
                                        location: job.location || {
                                          address: '',
                                          city: '',
                                          state: '',
                                          zipCode: ''
                                        }
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
                                  {job.status === 'PUBLISHED' ? (
                                    <button
                                      onClick={() => handleUpdateJob(job.id, { status: 'PAUSED' })}
                                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <PauseIcon className="h-4 w-4" />
                                      <span>Pause Job</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateJob(job.id, { status: 'PUBLISHED' })}
                                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <PlayIcon className="h-4 w-4" />
                                      <span>Publish Job</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleUpdateJob(job.id, { status: 'ARCHIVED' })}
                                    className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <CheckCircleIcon className="h-4 w-4" />
                                    <span>Archive Job</span>
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
                        ) : (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                              variant="outline"
                              size="sm"
                            >
                              View Details
                            </Button>
                            <Button
                              onClick={() => {
                                // Handle apply logic here
                                router.push(`/dashboard/jobs/${job.id}/apply`);
                              }}
                              size="sm"
                            >
                              Apply Now
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isAdmin ? 'No jobs posted yet' : 'No jobs available'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {isAdmin 
                      ? 'Create your first job posting to start hiring!'
                      : 'Check back later for new opportunities or adjust your filters.'
                    }
                  </p>
                  {isAdmin && (
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
        </div>
      </div>
    </div>
  );
}