'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon, 
  MapPinIcon, 
  ListBulletIcon,
  HeartIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import QuickApply from './QuickApply';
import JobMap from './JobMap';

interface Location {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

interface Restaurant {
  id: string;
  name: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  formattedAddress: string;
  locations?: Location[];
}

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
  restaurant: Restaurant;
  _count: {
    applications: number;
  };
  isSaved?: boolean;
}

interface SearchFilters {
  query: string;
  location: string;
  radius: number;
  minHourlyRate: number;
  maxHourlyRate: number;
  jobTypes: string[];
  startDate: string;
  endDate: string;
  sortBy: 'relevance' | 'date' | 'hourlyRate' | 'distance';
}

interface JobSearchProps {
  initialJobs?: Job[];
  onApply?: (jobId: string) => void;
  onSave?: (jobId: string, saved: boolean) => void;
}

export default function JobSearch({ initialJobs = [], onApply, onSave }: JobSearchProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [quickApplyJob, setQuickApplyJob] = useState<Job | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    radius: 10,
    minHourlyRate: 0,
    maxHourlyRate: 100,
    jobTypes: [],
    startDate: '',
    endDate: '',
    sortBy: 'relevance'
  });

  // Sample job types - in a real app, these would come from the API
  const jobTypes = [
    'Server',
    'Bartender',
    'Host/Hostess',
    'Cook',
    'Chef',
    'Dishwasher',
    'Manager',
    'Busser',
    'Barback',
    'Food Runner'
  ];

  useEffect(() => {
    loadJobs();
    loadSavedJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        // Make sure we're setting the jobs array from the response
        setJobs(data.jobs || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setLoading(false);
    }
  };

  const loadSavedJobs = async () => {
    try {
      // In a real app, this would be an API call
      // For now, we'll use localStorage
      const saved = localStorage.getItem('savedJobs');
      if (saved) {
        setSavedJobs(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      // In a real app, this would be an API call with filters
      // For now, we'll just filter the jobs we already have
      const filtered = initialJobs.filter(job => {
        // Filter by query
        if (filters.query && !job.title.toLowerCase().includes(filters.query.toLowerCase()) && 
            !job.description.toLowerCase().includes(filters.query.toLowerCase())) {
          return false;
        }
        
        // Filter by hourly rate
        if (job.hourlyRate < filters.minHourlyRate || job.hourlyRate > filters.maxHourlyRate) {
          return false;
        }
        
        // Filter by job type (assuming job title contains the job type)
        if (filters.jobTypes.length > 0 && !filters.jobTypes.some(type => 
          job.title.toLowerCase().includes(type.toLowerCase()))) {
          return false;
        }
        
        // Filter by date
        if (filters.startDate && new Date(job.startDate) < new Date(filters.startDate)) {
          return false;
        }
        
        if (filters.endDate && new Date(job.endDate) > new Date(filters.endDate)) {
          return false;
        }
        
        return true;
      });
      
      // Sort jobs
      const sorted = [...filtered].sort((a, b) => {
        switch (filters.sortBy) {
          case 'date':
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          case 'hourlyRate':
            return b.hourlyRate - a.hourlyRate;
          case 'distance':
            // Would require actual distance calculation
            return 0;
          default:
            return 0;
        }
      });
      
      setJobs(sorted);
      setLoading(false);
    } catch (error) {
      console.error('Failed to search jobs:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleJobTypeToggle = (jobType: string) => {
    setFilters(prev => {
      const jobTypes = [...prev.jobTypes];
      const index = jobTypes.indexOf(jobType);
      
      if (index === -1) {
        jobTypes.push(jobType);
      } else {
        jobTypes.splice(index, 1);
      }
      
      return { ...prev, jobTypes };
    });
  };

  const handleSaveJob = (jobId: string) => {
    const isSaved = savedJobs.includes(jobId);
    let newSavedJobs: string[];
    
    if (isSaved) {
      newSavedJobs = savedJobs.filter(id => id !== jobId);
    } else {
      newSavedJobs = [...savedJobs, jobId];
    }
    
    setSavedJobs(newSavedJobs);
    localStorage.setItem('savedJobs', JSON.stringify(newSavedJobs));
    
    if (onSave) {
      onSave(jobId, !isSaved);
    }
  };

  const handleApplyToJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setQuickApplyJob(job);
    }
  };
  
  const handleQuickApply = async (jobId: string, message: string): Promise<boolean> => {
    try {
      // In a real app, we would send the message along with the application
      if (onApply) {
        onApply(jobId);
        return true;
      } else {
        // Default implementation
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            jobId,
            message 
          }),
        });
        
        return response.ok;
      }
    } catch (error) {
      console.error('Failed to apply to job:', error);
      return false;
    }
  };

  const toggleExpandJob = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  const renderJobCard = (job: Job) => {
    const isSaved = savedJobs.includes(job.id);
    const isExpanded = expandedJob === job.id;
    
    return (
      <Card key={job.id} className="mb-4 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.restaurant.name} • {job.restaurant.formattedAddress}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">${job.hourlyRate}/hour</p>
              <p className="text-xs text-gray-500">{job._count?.applications || 0} applications</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{job.restaurant.formattedAddress.split(',')[0]}</span>
            </div>
          </div>
          
          <div className={`mt-3 ${isExpanded ? '' : 'line-clamp-2'} text-gray-700`}>
            {job.description}
          </div>
          
          {isExpanded && job.requirements && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-900">Requirements:</h4>
              <p className="text-sm text-gray-600 mt-1">{job.requirements}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toggleExpandJob(job.id)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveJob(job.id)}
                className={isSaved ? 'text-pink-600 border-pink-600' : ''}
              >
                {isSaved ? (
                  <HeartSolidIcon className="h-5 w-5 mr-1 text-pink-600" />
                ) : (
                  <HeartIcon className="h-5 w-5 mr-1" />
                )}
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleApplyToJob(job.id)}
              >
                Apply Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderMapView = () => {
    return (
      <JobMap 
        jobs={jobs}
        userLocation={userLocation}
        onSelectJob={(jobId) => {
          const job = jobs.find(j => j.id === jobId);
          if (job) {
            setExpandedJob(jobId);
          }
        }}
        loading={loading}
      />
    );
  };

  const renderRecommendedJobs = () => {
    // In a real app, these would be personalized recommendations
    // Make sure jobs is an array before calling slice
    const recommendedJobs = Array.isArray(jobs) ? jobs.slice(0, 3) : [];
    
    if (recommendedJobs.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Recommended for You</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendedJobs.map(job => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-xs text-gray-600">{job.restaurant.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-green-600">${job.hourlyRate}/hr</p>
                  </div>
                </div>
                
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <MapPinIcon className="h-3 w-3 mr-1" />
                  <span>{job.restaurant.formattedAddress.split(',')[0]}</span>
                </div>
                
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={() => handleApplyToJob(job.id)}
                    className="w-full"
                  >
                    Quick Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4">
      {/* Quick Apply Modal */}
      {quickApplyJob && (
        <QuickApply
          jobId={quickApplyJob.id}
          jobTitle={quickApplyJob.title}
          restaurantName={quickApplyJob.restaurant.name}
          onApply={handleQuickApply}
          onClose={() => setQuickApplyJob(null)}
        />
      )}
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Job title, keywords, or restaurant name"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
            />
          </div>
          
          <div className="relative md:w-1/3">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Location (city, state, or zip)"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button onClick={handleSearch} className="flex-1 md:flex-none">
              Search Jobs
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 md:mr-1" />
              <span className="hidden md:inline">Filters</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Advanced Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(false)}
                className="text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Hourly Rate Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={filters.minHourlyRate}
                    onChange={(e) => handleFilterChange('minHourlyRate', Number(e.target.value))}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={filters.maxHourlyRate}
                    onChange={(e) => handleFilterChange('maxHourlyRate', Number(e.target.value))}
                  />
                </div>
              </div>
              
              {/* Date Range */}
              <div className="mt-4 md:mt-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                  <span className="hidden sm:block text-gray-500">to</span>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Distance */}
              <div className="mt-4 md:mt-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distance (miles)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    className="w-full"
                    value={filters.radius}
                    onChange={(e) => handleFilterChange('radius', Number(e.target.value))}
                  />
                  <span className="text-gray-700 font-medium w-8 text-right">{filters.radius}</span>
                </div>
              </div>
              
              {/* Job Types */}
              <div className="md:col-span-3 mt-4 md:mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {jobTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleJobTypeToggle(type)}
                      className={`px-3 py-1 text-sm rounded-full ${
                        filters.jobTypes.includes(type)
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Sort By */}
              <div className="md:col-span-3 mt-4 md:mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'relevance', label: 'Relevance' },
                    { value: 'date', label: 'Date' },
                    { value: 'hourlyRate', label: 'Hourly Rate' },
                    { value: 'distance', label: 'Distance' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('sortBy', option.value)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        filters.sortBy === option.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end mt-6 space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    query: '',
                    location: '',
                    radius: 10,
                    minHourlyRate: 0,
                    maxHourlyRate: 100,
                    jobTypes: [],
                    startDate: '',
                    endDate: '',
                    sortBy: 'relevance'
                  });
                }}
                className="w-full sm:w-auto"
              >
                Reset Filters
              </Button>
              <Button 
                onClick={handleSearch}
                className="w-full sm:w-auto"
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* View Toggle and Results Count */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          {Array.isArray(jobs) ? jobs.length : 0} jobs found
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center"
          >
            <ListBulletIcon className="h-5 w-5 sm:mr-1" />
            <span className="hidden sm:inline">List</span>
          </Button>
          
          <Button
            variant={viewMode === 'map' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="flex items-center"
          >
            <MapPinIcon className="h-5 w-5 sm:mr-1" />
            <span className="hidden sm:inline">Map</span>
          </Button>
        </div>
      </div>
      
      {/* Recommended Jobs */}
      {viewMode === 'list' && renderRecommendedJobs()}
      
      {/* Job List or Map View */}
      {viewMode === 'list' ? (
        <div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse mb-4">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-5 bg-gray-200 rounded w-16 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mt-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
                    <div className="flex justify-end mt-4">
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : Array.isArray(jobs) && jobs.length > 0 ? (
            <div>
              {jobs.map(job => renderJobCard(job))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FunnelIcon className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search filters or try again later.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilters({
                      query: '',
                      location: '',
                      radius: 10,
                      minHourlyRate: 0,
                      maxHourlyRate: 100,
                      jobTypes: [],
                      startDate: '',
                      endDate: '',
                      sortBy: 'relevance'
                    });
                    loadJobs();
                  }}
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        renderMapView()
      )}
    </div>
  );
}
