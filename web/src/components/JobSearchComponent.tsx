import React, { useState, useEffect } from 'react';
import { useJobSearch, useSearchSuggestions, useSavedSearches } from '@/hooks/useSearch';
import { SearchFilters } from '@/lib/services/SearchService';

/**
 * Advanced Job Search Component
 * Comprehensive search interface with filters, suggestions, and saved searches
 */

interface JobSearchProps {
  onSelectJob?: (job: any) => void;
  initialFilters?: SearchFilters;
  showSavedSearches?: boolean;
}

export default function JobSearchComponent({
  onSelectJob,
  initialFilters = {},
  showSavedSearches = true
}: JobSearchProps) {
  const {
    results,
    filters,
    loading,
    error,
    search,
    updateFilters,
    clearFilters
  } = useJobSearch(initialFilters);

  const { suggestions, getSuggestions } = useSearchSuggestions('jobs');
  const {
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    executeSavedSearch
  } = useSavedSearches();

  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    if (value.length >= 2) {
      getSuggestions(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
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
        searchType: 'jobs',
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
      const results = await executeSavedSearch(searchId);
      // The results are automatically handled by the search hook
    } catch (error) {
      console.error('Failed to execute saved search:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Find Jobs</h2>
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
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search jobs by title, company, or keywords..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleQueryChange(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={filters.location || ''}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="City, State"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Work Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
              <select
                multiple
                value={filters.workType || []}
                onChange={(e) => handleFilterChange('workType', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="TEMPORARY">Temporary</option>
              </select>
            </div>

            {/* Experience Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select
                multiple
                value={filters.experienceLevel || []}
                onChange={(e) => handleFilterChange('experienceLevel', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ENTRY_LEVEL">Entry Level</option>
                <option value="MID_LEVEL">Mid Level</option>
                <option value="SENIOR_LEVEL">Senior Level</option>
                <option value="EXECUTIVE">Executive</option>
              </select>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Salary</label>
              <input
                type="number"
                value={filters.salaryMin || ''}
                onChange={(e) => handleFilterChange('salaryMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Min hourly rate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Salary</label>
              <input
                type="number"
                value={filters.salaryMax || ''}
                onChange={(e) => handleFilterChange('salaryMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Max hourly rate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Urgency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select
                value={filters.urgency || ''}
                onChange={(e) => handleFilterChange('urgency', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posted After</label>
              <input
                type="date"
                value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Posted Before</label>
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
          {results.facets && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Refine Results</h3>
              
              {/* Work Types */}
              {results.facets.workTypes.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Work Type</h4>
                  {results.facets.workTypes.map(workType => (
                    <label key={workType.value} className="flex items-center space-x-2 mb-1">
                      <input
                        type="checkbox"
                        checked={filters.workType?.includes(workType.value) || false}
                        onChange={(e) => {
                          const currentTypes = filters.workType || [];
                          const newTypes = e.target.checked
                            ? [...currentTypes, workType.value]
                            : currentTypes.filter(type => type !== workType.value);
                          handleFilterChange('workType', newTypes);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">
                        {workType.value.replace('_', ' ')} ({workType.count})
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Locations */}
              {results.facets.locations.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Location</h4>
                  {results.facets.locations.slice(0, 5).map(location => (
                    <button
                      key={location.value}
                      onClick={() => handleFilterChange('location', location.value)}
                      className="block w-full text-left text-sm text-gray-600 hover:text-blue-600 mb-1"
                    >
                      {location.value} ({location.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Salary Ranges */}
              {results.facets.salaryRanges.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Salary Range</h4>
                  {results.facets.salaryRanges.map(range => (
                    <button
                      key={range.range}
                      onClick={() => {
                        // Parse range and set salary filters
                        const [min, max] = range.range.match(/\d+/g)?.map(Number) || [];
                        if (min !== undefined) handleFilterChange('salaryMin', min);
                        if (max !== undefined && max !== 999) handleFilterChange('salaryMax', max);
                      }}
                      className="block w-full text-left text-sm text-gray-600 hover:text-blue-600 mb-1"
                    >
                      {range.range} ({range.count})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Searches */}
          {showSavedSearches && savedSearches.filter(s => s.searchType === 'jobs').length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Searches</h3>
              {savedSearches
                .filter(search => search.searchType === 'jobs')
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

          {/* Related Queries */}
          {results.relatedQueries.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Searches</h3>
              {results.relatedQueries.map((relatedQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleQueryChange(relatedQuery)}
                  className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 mb-1"
                >
                  {relatedQuery}
                </button>
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
                  {loading ? 'Searching...' : `${results.total} jobs found`}
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
                  <option value="createdAt">Date Posted</option>
                  <option value="title">Job Title</option>
                  <option value="salaryMin">Salary</option>
                  <option value="urgency">Urgency</option>
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

          {/* Job Results */}
          {!loading && results.data.length === 0 && !error && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}

          {!loading && results.data.length > 0 && (
            <div className="space-y-4">
              {results.data.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelectJob?.(job)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-blue-600 font-medium mb-2">{job.employer?.restaurantName}</p>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{job.location}</span>
                        <span>{job.workType.replace('_', ' ')}</span>
                        <span>${job.salaryMin} - ${job.salaryMax}/hour</span>
                        {job.urgency !== 'LOW' && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            job.urgency === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {job.urgency}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">
                        {job._count?.applications || 0} applications
                      </p>
                      <p className="text-xs text-gray-400">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
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