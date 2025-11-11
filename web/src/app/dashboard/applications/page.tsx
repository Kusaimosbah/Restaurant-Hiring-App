'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  UserIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  ChevronDownIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ApplicationProfile {
  id: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'INTERVIEW_SCHEDULED' | 'INTERVIEWED' | 'HIRED' | 'DECLINED';
  appliedAt: string;
  respondedAt?: string;
  responseNote?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  rating?: number;
  notes: string[];
  interview?: {
    scheduledAt: string;
    type: 'PHONE' | 'VIDEO' | 'IN_PERSON';
    interviewer: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    feedback?: string;
    rating?: number;
  };
  job: {
    id: string;
    title: string;
    hourlyRate: number;
    location: string;
    restaurant: {
      id: string;
      name: string;
      address: string;
    };
  };
  worker: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      profilePictureUrl?: string;
    };
    title?: string;
    bio?: string;
    yearsOfExperience?: number;
    hourlyRate?: number;
    contactPhone?: string;
    skills: string[];
    availability?: string;
    performance: {
      averageRating: number;
      totalJobs: number;
      completedJobs: number;
      reliability: number;
    };
  };
  timeline: Array<{
    id: string;
    action: string;
    description: string;
    timestamp: string;
    actor: string;
  }>;
}

interface ApplicationFilters {
  search: string;
  status: string;
  priority: string;
  job: string;
  rating: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled', color: 'bg-blue-100 text-blue-800' },
  { value: 'INTERVIEWED', label: 'Interviewed', color: 'bg-purple-100 text-purple-800' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'bg-green-100 text-green-800' },
  { value: 'HIRED', label: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'REJECTED', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
  { value: 'DECLINED', label: 'Declined Offer', color: 'bg-orange-100 text-orange-800' }
];

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High Priority', color: 'bg-red-100 text-red-800' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'LOW', label: 'Low Priority', color: 'bg-green-100 text-green-800' }
];

const INTERVIEW_TYPES = [
  { value: 'PHONE', label: 'Phone Interview' },
  { value: 'VIDEO', label: 'Video Interview' },
  { value: 'IN_PERSON', label: 'In-Person Interview' }
];

