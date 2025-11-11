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
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface WorkerProfile {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    profilePictureUrl?: string;
  };
  bio?: string;
  title?: string;
  yearsOfExperience?: number;
  experience?: string;
  hourlyRate?: number;
  contactPhone?: string;
  availability?: string;
  skills: string[];
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    dateObtained: string;
    expiryDate?: string;
    verified: boolean;
  }>;
  workHistory: Array<{
    id: string;
    jobTitle: string;
    restaurant: {
      name: string;
    };
    startDate: string;
    endDate?: string;
    rating?: number;
    feedback?: string;
  }>;
  performance: {
    averageRating: number;
    totalJobs: number;
    completedJobs: number;
    cancelledJobs: number;
    responseTime: number; // in hours
    reliability: number; // percentage
  };
  preferences: {
    maxDistance?: number;
    preferredWorkTypes: string[];
    availableDays: string[];
    availableHours: {
      start: string;
      end: string;
    };
  };
  verificationStatus: {
    identity: boolean;
    backgroundCheck: boolean;
    workEligibility: boolean;
    references: boolean;
  };
  createdAt: string;
  updatedAt: string;
  lastActive: string;
}

interface WorkerFilters {
  search: string;
  skills: string[];
  availability: string;
  rating: string;
  experience: string;
  verified: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const SKILL_OPTIONS = [
  'Kitchen Management', 'Food Safety', 'Customer Service', 'POS Systems',
  'Cash Handling', 'Team Leadership', 'Food Preparation', 'Cleaning',
  'Inventory Management', 'Bartending', 'Wine Service', 'Cooking',
  'Baking', 'Dishwashing', 'Host/Hostess', 'Wait Service'
];

const AVAILABILITY_OPTIONS = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'weekends', label: 'Weekends Only' },
  { value: 'evenings', label: 'Evenings Only' },
  { value: 'flexible', label: 'Flexible' }
];

const EXPERIENCE_LEVELS = [
  { value: '0-1', label: '0-1 years' },
  { value: '2-3', label: '2-3 years' },
  { value: '4-5', label: '4-5 years' },
  { value: '6+', label: '6+ years' }
];

