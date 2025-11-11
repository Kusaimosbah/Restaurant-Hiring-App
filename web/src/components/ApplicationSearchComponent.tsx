import React, { useState, useEffect } from 'react';
import { useApplicationSearch, useSavedSearches } from '@/hooks/useSearch';
import { SearchFilters } from '@/lib/services/SearchService';

/**
 * Advanced Application Search Component
 * For restaurant owners to search and filter applications
 */

interface ApplicationSearchProps {
  onSelectApplication?: (application: any) => void;
  initialFilters?: SearchFilters;
}

export default function ApplicationSearchComponent({
  onSelectApplication,
  initialFilters = {}
}: ApplicationSearchProps) {
  const {
    results,
    filters,
    loading,
    error,
    search,
    updateFilters,
    clearFilters
  } = useApplicationSearch(initialFilters);

  const {
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    executeSavedSearch
  } = useSavedSearches();

  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState(filters.query || '');
  const [saveSearchModal, setSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState('');

  // Search on filter changes
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      search();
    }
  }, [filters, search]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    updateFilters({ query: value });
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    updateFilters({ [key]: value });
  };

  const handleSaveSearch = async () => {
    if (!searchName.trim()) return;

    try {
      await saveSearch({
        name: searchName,
        filters,
        searchType: 'applications',
        alertsEnabled: false
      });
      setSaveSearchModal(false);
      setSearchName('');
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const handleExecuteSavedSearch = async (searchId: string) => {
    try {
      await executeSavedSearch(searchId);
    } catch (error) {
      console.error('Failed to execute saved search:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Search Applications</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by applicant name, email, job title, or cover letter..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                multiple
                value={filters.status || []}
                onChange={(e) => handleFilterChange('status', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Rating</label>
              <select
                value={filters.rating || ''}
                onChange={(e) => handleFilterChange('rating', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any Rating</option>
                <option value="1">1+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>

            {/* Interview Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interview Status</label>
              <select
                value={filters.hasInterview === undefined ? '' : filters.hasInterview.toString()}
                onChange={(e) => handleFilterChange('hasInterview', e.target.value === '' ? undefined : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="true">Has Interview</option>
                <option value="false">No Interview</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applied After</label>
              <input
                type="date"
                value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applied Before</label>
              <input
                type="date"
                value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Save Search Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setSaveSearchModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Save Search
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with Facets and Saved Searches */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Facets */}
          {results.facets && results.facets.statuses.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h3>
              {results.facets.statuses.map(status => (
                <label key={status.value} className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status.value) || false}
                    onChange={(e) => {
                      const currentStatuses = filters.status || [];
                      const newStatuses = e.target.checked
                        ? [...currentStatuses, status.value]
                        : currentStatuses.filter(s => s !== status.value);
                      handleFilterChange('status', newStatuses);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    {status.value.replace('_', ' ')} ({status.count})
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Saved Searches */}
          {savedSearches.filter(s => s.searchType === 'applications').length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Searches</h3>
              {savedSearches
                .filter(search => search.searchType === 'applications')
                .map(search => (
                  <div key={search.id} className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => handleExecuteSavedSearch(search.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 truncate flex-1 text-left"
                    >
                      {search.name}
                    </button>
                    <button
                      onClick={() => deleteSavedSearch(search.id)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Main Results */}
        <div className="lg:col-span-3">
          {/* Results Header */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {loading ? 'Searching...' : `${results.total} applications found`}
                </h3>
                {query && (
                  <p className="text-sm text-gray-600">Results for "{query}"</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="createdAt">Date Applied</option>
                  <option value="status">Status</option>
                  <option value="rating">Rating</option>
                </select>
                <select
                  value={filters.sortOrder || 'desc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && results.data.length === 0 && !error && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}

          {/* Application Results */}
          {!loading && results.data.length > 0 && (
            <div className="space-y-4">
              {results.data.map((application) => (
                <div
                  key={application.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelectApplication?.(application)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.worker?.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(application.status)}`}>
                          {application.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-blue-600 font-medium mb-2">{application.job?.title}</p>
                      <p className="text-gray-600 text-sm mb-2">{application.worker?.email}</p>
                      {application.worker?.phone && (
                        <p className="text-gray-600 text-sm mb-2">{application.worker.phone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      {application.rating && (
                        <div className="flex items-center mb-2">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1 text-sm font-medium">{application.rating}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400">
                        Applied {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Cover Letter Preview */}
                  {application.coverLetter && (
                    <div className="mb-4">
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {application.coverLetter}
                      </p>
                    </div>
                  )}

                  {/* Worker Details */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                    {application.worker?.skills && application.worker.skills.length > 0 && (
                      <div>
                        <span className="font-medium">Skills: </span>
                        {application.worker.skills.slice(0, 3).join(', ')}
                        {application.worker.skills.length > 3 && ` +${application.worker.skills.length - 3} more`}
                      </div>
                    )}
                    {application.worker?.availability && (
                      <div>
                        <span className="font-medium">Available: </span>
                        {application.worker.availability.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Interview Status */}
                  {application.interviews && application.interviews.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm">
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-green-600 font-medium">
                        Interview scheduled for {new Date(application.interviews[0].scheduledAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Reviews */}
                  {application.reviews && application.reviews.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Review: </span>
                        {application.reviews[0].feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {results.total > (filters.limit || 20) && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => handleFilterChange('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 20)))}
                disabled={!filters.offset || filters.offset === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Showing {(filters.offset || 0) + 1} - {Math.min((filters.offset || 0) + (filters.limit || 20), results.total)} of {results.total}
              </span>
              <button
                onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 20))}
                disabled={(filters.offset || 0) + (filters.limit || 20) >= results.total}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Search Modal */}
      {saveSearchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSaveSearchModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Save Search</h3>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Enter search name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSaveSearch}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setSaveSearchModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}