'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tab } from '@headlessui/react';
import { Restaurant, Address, Location, RestaurantPhoto, PaymentInfo } from '@prisma/client';
import BusinessDetailsForm from './BusinessDetailsForm';
import AddressForm from './AddressForm';
import LocationsManager from './LocationsManager';
import PhotoGallery from './PhotoGallery';
import PaymentInfoForm from './PaymentInfoForm';

// Define types for the profile data
type BusinessProfileData = {
  restaurant: (Restaurant & {
    address: Address | null;
    locations: Location[];
    photos: RestaurantPhoto[];
    paymentInfo: PaymentInfo | null;
  }) | null;
  isLoading: boolean;
  error: string | null;
};

// Define tabs for the profile sections
const tabs = [
  { name: 'Business Details', id: 'details' },
  { name: 'Address', id: 'address' },
  { name: 'Locations', id: 'locations' },
  { name: 'Photos', id: 'photos' },
  { name: 'Payment', id: 'payment' },
];

export default function BusinessProfile() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState<BusinessProfileData>({
    restaurant: null,
    isLoading: true,
    error: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch restaurant profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (status === 'loading') return;
      if (!session) return;

      try {
        setProfileData(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch('/api/restaurant/profile');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }
        
        const data = await response.json();
        setProfileData({
          restaurant: data,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching restaurant profile:', error);
        setProfileData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        }));
      }
    };

    fetchProfileData();
  }, [session, status]);

  // Handle saving business details
  const handleSaveBusinessDetails = async (data: any) => {
    if (!profileData.restaurant) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/restaurant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      const updatedRestaurant = await response.json();
      
      // Update the local state with the updated restaurant data
      setProfileData(prev => ({
        ...prev,
        restaurant: {
          ...prev.restaurant!,
          ...updatedRestaurant,
        },
      }));
      
      alert('Business details saved successfully!');
    } catch (error) {
      console.error('Error saving business details:', error);
      alert('Failed to save business details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle saving address
  const handleSaveAddress = async (data: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/restaurant/address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update address: ${response.status}`);
      }
      
      const updatedAddress = await response.json();
      
      // Update the local state with the updated address data
      setProfileData(prev => ({
        ...prev,
        restaurant: {
          ...prev.restaurant!,
          address: updatedAddress,
        },
      }));
      
      alert('Address saved successfully!');
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle unauthorized or loading state
  if (status === 'loading') {
    return <LoadingState />;
  }

  if (!session || session.user.role !== 'RESTAURANT_OWNER') {
    return <UnauthorizedState />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
          <p className="text-gray-600 mt-1">Manage your restaurant's information and settings</p>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Complete your profile to attract more applicants</span>
        </div>
      </div>
      
      {profileData.isLoading ? (
        <LoadingState />
      ) : profileData.error ? (
        <ErrorState error={profileData.error} />
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex p-2 space-x-2 bg-gray-50 border-b border-gray-200">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  className={({ selected }: { selected: boolean }) =>
                    `flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md transition-all duration-200
                     ${
                       selected
                         ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                         : 'text-gray-700 hover:text-indigo-500 hover:bg-white/50'
                     }`
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            
            <Tab.Panels className="p-8">
              {/* Business Details Panel */}
              <Tab.Panel>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-8 border border-blue-100">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Business Information
                  </h2>
                  <p className="text-gray-700 ml-8">
                    Update your restaurant's basic information, including name, description, and business type.
                  </p>
                </div>
                
                <BusinessDetailsForm 
                  initialData={{
                    name: profileData.restaurant?.name || '',
                    description: profileData.restaurant?.description || '',
                    phone: profileData.restaurant?.phone || '',
                    email: profileData.restaurant?.email || '',
                    businessType: profileData.restaurant?.businessType || '',
                    cuisineType: profileData.restaurant?.cuisineType || '',
                    websiteUrl: profileData.restaurant?.websiteUrl || '',
                    logoUrl: profileData.restaurant?.logoUrl || ''
                  }}
                  onSubmit={handleSaveBusinessDetails}
                  isLoading={isSaving}
                />
              </Tab.Panel>
              
              {/* Address Panel */}
              <Tab.Panel>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg mb-8 border border-green-100">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Business Address
                  </h2>
                  <p className="text-gray-700 ml-8">
                    Update your restaurant's primary address information.
                  </p>
                </div>
                
                <AddressForm 
                  initialData={profileData.restaurant?.address || {}}
                  onSubmit={handleSaveAddress}
                  isLoading={isSaving}
                />
              </Tab.Panel>
              
              {/* Locations Panel */}
              <Tab.Panel>
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg mb-8 border border-purple-100">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Multiple Locations
                  </h2>
                  <p className="text-gray-700 ml-8">
                    Manage all your restaurant locations. Add new branches or update existing ones.
                  </p>
                </div>
                
                <LocationsManager
                  locations={profileData.restaurant?.locations || []}
                  onAddLocation={async (locationData) => {
                    try {
                      setIsSaving(true);
                      
                      const response = await fetch('/api/restaurant/locations', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(locationData),
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to add location: ${response.status}`);
                      }
                      
                      const newLocation = await response.json();
                      
                      // Update the local state with the new location
                      setProfileData(prev => ({
                        ...prev,
                        restaurant: {
                          ...prev.restaurant!,
                          locations: [...(prev.restaurant?.locations || []), newLocation],
                        },
                      }));
                      
                      alert('Location added successfully!');
                    } catch (error) {
                      console.error('Error adding location:', error);
                      alert('Failed to add location. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onUpdateLocation={async (id, locationData) => {
                    try {
                      setIsSaving(true);
                      
                      const response = await fetch(`/api/restaurant/locations/${id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(locationData),
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to update location: ${response.status}`);
                      }
                      
                      const updatedLocation = await response.json();
                      
                      // Update the local state with the updated location
                      setProfileData(prev => ({
                        ...prev,
                        restaurant: {
                          ...prev.restaurant!,
                          locations: prev.restaurant?.locations.map(loc => 
                            loc.id === id ? updatedLocation : loc
                          ) || [],
                        },
                      }));
                      
                      alert('Location updated successfully!');
                    } catch (error) {
                      console.error('Error updating location:', error);
                      alert('Failed to update location. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onDeleteLocation={async (id) => {
                    try {
                      setIsSaving(true);
                      
                      const response = await fetch(`/api/restaurant/locations/${id}`, {
                        method: 'DELETE',
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to delete location: ${response.status}`);
                      }
                      
                      // Update the local state by removing the deleted location
                      setProfileData(prev => ({
                        ...prev,
                        restaurant: {
                          ...prev.restaurant!,
                          locations: prev.restaurant?.locations.filter(loc => loc.id !== id) || [],
                        },
                      }));
                      
                      alert('Location deleted successfully!');
                    } catch (error) {
                      console.error('Error deleting location:', error);
                      alert('Failed to delete location. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onSetMainLocation={async (id) => {
                    try {
                      setIsSaving(true);
                      
                      const response = await fetch(`/api/restaurant/locations/${id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ isMainLocation: true }),
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to set main location: ${response.status}`);
                      }
                      
                      // Update the local state to reflect the new main location
                      setProfileData(prev => ({
                        ...prev,
                        restaurant: {
                          ...prev.restaurant!,
                          locations: prev.restaurant?.locations.map(loc => ({
                            ...loc,
                            isMainLocation: loc.id === id,
                          })) || [],
                        },
                      }));
                      
                      alert('Main location updated successfully!');
                    } catch (error) {
                      console.error('Error setting main location:', error);
                      alert('Failed to set main location. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  isLoading={isSaving}
                />
              </Tab.Panel>
              
              {/* Photos Panel */}
              <Tab.Panel>
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg mb-8 border border-amber-100">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Photo Gallery
                  </h2>
                  <p className="text-gray-700 ml-8">
                    Upload and manage photos of your restaurant, food, and staff.
                  </p>
                </div>
                
                <PhotoGallery
                  photos={profileData.restaurant?.photos || []}
                  onAddPhoto={async (photoData) => {
                    try {
                      setIsSaving(true);
                      
                      const response = await fetch('/api/restaurant/photos', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(photoData),
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to add photo: ${response.status}`);
                      }
                      
                      const newPhoto = await response.json();
                      
                      // Update the local state with the new photo
                      setProfileData(prev => ({
                        ...prev,
                        restaurant: {
                          ...prev.restaurant!,
                          photos: [...(prev.restaurant?.photos || []), newPhoto],
                        },
                      }));
                      
                      alert('Photo uploaded successfully!');
                    } catch (error) {
                      console.error('Error adding photo:', error);
                      alert('Failed to upload photo. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onUpdatePhoto={async (id, photoData) => {
                    try {
                      setIsSaving(true);
                      
                      const response = await fetch(`/api/restaurant/photos/${id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(photoData),
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to update photo: ${response.status}`);
                      }
                      
                      const updatedPhoto = await response.json();
                      
                      // Update the local state with the updated photo
                      setProfileData(prev => ({
                        ...prev,
                        restaurant: {
                          ...prev.restaurant!,
                          photos: prev.restaurant?.photos.map(photo => 
                            photo.id === id ? updatedPhoto : photo
                          ) || [],
                        },
                      }));
                      
                      alert('Photo updated successfully!');
                    } catch (error) {
                      console.error('Error updating photo:', error);
                      alert('Failed to update photo. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onDeletePhoto={async (id) => {
                    try {
                      setIsSaving(true);
                      
                      const response = await fetch(`/api/restaurant/photos/${id}`, {
                        method: 'DELETE',
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to delete photo: ${response.status}`);
                      }
                      
                      // Update the local state by removing the deleted photo
                      setProfileData(prev => ({
                        ...prev,
                        restaurant: {
                          ...prev.restaurant!,
                          photos: prev.restaurant?.photos.filter(photo => photo.id !== id) || [],
                        },
                      }));
                      
                      alert('Photo deleted successfully!');
                    } catch (error) {
                      console.error('Error deleting photo:', error);
                      alert('Failed to delete photo. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  isLoading={isSaving}
                />
              </Tab.Panel>
              
              {/* Payment Panel */}
              <Tab.Panel>
                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-lg mb-8 border border-red-100">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Payment Information
                  </h2>
                  <p className="text-gray-700 ml-8">
                    Manage your payment details for processing transactions.
                  </p>
                </div>
                
                <PaymentInfoForm
                  initialData={profileData.restaurant?.paymentInfo || {}}
                  onSubmit={async (data) => {
                    try {
                      setIsSaving(true);
                      
                      const response = await fetch('/api/restaurant/payment', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Failed to update payment info: ${response.status}`);
                      }
                      
                      const updatedPaymentInfo = await response.json();
                      
                      // Update the local state with the updated payment info
                      setProfileData(prev => ({
                        ...prev,
                        restaurant: {
                          ...prev.restaurant!,
                          paymentInfo: updatedPaymentInfo,
                        },
                      }));
                      
                      alert('Payment information saved successfully!');
                    } catch (error) {
                      console.error('Error saving payment information:', error);
                      alert('Failed to save payment information. Please try again.');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  onConnectStripe={async () => {
                    try {
                      setIsSaving(true);
                      
                      // In a real app, this would redirect to Stripe Connect OAuth flow
                      // For demo purposes, we'll simulate connecting to Stripe
                      setTimeout(() => {
                        // Create a mock payment info object that matches the PaymentInfo type
                        const mockPaymentInfo: PaymentInfo = {
                          id: 'payment_' + Math.random().toString(36).substring(2, 15),
                          createdAt: new Date(),
                          updatedAt: new Date(),
                          restaurantId: profileData.restaurant?.id || '',
                          stripeCustomerId: 'cus_' + Math.random().toString(36).substring(2, 15),
                          stripeAccountId: 'acct_' + Math.random().toString(36).substring(2, 15),
                          bankAccountLast4: profileData.restaurant?.paymentInfo?.bankAccountLast4 || null,
                          cardLast4: profileData.restaurant?.paymentInfo?.cardLast4 || null,
                          isVerified: true
                        };
                        
                        setProfileData(prev => {
                          if (!prev.restaurant) return prev;
                          
                          return {
                            ...prev,
                            restaurant: {
                              ...prev.restaurant,
                              paymentInfo: mockPaymentInfo
                            }
                          };
                        });
                        
                        alert('Successfully connected to Stripe!');
                        setIsSaving(false);
                      }, 2000);
                      
                    } catch (error) {
                      console.error('Error connecting to Stripe:', error);
                      alert('Failed to connect to Stripe. Please try again.');
                      setIsSaving(false);
                    }
                  }}
                  isLoading={isSaving}
                  onCancel={() => {
                    // Reset form to initial data
                    alert('Changes cancelled');
                  }}
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      )}
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-md p-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
      <span className="text-gray-700 text-lg font-medium">Loading your profile...</span>
      <p className="text-gray-500 mt-2">This may take a few moments</p>
    </div>
  );
}

// Error state component
function ErrorState({ error }: { error: string }) {
  return (
    <div className="bg-red-50 p-6 rounded-lg border border-red-200 shadow-sm">
      <div className="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-red-800">Error loading profile</h3>
      </div>
      <p className="mt-2 text-red-600 font-medium">{error}</p>
      <p className="mt-4 text-gray-700">Please try refreshing the page or contact support if the problem persists.</p>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
      >
        Refresh Page
      </button>
    </div>
  );
}

// Unauthorized state component
function UnauthorizedState() {
  return (
    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 shadow-sm">
      <div className="flex items-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="text-lg font-medium text-yellow-800">Access Restricted</h3>
      </div>
      <p className="mt-2 text-gray-700">
        You must be logged in as a restaurant owner to access this page.
      </p>
      <a 
        href="/auth/signin" 
        className="mt-4 inline-block px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
      >
        Sign In
      </a>
    </div>
  );
}