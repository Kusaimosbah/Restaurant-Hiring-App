'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Tab } from '@headlessui/react';
import { Restaurant, Address, Location, RestaurantPhoto, PaymentInfo } from '@prisma/client';

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

  // Handle unauthorized or loading state
  if (status === 'loading') {
    return <LoadingState />;
  }

  if (!session || session.user.role !== 'RESTAURANT_OWNER') {
    return <UnauthorizedState />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Business Profile</h1>
      
      {profileData.isLoading ? (
        <LoadingState />
      ) : profileData.error ? (
        <ErrorState error={profileData.error} />
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-t-lg">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  className={({ selected }) =>
                    `w-full py-3 text-sm font-medium rounded-md
                     ${
                       selected
                         ? 'bg-white text-indigo-600 shadow'
                         : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                     }`
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            
            <Tab.Panels className="p-6">
              {/* Business Details Panel */}
              <Tab.Panel>
                <h2 className="text-xl font-semibold mb-4">Business Information</h2>
                <p className="text-gray-500 mb-6">
                  Update your restaurant's basic information, including name, description, and business type.
                </p>
                
                {/* TODO: Implement business details form */}
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-yellow-700">
                    Business details form will be implemented here.
                  </p>
                </div>
              </Tab.Panel>
              
              {/* Address Panel */}
              <Tab.Panel>
                <h2 className="text-xl font-semibold mb-4">Business Address</h2>
                <p className="text-gray-500 mb-6">
                  Update your restaurant's primary address information.
                </p>
                
                {/* TODO: Implement address form */}
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-yellow-700">
                    Address form will be implemented here.
                  </p>
                </div>
              </Tab.Panel>
              
              {/* Locations Panel */}
              <Tab.Panel>
                <h2 className="text-xl font-semibold mb-4">Multiple Locations</h2>
                <p className="text-gray-500 mb-6">
                  Manage all your restaurant locations. Add new branches or update existing ones.
                </p>
                
                {/* TODO: Implement locations management */}
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-yellow-700">
                    Locations management interface will be implemented here.
                  </p>
                </div>
              </Tab.Panel>
              
              {/* Photos Panel */}
              <Tab.Panel>
                <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
                <p className="text-gray-500 mb-6">
                  Upload and manage photos of your restaurant, food, and staff.
                </p>
                
                {/* TODO: Implement photo gallery */}
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-yellow-700">
                    Photo gallery management will be implemented here.
                  </p>
                </div>
              </Tab.Panel>
              
              {/* Payment Panel */}
              <Tab.Panel>
                <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
                <p className="text-gray-500 mb-6">
                  Manage your payment details for processing transactions.
                </p>
                
                {/* TODO: Implement payment info form */}
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-yellow-700">
                    Payment information form will be implemented here.
                  </p>
                </div>
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
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <span className="ml-3 text-gray-600">Loading profile...</span>
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