export default function ApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [applications, setApplications] = useState<ApplicationProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [viewingApplication, setViewingApplication] = useState<ApplicationProfile | null>(null);
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewApplication, setInterviewApplication] = useState<ApplicationProfile | null>(null);
  
  // Filters and sorting
  const [filters, setFilters] = useState<ApplicationFilters>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    job: searchParams.get('job') || '',
    rating: searchParams.get('rating') || '',
    dateRange: searchParams.get('dateRange') || '',
    sortBy: searchParams.get('sortBy') || 'appliedAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  });

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
    loadApplications();
  }, [session, status, router, isAdmin, filters]);

  const loadApplications = async () => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.priority) queryParams.set('priority', filters.priority);
      if (filters.job) queryParams.set('job', filters.job);
      if (filters.rating) queryParams.set('rating', filters.rating);
      if (filters.dateRange) queryParams.set('dateRange', filters.dateRange);
      if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/applications?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle the API response format: {"success":false,"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}
        const errorMessage = errorData.error?.message || errorData.message || `Failed to load applications (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load applications';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<ApplicationFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && (typeof value === 'string' || typeof value === 'number')) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });
    router.push(`/dashboard/applications?${params.toString()}`);
  };

  const handleUpdateApplication = async (applicationId: string, status: string, responseNote?: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseNote })
      });

      if (!response.ok) throw new Error('Failed to update application');

      toast.success('Application updated successfully');
      loadApplications();
    } catch (error) {
      console.error('Failed to update application:', error);
      toast.error('Failed to update application');
    }
  };

  const handleBulkAction = async (action: 'accept' | 'reject' | 'interview' | 'priority') => {
    if (selectedApplications.length === 0) return;

    try {
      const response = await fetch('/api/applications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationIds: selectedApplications, action })
      });

      if (!response.ok) throw new Error('Bulk action failed');

      toast.success(`Successfully ${action}ed ${selectedApplications.length} application(s)`);
      setSelectedApplications([]);
      setShowBulkActions(false);
      loadApplications();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleScheduleInterview = async (applicationId: string, interviewData: any) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData)
      });

      if (!response.ok) throw new Error('Failed to schedule interview');

      toast.success('Interview scheduled successfully');
      setShowInterviewModal(false);
      loadApplications();
    } catch (error) {
      console.error('Schedule interview error:', error);
      toast.error('Failed to schedule interview');
    }
  };

  const handleViewApplication = (application: ApplicationProfile) => {
    setViewingApplication(application);
    setShowApplicationDetails(true);
  };

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedApplications(prev => 
      prev.length === applications.length ? [] : applications.map(app => app.id)
    );
  };

  const getStatusInfo = (status: string) => {
    return STATUS_OPTIONS.find(option => option.value === status) || 
           { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITY_OPTIONS.find(option => option.value === priority) || 
           { value: priority, label: priority, color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-4 w-4" />;
      case 'INTERVIEW_SCHEDULED':
        return <CalendarIcon className="h-4 w-4" />;
      case 'INTERVIEWED':
        return <ChatBubbleLeftRightIcon className="h-4 w-4" />;
      case 'ACCEPTED':
      case 'HIRED':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'REJECTED':
      case 'DECLINED':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
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
          title="Application Management"
          subtitle={`${applications.length} application${applications.length !== 1 ? 's' : ''} to review`}
        />
        
        <div className="p-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search applications by applicant name, job title, or skills..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
                {(filters.status || filters.priority || filters.job || filters.rating || filters.dateRange) && (
                  <span className="bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {[filters.status, filters.priority, filters.job, filters.rating, filters.dateRange].filter(Boolean).length}
                  </span>
                )}
              </Button>
              
              {selectedApplications.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center gap-2"
                >
                  <UserGroupIcon className="h-4 w-4" />
                  Actions ({selectedApplications.length})
                </Button>
              )}
              
              <Button onClick={loadApplications} className="flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange({ status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="">All Statuses</option>
                      {STATUS_OPTIONS.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={filters.priority}
                      onChange={(e) => handleFilterChange({ priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="">All Priorities</option>
                      {PRIORITY_OPTIONS.map(priority => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Job Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Position</label>
                    <select
                      value={filters.job}
                      onChange={(e) => handleFilterChange({ job: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="">All Positions</option>
                      {/* This would be populated from available jobs */}
                    </select>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => handleFilterChange({ rating: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="">Any Rating</option>
                      <option value="4.5">4.5+ Stars</option>
                      <option value="4.0">4.0+ Stars</option>
                      <option value="3.5">3.5+ Stars</option>
                      <option value="3.0">3.0+ Stars</option>
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applied</label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) => handleFilterChange({ dateRange: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <label className="block text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="appliedAt">Application Date</option>
                      <option value="status">Status</option>
                      <option value="priority">Priority</option>
                      <option value="rating">Applicant Rating</option>
                      <option value="job">Job Title</option>
                    </select>
                    
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      search: '',
                      status: '',
                      priority: '',
                      job: '',
                      rating: '',
                      dateRange: '',
                      sortBy: 'appliedAt',
                      sortOrder: 'desc'
                    })}
                    className="text-sm"
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Actions Panel */}
          {showBulkActions && selectedApplications.length > 0 && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedApplications.length} application{selectedApplications.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('accept')}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        Accept All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('reject')}
                        className="text-red-700 border-red-300 hover:bg-red-50"
                      >
                        Reject All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('interview')}
                        className="text-blue-700 border-blue-300 hover:bg-blue-50"
                      >
                        Schedule Interviews
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('priority')}
                        className="text-purple-700 border-purple-300 hover:bg-purple-50"
                      >
                        Set Priority
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedApplications([]);
                      setShowBulkActions(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications List */}
          <div className="space-y-4">
            {applications.length > 0 ? (
              <>
                {/* Select All Checkbox */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <input
                    type="checkbox"
                    checked={selectedApplications.length === applications.length && applications.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Select all applications ({applications.length})
                  </span>
                </div>

                {/* Application Cards */}
                {applications.map((application) => {
                  const statusInfo = getStatusInfo(application.status);
                  const priorityInfo = getPriorityInfo(application.priority);
                  
                  return (
                    <Card key={application.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Selection Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(application.id)}
                            onChange={() => toggleApplicationSelection(application.id)}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />

                          {/* Applicant Photo */}
                          <div className="flex-shrink-0">
                            {application.worker.user.profilePictureUrl ? (
                              <img
                                src={application.worker.user.profilePictureUrl}
                                alt={application.worker.user.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  {application.worker.user.name}
                                  {application.rating && (
                                    <div className="flex items-center gap-1">
                                      <StarIconSolid className="h-4 w-4 text-yellow-400" />
                                      <span className="text-sm font-medium">{application.rating.toFixed(1)}</span>
                                    </div>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                  Applied for: <span className="font-medium">{application.job.title}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                  {application.job.restaurant.name} • ${application.job.hourlyRate}/hr
                                </p>
                              </div>

                              {/* Status and Priority Badges */}
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${priorityInfo.color}`}>
                                  {priorityInfo.label}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                                  {getStatusIcon(application.status)}
                                  {statusInfo.label}
                                </span>
                              </div>
                            </div>

                            {/* Application Message */}
                            {application.message && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg line-clamp-2">
                                  {application.message}
                                </p>
                              </div>
                            )}

                            {/* Applicant Skills */}
                            {application.worker.skills.length > 0 && (
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-1">
                                  {application.worker.skills.slice(0, 6).map((skill, index) => (
                                    <span
                                      key={index}
                                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {application.worker.skills.length > 6 && (
                                    <span className="text-xs text-gray-500 px-2 py-1">
                                      +{application.worker.skills.length - 6} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Applicant Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              {application.worker.yearsOfExperience && (
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    {application.worker.yearsOfExperience} years
                                  </div>
                                  <div className="text-gray-500">Experience</div>
                                </div>
                              )}
                              {application.worker.hourlyRate && (
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">
                                    ${application.worker.hourlyRate}/hr
                                  </div>
                                  <div className="text-gray-500">Expected Rate</div>
                                </div>
                              )}
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {application.worker.performance.averageRating.toFixed(1)}
                                </div>
                                <div className="text-gray-500">Avg Rating</div>
                              </div>
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">
                                  {application.worker.performance.completedJobs}
                                </div>
                                <div className="text-gray-500">Completed Jobs</div>
                              </div>
                            </div>

                            {/* Interview Info */}
                            {application.interview && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">
                                    Interview {application.interview.status.toLowerCase()}
                                  </span>
                                </div>
                                <div className="text-sm text-blue-700">
                                  {new Date(application.interview.scheduledAt).toLocaleString()} • {application.interview.type}
                                </div>
                                {application.interview.feedback && (
                                  <p className="text-sm text-blue-600 mt-2 italic">
                                    "{application.interview.feedback}"
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Actions and Timeline */}
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Applied {formatTimeAgo(application.appliedAt)}</span>
                                {application.worker.contactPhone && (
                                  <div className="flex items-center gap-1">
                                    <PhoneIcon className="h-4 w-4" />
                                    <span>{application.worker.contactPhone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <EnvelopeIcon className="h-4 w-4" />
                                  <span>{application.worker.user.email}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {application.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setInterviewApplication(application);
                                        setShowInterviewModal(true);
                                      }}
                                      className="flex items-center gap-1"
                                    >
                                      <CalendarIcon className="h-4 w-4" />
                                      Schedule Interview
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateApplication(application.id, 'ACCEPTED', 'Congratulations! Your application has been accepted.')}
                                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                                    >
                                      <CheckCircleIcon className="h-4 w-4" />
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUpdateApplication(application.id, 'REJECTED', 'Thank you for your interest. We have decided to proceed with other candidates.')}
                                      className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-1"
                                    >
                                      <XCircleIcon className="h-4 w-4" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewApplication(application)}
                                  className="flex items-center gap-1"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  View Details
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                  Message
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                  <p className="text-gray-500 mb-6">
                    {filters.search || filters.status || filters.priority || filters.job || filters.rating || filters.dateRange
                      ? "No applications match your current filters. Try adjusting your search criteria."
                      : "No applications have been received yet. Applications will appear here when candidates apply for your job postings."
                    }
                  </p>
                  {(filters.search || filters.status || filters.priority || filters.job || filters.rating || filters.dateRange) && (
                    <Button
                      variant="outline"
                      onClick={() => setFilters({
                        search: '',
                        status: '',
                        priority: '',
                        job: '',
                        rating: '',
                        dateRange: '',
                        sortBy: 'appliedAt',
                        sortOrder: 'desc'
                      })}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Application Details Modal */}
        {showApplicationDetails && viewingApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {viewingApplication.worker.user.profilePictureUrl ? (
                      <img
                        src={viewingApplication.worker.user.profilePictureUrl}
                        alt={viewingApplication.worker.user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {viewingApplication.worker.user.name}
                      </h2>
                      <p className="text-gray-600 mb-2">
                        Applied for: <span className="font-medium">{viewingApplication.job.title}</span>
                      </p>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(viewingApplication.status).color}`}>
                          {getStatusInfo(viewingApplication.status).label}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityInfo(viewingApplication.priority).color}`}>
                          {getPriorityInfo(viewingApplication.priority).label}
                        </span>
                        {viewingApplication.rating && (
                          <div className="flex items-center gap-1">
                            <StarIconSolid className="h-4 w-4 text-yellow-400" />
                            <span className="font-medium">{viewingApplication.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowApplicationDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Application Message */}
                {viewingApplication.message && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Message</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewingApplication.message}</p>
                  </div>
                )}

                {/* Worker Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Applicant Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Title:</span>
                        <span className="font-medium">{viewingApplication.worker.title || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium">{viewingApplication.worker.yearsOfExperience || 0} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expected Rate:</span>
                        <span className="font-medium">${viewingApplication.worker.hourlyRate || 'Not specified'}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{viewingApplication.worker.contactPhone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Availability:</span>
                        <span className="font-medium">{viewingApplication.worker.availability || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {viewingApplication.worker.performance.averageRating.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-500">Avg Rating</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {viewingApplication.worker.performance.completedJobs}
                        </div>
                        <div className="text-sm text-gray-500">Jobs Done</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {viewingApplication.worker.performance.reliability}%
                        </div>
                        <div className="text-sm text-gray-500">Reliability</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl font-bold text-gray-900">
                          {viewingApplication.worker.performance.totalJobs}
                        </div>
                        <div className="text-sm text-gray-500">Total Jobs</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {viewingApplication.worker.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewingApplication.worker.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {viewingApplication.timeline && viewingApplication.timeline.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Timeline</h3>
                    <div className="space-y-3">
                      {viewingApplication.timeline.map((event) => (
                        <div key={event.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{event.action}</div>
                            <div className="text-sm text-gray-600">{event.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(event.timestamp).toLocaleString()} • {event.actor}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  {viewingApplication.status === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => {
                          setInterviewApplication(viewingApplication);
                          setShowInterviewModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <CalendarIcon className="h-5 w-5" />
                        Schedule Interview
                      </Button>
                      <Button
                        onClick={() => handleUpdateApplication(viewingApplication.id, 'ACCEPTED')}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                        Accept Application
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateApplication(viewingApplication.id, 'REJECTED')}
                        className="flex-1 flex items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <XCircleIcon className="h-5 w-5" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Scheduling Modal */}
        {showInterviewModal && interviewApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
                <p className="text-gray-600">
                  {interviewApplication.worker.user.name} • {interviewApplication.job.title}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interview Type</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2">
                    {INTERVIEW_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer</label>
                  <input
                    type="text"
                    placeholder="Interviewer name"
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    placeholder="Any additional notes or instructions..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg p-2"
                  />
                </div>
              </div>
              
              <div className="p-6 border-t flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowInterviewModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Handle interview scheduling
                    setShowInterviewModal(false);
                    toast.success('Interview scheduled successfully');
                  }}
                  className="flex-1"
                >
                  Schedule Interview
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}