export default function WorkersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [viewingWorker, setViewingWorker] = useState<WorkerProfile | null>(null);
  const [showWorkerDetails, setShowWorkerDetails] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters and sorting
  const [filters, setFilters] = useState<WorkerFilters>({
    search: searchParams.get('search') || '',
    skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
    availability: searchParams.get('availability') || '',
    rating: searchParams.get('rating') || '',
    experience: searchParams.get('experience') || '',
    verified: searchParams.get('verified') || '',
    sortBy: searchParams.get('sortBy') || 'lastActive',
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
    loadWorkers();
  }, [session, status, router, isAdmin, filters]);

  const loadWorkers = async () => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.skills.length > 0) queryParams.set('skills', filters.skills.join(','));
      if (filters.availability) queryParams.set('availability', filters.availability);
      if (filters.rating) queryParams.set('rating', filters.rating);
      if (filters.experience) queryParams.set('experience', filters.experience);
      if (filters.verified) queryParams.set('verified', filters.verified);
      if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/workers?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to load workers');
      
      const data = await response.json();
      setWorkers(data.workers || []);
    } catch (error) {
      console.error('Error loading workers:', error);
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<WorkerFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && (typeof value === 'string' || typeof value === 'number')) {
        params.set(key, value.toString());
      } else if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(','));
      } else {
        params.delete(key);
      }
    });
    router.push(`/dashboard/workers?${params.toString()}`);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'verify' | 'contact') => {
    if (selectedWorkers.length === 0) return;

    try {
      const response = await fetch('/api/workers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerIds: selectedWorkers, action })
      });

      if (!response.ok) throw new Error('Bulk action failed');

      toast.success(`Successfully ${action}d ${selectedWorkers.length} worker(s)`);
      setSelectedWorkers([]);
      setShowBulkActions(false);
      loadWorkers();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleWorkerStatusChange = async (workerId: string, newStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      const response = await fetch(`/api/workers/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update worker status');

      toast.success(`Worker ${newStatus.toLowerCase()}`);
      loadWorkers();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update worker status');
    }
  };

  const handleViewWorker = (worker: WorkerProfile) => {
    setViewingWorker(worker);
    setShowWorkerDetails(true);
  };

  const toggleWorkerSelection = (workerId: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedWorkers(prev => 
      prev.length === workers.length ? [] : workers.map(w => w.id)
    );
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
          title="Worker Management"
          subtitle={`${workers.length} worker${workers.length !== 1 ? 's' : ''} in your network`}
        />
        
        <div className="p-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search workers by name, skills, or title..."
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
                {(filters.skills.length > 0 || filters.availability || filters.rating || filters.experience || filters.verified) && (
                  <span className="bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {[...filters.skills, filters.availability, filters.rating, filters.experience, filters.verified].filter(Boolean).length}
                  </span>
                )}
              </Button>
              
              {selectedWorkers.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center gap-2"
                >
                  <UserGroupIcon className="h-4 w-4" />
                  Actions ({selectedWorkers.length})
                </Button>
              )}
              
              <Button onClick={loadWorkers} className="flex items-center gap-2">
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
                  {/* Skills Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    <select
                      multiple
                      value={filters.skills}
                      onChange={(e) => handleFilterChange({ 
                        skills: Array.from(e.target.selectedOptions, option => option.value)
                      })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      size={4}
                    >
                      {SKILL_OPTIONS.map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                    <select
                      value={filters.availability}
                      onChange={(e) => handleFilterChange({ availability: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="">All Availability</option>
                      {AVAILABILITY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
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

                  {/* Experience Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                    <select
                      value={filters.experience}
                      onChange={(e) => handleFilterChange({ experience: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="">Any Experience</option>
                      {EXPERIENCE_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Verified Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification</label>
                    <select
                      value={filters.verified}
                      onChange={(e) => handleFilterChange({ verified: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                    >
                      <option value="">All Workers</option>
                      <option value="verified">Verified Only</option>
                      <option value="unverified">Unverified Only</option>
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
                      <option value="lastActive">Last Active</option>
                      <option value="rating">Rating</option>
                      <option value="experience">Experience</option>
                      <option value="hourlyRate">Hourly Rate</option>
                      <option value="totalJobs">Jobs Completed</option>
                    </select>
                    
                    <select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="desc">High to Low</option>
                      <option value="asc">Low to High</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      search: '',
                      skills: [],
                      availability: '',
                      rating: '',
                      experience: '',
                      verified: '',
                      sortBy: 'lastActive',
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
          {showBulkActions && selectedWorkers.length > 0 && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-800">
                      {selectedWorkers.length} worker{selectedWorkers.length !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('activate')}
                        className="text-green-700 border-green-300 hover:bg-green-50"
                      >
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('deactivate')}
                        className="text-red-700 border-red-300 hover:bg-red-50"
                      >
                        Deactivate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('verify')}
                        className="text-blue-700 border-blue-300 hover:bg-blue-50"
                      >
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('contact')}
                        className="text-purple-700 border-purple-300 hover:bg-purple-50"
                      >
                        Contact
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedWorkers([]);
                      setShowBulkActions(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workers List */}
          <div className="space-y-4">
            {workers.length > 0 ? (
              <>
                {/* Select All Checkbox */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                  <input
                    type="checkbox"
                    checked={selectedWorkers.length === workers.length && workers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Select all workers ({workers.length})
                  </span>
                </div>

                {/* Worker Cards */}
                {workers.map((worker) => (
                  <Card key={worker.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedWorkers.includes(worker.id)}
                          onChange={() => toggleWorkerSelection(worker.id)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        {/* Profile Picture */}
                        <div className="flex-shrink-0">
                          {worker.user.profilePictureUrl ? (
                            <img
                              src={worker.user.profilePictureUrl}
                              alt={worker.user.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserGroupIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                {worker.user.name}
                                {worker.verificationStatus?.identity && (
                                  <ShieldCheckIcon className="h-5 w-5 text-green-500" title="Verified" />
                                )}
                              </h3>
                              <p className="text-sm text-gray-600">{worker.title || 'Restaurant Worker'}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                  <StarIconSolid className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm font-medium">
                                    {worker.performance.averageRating.toFixed(1)}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    ({worker.performance.totalJobs} jobs)
                                  </span>
                                </div>
                                {worker.hourlyRate && (
                                  <span className="text-sm font-semibold text-green-600">
                                    ${worker.hourlyRate}/hr
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Menu */}
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>

                          {/* Bio */}
                          {worker.bio && (
                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">{worker.bio}</p>
                          )}

                          {/* Skills */}
                          {worker.skills.length > 0 && (
                            <div className="mb-3">
                              <div className="flex flex-wrap gap-1">
                                {worker.skills.slice(0, 5).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {worker.skills.length > 5 && (
                                  <span className="text-xs text-gray-500 px-2 py-1">
                                    +{worker.skills.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Performance Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {worker.performance.completedJobs}
                              </div>
                              <div className="text-xs text-gray-500">Completed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {worker.performance.reliability}%
                              </div>
                              <div className="text-xs text-gray-500">Reliability</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {worker.performance.responseTime}h
                              </div>
                              <div className="text-xs text-gray-500">Response</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {worker.yearsOfExperience || 0}
                              </div>
                              <div className="text-xs text-gray-500">Years Exp</div>
                            </div>
                          </div>

                          {/* Contact Info & Actions */}
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {worker.contactPhone && (
                                <div className="flex items-center gap-1">
                                  <PhoneIcon className="h-4 w-4" />
                                  <span>{worker.contactPhone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <EnvelopeIcon className="h-4 w-4" />
                                <span>{worker.user.email}</span>
                              </div>
                              {worker.availability && (
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="h-4 w-4" />
                                  <span>{worker.availability}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewWorker(worker)}
                                className="flex items-center gap-1"
                              >
                                <EyeIcon className="h-4 w-4" />
                                View Profile
                              </Button>
                              <Button
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Workers Found</h3>
                  <p className="text-gray-500 mb-6">
                    {filters.search || filters.skills.length > 0 || filters.availability || filters.rating || filters.experience || filters.verified
                      ? "No workers match your current filters. Try adjusting your search criteria."
                      : "No workers have joined your network yet. Workers will appear here once they apply and are accepted for positions."
                    }
                  </p>
                  {(filters.search || filters.skills.length > 0 || filters.availability || filters.rating || filters.experience || filters.verified) && (
                    <Button
                      variant="outline"
                      onClick={() => setFilters({
                        search: '',
                        skills: [],
                        availability: '',
                        rating: '',
                        experience: '',
                        verified: '',
                        sortBy: 'lastActive',
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

        {/* Worker Details Modal */}
        {showWorkerDetails && viewingWorker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {viewingWorker.user.profilePictureUrl ? (
                      <img
                        src={viewingWorker.user.profilePictureUrl}
                        alt={viewingWorker.user.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserGroupIcon className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {viewingWorker.user.name}
                        {viewingWorker.verificationStatus?.identity && (
                          <ShieldCheckIcon className="h-6 w-6 text-green-500" />
                        )}
                      </h2>
                      <p className="text-gray-600">{viewingWorker.title || 'Restaurant Worker'}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <StarIconSolid className="h-5 w-5 text-yellow-400" />
                          <span className="font-medium">{viewingWorker.performance.averageRating.toFixed(1)}</span>
                          <span className="text-gray-500">({viewingWorker.performance.totalJobs} jobs)</span>
                        </div>
                        {viewingWorker.hourlyRate && (
                          <span className="font-semibold text-green-600">${viewingWorker.hourlyRate}/hr</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowWorkerDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Bio */}
                {viewingWorker.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-700">{viewingWorker.bio}</p>
                  </div>
                )}

                {/* Skills & Certifications */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {viewingWorker.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewingWorker.skills.map((skill, index) => (
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

                  {viewingWorker.certifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
                      <div className="space-y-2">
                        {viewingWorker.certifications.map((cert) => (
                          <div key={cert.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{cert.name}</div>
                              <div className="text-sm text-gray-600">{cert.issuer}</div>
                            </div>
                            {cert.verified && (
                              <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {viewingWorker.performance.completedJobs}
                      </div>
                      <div className="text-sm text-gray-500">Completed Jobs</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {viewingWorker.performance.reliability}%
                      </div>
                      <div className="text-sm text-gray-500">Reliability</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {viewingWorker.performance.responseTime}h
                      </div>
                      <div className="text-sm text-gray-500">Avg Response</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {viewingWorker.performance.cancelledJobs}
                      </div>
                      <div className="text-sm text-gray-500">Cancelled</div>
                    </div>
                  </div>
                </div>

                {/* Work History */}
                {viewingWorker.workHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Work History</h3>
                    <div className="space-y-3">
                      {viewingWorker.workHistory.map((job) => (
                        <div key={job.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{job.jobTitle}</h4>
                              <p className="text-gray-600">{job.restaurant.name}</p>
                            </div>
                            {job.rating && (
                              <div className="flex items-center gap-1">
                                <StarIconSolid className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm font-medium">{job.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(job.startDate).toLocaleDateString()} - {job.endDate ? new Date(job.endDate).toLocaleDateString() : 'Present'}
                          </div>
                          {job.feedback && (
                            <p className="text-sm text-gray-700 mt-2 italic">"{job.feedback}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button className="flex-1 flex items-center justify-center gap-2">
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                    Send Message
                  </Button>
                  {viewingWorker.contactPhone && (
                    <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                      <PhoneIcon className="h-5 w-5" />
                      Call
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 flex items-center justify-center gap-2">
                    <EnvelopeIcon className="h-5 w-5" />
                    Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}