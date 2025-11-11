'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BellIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '@/providers/NotificationProvider';

interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  applicationUpdates: boolean;
  messages: boolean;
  jobPostings: boolean;
  shiftReminders: boolean;
  reviewsAndRatings: boolean;
  paymentUpdates: boolean;
}

export default function NotificationSettings() {
  const { data: session } = useSession();
  const { showSuccess, showError } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    inAppEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    applicationUpdates: true,
    messages: true,
    jobPostings: true,
    shiftReminders: true,
    reviewsAndRatings: true,
    paymentUpdates: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current preferences
  useEffect(() => {
    if (session?.user) {
      loadPreferences();
    }
  }, [session]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        showSuccess('Settings Saved', 'Your notification preferences have been updated.');
      } else {
        showError('Save Failed', 'Failed to save notification preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showError('Save Failed', 'An error occurred while saving your preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showSuccess('Notifications Enabled', 'You will now receive browser notifications.');
        setPreferences(prev => ({ ...prev, pushEnabled: true }));
      } else {
        showError('Permission Denied', 'Browser notifications were denied. You can enable them in your browser settings.');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <BellIcon className="h-6 w-6 mr-2" />
            Notification Settings
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage how you receive notifications about job applications, messages, and updates.
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Delivery Methods */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Methods</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <BellIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">In-App Notifications</h3>
                    <p className="text-sm text-gray-500">Show notifications in the application</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.inAppEnabled}
                    onChange={() => handleToggle('inAppEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications by email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailEnabled}
                    onChange={() => handleToggle('emailEnabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Browser Notifications</h3>
                    <p className="text-sm text-gray-500">Show desktop notifications in your browser</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Enable
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.pushEnabled}
                      onChange={() => handleToggle('pushEnabled')}
                      className="sr-only peer"
                      disabled={typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied'}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h2>
            <div className="space-y-4">
              {[
                {
                  key: 'applicationUpdates',
                  title: 'Application Updates',
                  description: 'Get notified when your applications are reviewed or their status changes'
                },
                {
                  key: 'messages',
                  title: 'Messages',
                  description: 'Receive notifications for new messages and conversations'
                },
                {
                  key: 'jobPostings',
                  title: 'New Job Opportunities',
                  description: 'Get notified about new job postings that match your profile'
                },
                {
                  key: 'shiftReminders',
                  title: 'Shift Reminders',
                  description: 'Receive reminders about upcoming shifts and schedule changes'
                },
                {
                  key: 'reviewsAndRatings',
                  title: 'Reviews & Ratings',
                  description: 'Get notified when you receive new reviews or ratings'
                },
                {
                  key: 'paymentUpdates',
                  title: 'Payment Updates',
                  description: 'Receive notifications about payment processing and updates'
                }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[item.key as keyof NotificationPreferences] as boolean}
                      onChange={() => handleToggle(item.key as keyof NotificationPreferences)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={savePreferences}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}