import React, { useState, useEffect } from 'react';
import { useWorkerSearch, useSavedSearches } from '@/hooks/useSearch';
import { SearchFilters } from '@/lib/services/SearchService';

/**
 * Advanced Worker Search Component
 * For restaurant owners to search and filter workers/candidates
 */

interface WorkerSearchProps {
  onSelectWorker?: (worker: any) => void;
  initialFilters?: SearchFilters;
}

export default function WorkerSearchComponent({
  onSelectWorker,
  initialFilters = {}
}: WorkerSearchProps) {
  const {
    results,
    filters,
    loading,
    error,
    search,
    updateFilters,
    clearFilters
  } = useWorkerSearch(initialFilters);

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
        searchType: 'workers',
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Find Workers</h2>
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
            placeholder="Search workers by name, email, skills, or experience..."
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

            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <input
                type="text"
                value={filters.skills?.join(', ') || ''}
                onChange={(e) => handleFilterChange('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Cooking, Serving, Management..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Availability Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              <select
                multiple
                value={filters.availability || []}
                onChange={(e) => handleFilterChange('availability', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
                <option value="NIGHT">Night</option>
                <option value="WEEKEND">Weekend</option>
                <option value="WEEKDAY">Weekday</option>
              </select>
            </div>

            {/* Experience Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience (years)</label>
              <input
                type="number"
                value={filters.yearsOfExperience?.min || ''}
                onChange={(e) => handleFilterChange('yearsOfExperience', {
                  ...filters.yearsOfExperience,
                  min: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="Minimum years"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Experience (years)</label>
              <input
                type="number"
                value={filters.yearsOfExperience?.max || ''}
                onChange={(e) => handleFilterChange('yearsOfExperience', {
                  ...filters.yearsOfExperience,
                  max: e.target.value ? parseInt(e.target.value) : undefined
                })}
                placeholder="Maximum years"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Languages Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
              <input
                type="text"
                value={filters.languages?.join(', ') || ''}
                onChange={(e) => handleFilterChange('languages', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="English, Spanish, French..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Transportation Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transportation</label>
              <select
                multiple
                value={filters.transportationMethod || []}
                onChange={(e) => handleFilterChange('transportationMethod', Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="OWN_CAR">Own Car</option>
                <option value="PUBLIC_TRANSPORT">Public Transport</option>
                <option value="BICYCLE">Bicycle</option>
                <option value="WALKING">Walking</option>
                <option value="RIDESHARE">Rideshare</option>
              </select>
            </div>

            {/* Certifications Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
              <input
                type="text"
                value={filters.certifications?.join(', ') || ''}
                onChange={(e) => handleFilterChange('certifications', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Food Safety, ServSafe, etc..."
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

              {/* Skills */}
              {results.facets.skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Skills</h4>
                  {results.facets.skills.slice(0, 5).map(skill => (
                    <button
                      key={skill.value}
                      onClick={() => {
                        const currentSkills = filters.skills || [];
                        if (!currentSkills.includes(skill.value)) {
                          handleFilterChange('skills', [...currentSkills, skill.value]);
                        }
                      }}
                      className="block w-full text-left text-sm text-gray-600 hover:text-blue-600 mb-1"
                    >
                      {skill.value} ({skill.count})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Searches */}
          {savedSearches.filter(s => s.searchType === 'workers').length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Searches</h3>
              {savedSearches
                .filter(search => search.searchType === 'workers')
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
                  {loading ? 'Searching...' : `${results.total} workers found`}
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
                  <option value="createdAt">Date Joined</option>
                  <option value="name">Name</option>
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
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && results.data.length === 0 && !error && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}

          {/* Worker Results */}
          {!loading && results.data.length > 0 && (
            <div className="space-y-4">
              {results.data.map((worker) => (
                <div
                  key={worker.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelectWorker?.(worker)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      {worker.profilePicture ? (
                        <img
                          src={worker.profilePicture}
                          alt={worker.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name and Contact */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{worker.name}</h3>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{worker.location}</p>
                          <p className="text-xs text-gray-400">
                            Joined {new Date(worker.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-blue-600 text-sm">{worker.email}</p>
                        {worker.phone && <p className="text-gray-600 text-sm">{worker.phone}</p>}
                      </div>

                      {/* Bio */}
                      {worker.bio && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">{worker.bio}</p>
                      )}

                      {/* Skills */}
                      {worker.skills && worker.skills.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {worker.skills.slice(0, 5).map(skill => (
                              <span
                                key={skill}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {skill}
                              </span>
                            ))}
                            {worker.skills.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{worker.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Availability and Experience */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        {worker.availability && worker.availability.length > 0 && (
                          <div>
                            <span className="font-medium">Available: </span>
                            {worker.availability.join(', ')}
                          </div>
                        )}
                        {worker.experience && (
                          <div>
                            <span className="font-medium">Experience: </span>
                            <span className="line-clamp-1">{worker.experience}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{worker._count?.applications || 0} applications</span>
                        </div>
                        {worker._count?.reviews > 0 && (
                          <div className="flex items-center space-x-1">
                            <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span>{worker._count.reviews} reviews</span>
                          </div>
                        )}
                      </div>

                      {/* Recent Applications */}
                      {worker.applications && worker.applications.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Applications</h4>
                          {worker.applications.slice(0, 2).map(app => (
                            <div key={app.id} className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>{app.job?.title} at {app.job?.employer?.restaurantName}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                app.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {app.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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