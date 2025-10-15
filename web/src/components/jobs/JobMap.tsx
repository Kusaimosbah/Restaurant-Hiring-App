'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MapPinIcon } from '@heroicons/react/24/outline';

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
  address: string;
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
}

interface JobMapProps {
  jobs: Job[];
  onSelectJob: (jobId: string) => void;
  userLocation?: { lat: number; lng: number };
  loading?: boolean;
}

// Mock function to get coordinates for jobs that don't have lat/lng
// In a real app, this would use a geocoding service
const getCoordinatesForJob = (job: Job): { lat: number; lng: number } => {
  // Generate random coordinates around a central point
  // In a real app, these would come from geocoding the address
  const centralLat = 37.7749; // San Francisco
  const centralLng = -122.4194;
  
  // Generate a random offset within ~5 miles
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  
  return {
    lat: centralLat + latOffset,
    lng: centralLng + lngOffset
  };
};

export default function JobMap({ jobs, onSelectJob, userLocation: initialUserLocation, loading = false }: JobMapProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>(initialUserLocation);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  
  // In a real app, this would use a map library like Google Maps or Mapbox
  // For this example, we'll create a simplified map visualization
  
  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
    
    setIsLocating(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userLoc);
        setIsLocating(false);
        console.log("User location:", userLoc);
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setIsLocating(false);
        console.error("Geolocation error:", error);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
  
  useEffect(() => {
    if (mapLoaded && jobs.length > 0) {
      renderMap();
    }
  }, [mapLoaded, jobs]);
  
  const renderMap = () => {
    // In a real app, this would initialize the map and add markers
    // For this example, we'll just log the jobs that would be displayed on the map
    console.log('Rendering map with jobs:', jobs);
  };
  
  const handleMarkerClick = (jobId: string) => {
    setSelectedJobId(jobId);
    onSelectJob(jobId);
  };
  
  // Find the selected job
  const selectedJob = jobs.find(job => job.id === selectedJobId);
  
  if (loading) {
    return (
      <div className="relative h-[calc(100vh-200px)] bg-gray-100 rounded-lg animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPinIcon className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-400">Loading map...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="relative h-[calc(100vh-300px)] bg-gray-100 rounded-lg border border-gray-200 overflow-hidden"
      >
        {!mapLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPinIcon className="h-12 w-12 mx-auto text-gray-400 animate-bounce" />
              <p className="mt-2 text-gray-500">Loading map...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPinIcon className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No jobs found in this area</p>
            </div>
          </div>
        ) : (
          <>
            {/* Map Placeholder */}
            <div className="absolute inset-0 bg-blue-50">
              {/* Grid lines to simulate a map */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                {Array(64).fill(0).map((_, i) => (
                  <div key={i} className="border border-blue-100"></div>
                ))}
              </div>
              
              {/* Job Markers */}
              {jobs.map((job) => {
                const coords = getCoordinatesForJob(job);
                // Convert coordinates to position in the div
                // This is a simplified version - in a real map, you'd use the map's projection
                const left = `${((coords.lng + 122.5) / 0.2) * 100}%`;
                const top = `${(1 - (coords.lat - 37.7) / 0.2) * 100}%`;
                
                return (
                  <div
                    key={job.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                      selectedJobId === job.id ? 'z-10' : 'z-0'
                    }`}
                    style={{ left, top }}
                    onClick={() => handleMarkerClick(job.id)}
                  >
                    <div className={`p-1 rounded-full ${
                      selectedJobId === job.id ? 'bg-indigo-500' : 'bg-red-500'
                    }`}>
                      <MapPinIcon className={`h-5 w-5 ${
                        selectedJobId === job.id ? 'text-white' : 'text-white'
                      }`} />
                    </div>
                    {selectedJobId === job.id && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white p-2 rounded-md shadow-lg z-20 w-48">
                        <p className="font-medium text-sm">{job.title}</p>
                        <p className="text-xs text-gray-600">{job.restaurant.name}</p>
                        <p className="text-xs font-medium text-green-600">${job.hourlyRate}/hr</p>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* User Location */}
              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{
                    left: `${((userLocation.lng + 122.5) / 0.2) * 100}%`,
                    top: `${(1 - (userLocation.lat - 37.7) / 0.2) * 100}%`
                  }}
                >
                  <div className="relative">
                    <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-animation"></div>
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                      You are here
                    </div>
                  </div>
                </div>
              )}
              
              {/* Location Error Message */}
              {locationError && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md shadow-md">
                  {locationError}
                </div>
              )}
              
              {/* Loading Location Indicator */}
              {isLocating && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded-md shadow-md flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Getting your location...
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button size="sm" variant="default" className="bg-white text-gray-800 shadow-md">
            <span className="text-xl font-bold">+</span>
          </Button>
          <Button size="sm" variant="default" className="bg-white text-gray-800 shadow-md">
            <span className="text-xl font-bold">−</span>
          </Button>
          <Button 
            size="sm" 
            variant="default" 
            className={`${isLocating ? 'animate-pulse' : ''} bg-white text-gray-800 shadow-md`}
            onClick={getUserLocation}
            disabled={isLocating}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
        </div>
      </div>
      
      {/* Selected Job Card */}
      {selectedJob && (
        <Card className="border border-indigo-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedJob.title}</h3>
                <p className="text-sm text-gray-600">{selectedJob.restaurant.name} • {selectedJob.restaurant.address}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">${selectedJob.hourlyRate}/hour</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                <span>{selectedJob.restaurant.address.split(',')[0]}</span>
              </div>
            </div>
            
            <div className="mt-3 line-clamp-2 text-gray-700">
              {selectedJob.description}
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => onSelectJob(selectedJob.id)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Job List Summary */}
      <div className="bg-white rounded-md shadow p-4">
        <h3 className="font-medium mb-2">{jobs.length} jobs in this area</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {jobs.map(job => (
            <div 
              key={job.id}
              className={`p-2 rounded cursor-pointer ${
                selectedJobId === job.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleMarkerClick(job.id)}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-sm">{job.title}</p>
                  <p className="text-xs text-gray-600">{job.restaurant.name}</p>
                </div>
                <p className="text-sm font-medium text-green-600">${job.hourlyRate}/hr</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>
    </div>
  );
}
