'use client';

import React, { useState, useEffect } from 'react';
import { MobileLayout, TouchButton, MobileCard, PullToRefresh } from '@/components/mobile/MobileLayout';
import { usePWA } from '@/hooks/usePWA';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits: string[];
  postedAt: string;
  expiresAt: string;
  applications: number;
  isActive: boolean;
  isUrgent?: boolean;
  category: string;
}

interface JobFilters {
  type?: string;
  location?: string;
  salary?: { min: number; max: number };
  category?: string;
  search?: string;
}

export function MobileJobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<JobFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const { storeOfflineAction, isOnline } = usePWA();

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.salary) {
        queryParams.append('minSalary', filters.salary.min.toString());
        queryParams.append('maxSalary', filters.salary.max.toString());
      }

      const response = await fetch(`/api/jobs?${queryParams.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      
      if (!isOnline) {
        storeOfflineAction({
          type: 'LOAD_JOBS',
          data: { filters },
          timestamp: Date.now(),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadJobs();
  };

  const toggleJobStatus = async (jobId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === jobId ? { ...job, isActive } : job
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle job status:', error);
      
      if (!isOnline) {
        storeOfflineAction({
          type: 'TOGGLE_JOB_STATUS',
          data: { jobId, isActive },
          timestamp: Date.now(),
        });
      }
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      
      if (!isOnline) {
        storeOfflineAction({
          type: 'DELETE_JOB',
          data: { jobId },
          timestamp: Date.now(),
        });
      }
    }
  };

  return (
    <MobileLayout
      title="Jobs"
      rightAction={
        <div className="flex items-center space-x-2">
          <TouchButton
            variant="ghost"
            size="small"
            onClick={() => setView(view === 'list' ? 'grid' : 'list')}
          >
            {view === 'list' ? '⊞' : '☰'}
          </TouchButton>
          <TouchButton
            variant="ghost"
            size="small"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍
          </TouchButton>
          <TouchButton
            variant="primary"
            size="small"
            onClick={() => window.location.href = '/jobs/new'}
          >
            + New
          </TouchButton>
        </div>
      }
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4">
          {/* Search and Filters */}
          <SearchAndFilters
            filters={filters}
            setFilters={setFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          {/* Jobs List */}
          {loading ? (
            <JobsSkeleton />
          ) : jobs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className={view === 'grid' ? 'grid grid-cols-1 gap-4' : 'space-y-4'}>
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  view={view}
                  onToggleStatus={(isActive) => toggleJobStatus(job.id, isActive)}
                  onDelete={() => deleteJob(job.id)}
                />
              ))}
            </div>
          )}

          {/* Bottom Spacing */}
          <div className="h-6" />
        </div>
      </PullToRefresh>

      {/* Quick Actions FAB */}
      <QuickActionsFAB />
    </MobileLayout>
  );
}

function SearchAndFilters({
  filters,
  setFilters,
  showFilters,
  setShowFilters,
}: {
  filters: JobFilters;
  setFilters: (filters: JobFilters) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value });
  };

  return (
    <div className="mb-4">
      {/* Search Bar */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <MobileCard className="mb-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Filters</h3>
              <TouchButton
                variant="ghost"
                size="small"
                onClick={() => setFilters({})}
              >
                Clear All
              </TouchButton>
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <div className="flex flex-wrap gap-2">
                {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
                  <TouchButton
                    key={type}
                    variant={filters.type === type ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setFilters({
                      ...filters,
                      type: filters.type === type ? undefined : type
                    })}
                  >
                    {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </TouchButton>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  category: e.target.value || undefined
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="kitchen">Kitchen</option>
                <option value="service">Service</option>
                <option value="management">Management</option>
                <option value="delivery">Delivery</option>
                <option value="cleaning">Cleaning</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="Enter location..."
                value={filters.location || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  location: e.target.value || undefined
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </MobileCard>
      )}
    </div>
  );
}

function JobCard({
  job,
  view,
  onToggleStatus,
  onDelete,
}: {
  job: Job;
  view: 'list' | 'grid';
  onToggleStatus: (isActive: boolean) => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const formatSalary = (salary: { min: number; max: number; currency: string }) => {
    return `${salary.currency}${salary.min.toLocaleString()} - ${salary.currency}${salary.max.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <MobileCard
      onClick={() => window.location.href = `/jobs/${job.id}`}
      hover
      className={`relative ${job.isUrgent ? 'border-red-200 bg-red-50' : ''} ${!job.isActive ? 'opacity-60' : ''}`}
    >
      {/* Status Indicators */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            job.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {job.isActive ? 'Active' : 'Inactive'}
          </span>
          {job.isUrgent && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Urgent
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {job.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </span>
        </div>
        
        <TouchButton
          variant="ghost"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
        >
          ⋮
        </TouchButton>
      </div>

      {/* Job Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
          {job.title}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          {formatSalary(job.salary)}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Posted {formatDate(job.postedAt)}</span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {job.applications} applications
          </span>
        </div>

        {view === 'list' && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
            {job.description}
          </p>
        )}
      </div>

      {/* Actions Menu */}
      {showActions && (
        <div className="absolute right-4 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/jobs/${job.id}/edit`;
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(!job.isActive);
                setShowActions(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {job.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/jobs/${job.id}/applications`;
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Applications
            </button>
            <hr className="my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowActions(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </MobileCard>
  );
}

function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Post Job',
      icon: '➕',
      href: '/jobs/new',
      color: 'bg-blue-500',
    },
    {
      label: 'Templates',
      icon: '📋',
      href: '/jobs/templates',
      color: 'bg-green-500',
    },
    {
      label: 'Analytics',
      icon: '📊',
      href: '/jobs/analytics',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Action Buttons */}
      {isOpen && (
        <div className="space-y-3 mb-3">
          {actions.map((action, index) => (
            <div
              key={action.label}
              className="flex items-center"
              style={{
                animation: `slideUp 0.3s ease ${index * 0.1}s forwards`,
                opacity: 0,
                transform: 'translateY(20px)',
              }}
            >
              <span className="bg-gray-900 text-white px-2 py-1 rounded text-sm mr-3 whitespace-nowrap">
                {action.label}
              </span>
              <TouchButton
                variant="ghost"
                onClick={() => window.location.href = action.href}
                className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg`}
              >
                {action.icon}
              </TouchButton>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <TouchButton
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg transition-transform ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        ➕
      </TouchButton>

      <style jsx>{`
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">💼</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
      <p className="text-gray-600 mb-6">Get started by posting your first job</p>
      <TouchButton
        variant="primary"
        onClick={() => window.location.href = '/jobs/new'}
      >
        Post Your First Job
      </TouchButton>
    </div>
  );
}

function JobsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-2">
              <div className="h-5 bg-gray-200 rounded w-12 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}