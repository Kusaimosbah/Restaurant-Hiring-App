import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Integration Hub Dashboard Component
 * Manages third-party integrations for restaurants
 */

interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  category: string;
  authType: string;
  capabilities: string[];
  webhookSupport: boolean;
  pricing: string;
  setupInstructions: string;
  configSchema: any;
}

interface Integration {
  id: string;
  name: string;
  providerId: string;
  status: string;
  lastSync?: string;
  lastError?: string;
  isActive: boolean;
  provider?: IntegrationProvider;
  syncLogs?: any[];
}

export default function IntegrationHubDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'installed' | 'available'>('installed');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [setupModal, setSetupModal] = useState<{ show: boolean; provider?: IntegrationProvider }>({ show: false });

  // Load integrations and providers
  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [integrationsRes, providersRes] = await Promise.all([
        fetch('/api/integrations'),
        fetch('/api/integrations/providers')
      ]);

      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        setIntegrations(data.integrations || []);
      }

      if (providersRes.ok) {
        const data = await providersRes.json();
        setProviders(data.providers || []);
      }

    } catch (error) {
      setError('Failed to load integration data');
      console.error('Integration data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationSetup = (provider: IntegrationProvider) => {
    setSetupModal({ show: true, provider });
  };

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        await loadData();
      } else {
        throw new Error('Failed to update integration');
      }
    } catch (error) {
      console.error('Toggle integration error:', error);
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadData();
      } else {
        throw new Error('Failed to sync integration');
      }
    } catch (error) {
      console.error('Sync integration error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'text-green-600 bg-green-100';
      case 'ERROR': return 'text-red-600 bg-red-100';
      case 'SYNCING': return 'text-blue-600 bg-blue-100';
      case 'PENDING_AUTH': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATS':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'PAYROLL':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'HR':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'BACKGROUND_CHECK':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'COMMUNICATION':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
    }
  };

  const filteredProviders = providers.filter(provider => 
    selectedCategory === 'all' || provider.category === selectedCategory
  );

  const categories = ['all', ...Array.from(new Set(providers.map(p => p.category)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Integration Hub</h1>
              <p className="mt-1 text-sm text-gray-500">
                Connect your restaurant with third-party services for seamless operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {integrations.filter(i => i.isActive).length} active integrations
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('installed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'installed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Installed ({integrations.length})
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Available ({providers.length})
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Installed Integrations */}
        {activeTab === 'installed' && (
          <div className="space-y-6">
            {integrations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations installed</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by setting up your first integration</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Browse Available Integrations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                  <div key={integration.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(integration.provider?.category || 'default')}
                        <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                        {integration.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                      {integration.provider?.description}
                    </p>

                    {integration.lastSync && (
                      <p className="text-xs text-gray-500 mb-2">
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                      </p>
                    )}

                    {integration.lastError && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-4">
                        <p className="text-xs text-red-600">{integration.lastError}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleIntegration(integration.id, !integration.isActive)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            integration.isActive ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              integration.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-sm text-gray-600">
                          {integration.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSyncIntegration(integration.id)}
                          disabled={!integration.isActive || integration.status === 'SYNCING'}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Sync now"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {/* Open settings modal */}}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Settings"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Integrations */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Filter by category:</span>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedCategory === category
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category === 'all' ? 'All' : category.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => {
                const isInstalled = integrations.some(i => i.providerId === provider.id);
                
                return (
                  <div key={provider.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      {getCategoryIcon(provider.category)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{provider.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          provider.pricing === 'FREE' ? 'bg-green-100 text-green-800' :
                          provider.pricing === 'PREMIUM' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {provider.pricing}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{provider.description}</p>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Capabilities:</h4>
                      <div className="flex flex-wrap gap-1">
                        {provider.capabilities.slice(0, 3).map(capability => (
                          <span
                            key={capability}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                          >
                            {capability.replace('_', ' ')}
                          </span>
                        ))}
                        {provider.capabilities.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{provider.capabilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {provider.webhookSupport && (
                          <span className="flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Webhooks
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleIntegrationSetup(provider)}
                        disabled={isInstalled}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          isInstalled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isInstalled ? 'Installed' : 'Setup'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {setupModal.show && setupModal.provider && (
        <IntegrationSetupModal
          provider={setupModal.provider}
          onClose={() => setSetupModal({ show: false })}
          onSuccess={() => {
            setSetupModal({ show: false });
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Integration Setup Modal Component
function IntegrationSetupModal({
  provider,
  onClose,
  onSuccess
}: {
  provider: IntegrationProvider;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'instructions' | 'credentials' | 'testing'>('instructions');

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: provider.id,
          credentials,
          config
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Setup failed');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Setup {provider.name} Integration
              </h3>
              <p className="mt-1 text-sm text-gray-500">{provider.description}</p>
            </div>

            {step === 'instructions' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Setup Instructions</h4>
                <div className="bg-blue-50 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800">{provider.setupInstructions}</p>
                </div>
                <button
                  onClick={() => setStep('credentials')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Continue to Credentials
                </button>
              </div>
            )}

            {step === 'credentials' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Enter Credentials</h4>
                <div className="space-y-4">
                  {Object.entries(provider.configSchema).map(([field, schema]: [string, any]) => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        {schema.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={field.toLowerCase().includes('secret') || field.toLowerCase().includes('password') ? 'password' : 'text'}
                        value={credentials[field] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={schema.placeholder || ''}
                      />
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setStep('instructions')}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Testing...' : 'Test & Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}