'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Restaurant, Address, Location, RestaurantPhoto, PaymentInfo } from '@prisma/client';
import BusinessDetailsForm from './BusinessDetailsForm';
import AddressForm from './AddressForm';
import LocationsManager from './LocationsManager';
import PhotoGallery from './PhotoGallery';
import PaymentInfoForm from './PaymentInfoForm';
import ResponsiveTabs from './ui/ResponsiveTabs';
import './BusinessProfile.css';

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
  const router = useRouter();
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
    <div className="container mx-auto px-4 py-8 business-profile-container">
      <div className="flex items-center mb-6">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Button>
        <h1 style={{color: '#6b7280 !important', fontSize: '1.875rem', fontWeight: '700 !important', textDecoration: 'none', lineHeight: '1.2'}}>Business Profile</h1>
      </div>
      
      {profileData.isLoading ? (
        <LoadingState />
      ) : profileData.error ? (
        <ErrorState error={profileData.error} />
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <ResponsiveTabs
            tabs={[
              {
                id: 'details',
                name: 'Business Details',
                content: (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Business Information</h2>
                    <p className="text-gray-500 mb-6">
                      Update your restaurant's basic information, including name, description, and business type.
                    </p>
                    
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
                  </>
                )
              },
              {
                id: 'address',
                name: 'Address',
                content: (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Business Address</h2>
                    <p className="text-gray-500 mb-6">
                      Update your restaurant's primary address information.
                    </p>
                    
                    <AddressForm 
                      initialData={profileData.restaurant?.address || {}}
                      onSubmit={handleSaveAddress}
                      isLoading={isSaving}
                    />
                  </>
                )
              },
              {
                id: 'locations',
                name: 'Locations',
                content: (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Multiple Locations</h2>
                    <p className="text-gray-500 mb-6">
                      Manage all your restaurant locations. Add new branches or update existing ones.
                    </p>
                    
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
                  </>
                )
              },
              {
                id: 'photos',
                name: 'Photos',
                content: (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
                    <p className="text-gray-500 mb-6">
                      Upload and manage photos of your restaurant, food, and staff.
                    </p>
                    
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
                  </>
                )
              },
              {
                id: 'payment',
                name: 'Payment',
                content: (
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
                    onCancel={() => {
                      alert('Payment changes cancelled');
                    }}
                    isLoading={isSaving}
                  />
                )
              }
            ]}
            defaultTab={activeTab}
            onChange={setActiveTab}
            className="business-profile-tabs"
          />
        </div>
      )}
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <span className="ml-3" style={{color: '#000000'}}>Loading profile...</span>
    </div>
  );
}

// Error state component
function ErrorState({ error }: { error: string }) {
  return (
    <div className="bg-red-50 p-4 rounded-md">
      <h3 className="text-lg font-medium text-red-800">Error loading profile</h3>
      <p className="mt-2 text-red-600">{error}</p>
      <p className="mt-2">Please try refreshing the page or contact support if the problem persists.</p>
    </div>
  );
}

// Unauthorized state component
function UnauthorizedState() {
  return (
    <div className="bg-yellow-50 p-4 rounded-md">
      <h3 className="text-lg font-medium text-yellow-800">Access Restricted</h3>
      <p className="mt-2 text-yellow-600">
        You must be logged in as a restaurant owner to access this page.
      </p>
    </div>
  );
}