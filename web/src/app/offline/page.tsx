import React from 'react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">You're Offline</h2>
          <p className="text-lg text-gray-600 mb-8">
            It looks like you've lost your internet connection. Don't worry, you can still browse some content that's been saved for offline viewing.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Available Offline Actions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Offline</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <OfflineFeatureCard
                  icon="📊"
                  title="Dashboard"
                  description="View cached dashboard data"
                  href="/dashboard"
                />
                <OfflineFeatureCard
                  icon="👤"
                  title="Profile"
                  description="View and edit your profile"
                  href="/profile"
                />
                <OfflineFeatureCard
                  icon="💼"
                  title="Saved Jobs"
                  description="Browse jobs you've viewed"
                  href="/jobs?cached=true"
                />
                <OfflineFeatureCard
                  icon="📝"
                  title="Draft Applications"
                  description="Work on saved applications"
                  href="/applications/drafts"
                />
              </div>
            </div>

            {/* Offline Actions Queue */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Actions</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Actions will sync when connection is restored
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Any applications, messages, or profile updates you make while offline will be automatically synced when you're back online.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="border-t border-gray-200 pt-6">
              <ConnectionStatus />
            </div>

            {/* Help Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Check your internet connection</p>
                <p>• Make sure you're connected to Wi-Fi or mobile data</p>
                <p>• Try refreshing the page when your connection is restored</p>
                <p>• Contact support if problems persist</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfflineFeatureCard({ 
  icon, 
  title, 
  description, 
  href 
}: { 
  icon: string; 
  title: string; 
  description: string; 
  href: string; 
}) {
  return (
    <a
      href={href}
      className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-start space-x-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <div className="flex-shrink-0">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="absolute inset-0" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </a>
  );
}

function ConnectionStatus() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isChecking, setIsChecking] = React.useState(false);

  React.useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache' 
      });
      setIsOnline(response.ok);
      if (response.ok) {
        window.location.reload();
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-sm text-gray-700">
          {isOnline ? 'Connection restored' : 'No internet connection'}
        </span>
      </div>
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isChecking ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Checking...
          </>
        ) : (
          'Check Connection'
        )}
      </button>
    </div>
  );
}