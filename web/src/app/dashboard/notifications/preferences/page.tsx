'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Mail, Smartphone, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MobileSidebar from '@/components/MobileSidebar';

interface NotificationPreferences {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  applicationUpdates: boolean;
  messages: boolean;
  jobPostings: boolean;
  shiftReminders: boolean;
  reviewsAndRatings: boolean;
  paymentUpdates: boolean;
}

export default function NotificationPreferencesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch notification preferences on mount
  useEffect(() => {
    if (session?.user) {
      fetchPreferences();
    }
  }, [session]);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/notifications/preferences');
      
      if (!res.ok) {
        throw new Error('Failed to fetch notification preferences');
      }
      
      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      setError('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferences) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [field]: !preferences[field]
    });
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (!res.ok) {
        throw new Error('Failed to save notification preferences');
      }
      
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      setError('Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    router.push('/dashboard/notifications');
  };

  // Render toggle switch
  const Toggle = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean; 
    onChange: () => void; 
    label: string;
    description?: string;
  }) => (
    <div className="flex items-start justify-between py-4">
      <div>
        <label className="font-medium text-gray-700">{label}</label>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        onClick={onChange}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MobileSidebar />
      
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={goBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Notification Preferences</h1>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 text-red-700 rounded-lg">{error}</div>
          ) : preferences ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Methods</h2>
                
                <div className="space-y-1 border-b pb-4">
                  <Toggle
                    checked={preferences.inAppEnabled}
                    onChange={() => handleToggle('inAppEnabled')}
                    label="In-app notifications"
                    description="Receive notifications within the application"
                  />
                  
                  <Toggle
                    checked={preferences.emailEnabled}
                    onChange={() => handleToggle('emailEnabled')}
                    label="Email notifications"
                    description="Receive notifications via email"
                  />
                  
                  <Toggle
                    checked={preferences.pushEnabled}
                    onChange={() => handleToggle('pushEnabled')}
                    label="Push notifications"
                    description="Receive notifications on your mobile device or browser"
                  />
                </div>
                
                <h2 className="text-lg font-medium text-gray-900 mt-6 mb-4">Notification Types</h2>
                
                <div className="space-y-1">
                  <Toggle
                    checked={preferences.applicationUpdates}
                    onChange={() => handleToggle('applicationUpdates')}
                    label="Application updates"
                    description="Updates about your job applications or received applications"
                  />
                  
                  <Toggle
                    checked={preferences.messages}
                    onChange={() => handleToggle('messages')}
                    label="Messages"
                    description="New messages and conversations"
                  />
                  
                  <Toggle
                    checked={preferences.jobPostings}
                    onChange={() => handleToggle('jobPostings')}
                    label="Job postings"
                    description="New job opportunities that match your profile"
                  />
                  
                  <Toggle
                    checked={preferences.shiftReminders}
                    onChange={() => handleToggle('shiftReminders')}
                    label="Shift reminders"
                    description="Reminders about upcoming shifts and schedule changes"
                  />
                  
                  <Toggle
                    checked={preferences.reviewsAndRatings}
                    onChange={() => handleToggle('reviewsAndRatings')}
                    label="Reviews and ratings"
                    description="New reviews and ratings for your profile or restaurant"
                  />
                  
                  <Toggle
                    checked={preferences.paymentUpdates}
                    onChange={() => handleToggle('paymentUpdates')}
                    label="Payment updates"
                    description="Updates about payments, invoices, and financial information"
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                <div>
                  {saveSuccess && (
                    <span className="text-green-600 text-sm">
                      Preferences saved successfully!
                    </span>
                  )}
                </div>
                
                <button
                  onClick={savePreferences}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    isSaving
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
