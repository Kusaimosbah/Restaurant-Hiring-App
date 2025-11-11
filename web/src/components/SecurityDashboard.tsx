import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastLoginAt: string;
  loginAttempts: number;
  sessionCount: number;
}

interface PrivacySettings {
  profileVisibility: string;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  cookieConsent: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
}

export default function SecurityDashboard() {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState<'2fa' | 'privacy' | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationToken, setVerificationToken] = useState('');

  useEffect(() => {
    loadSecurityData();
    loadPrivacySettings();
    loadAuditLogs();
  }, []);

  const loadSecurityData = async () => {
    try {
      const response = await fetch('/api/security/2fa');
      const data = await response.json();
      setSecuritySettings({
        twoFactorEnabled: data.enabled,
        lastLoginAt: new Date().toISOString(),
        loginAttempts: 0,
        sessionCount: 1,
      });
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const loadPrivacySettings = async () => {
    try {
      const response = await fetch('/api/gdpr/privacy-settings');
      const data = await response.json();
      setPrivacySettings(data || {
        profileVisibility: 'PRIVATE',
        dataProcessingConsent: false,
        marketingConsent: false,
        analyticsConsent: false,
        cookieConsent: false,
      });
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch('/api/audit/logs?limit=10');
      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const setup2FA = async () => {
    try {
      const response = await fetch('/api/security/2fa/setup', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setQrCode(data.qrCodeUrl);
        setBackupCodes(data.backupCodes);
        setSetupMode('2fa');
      }
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
    }
  };

  const verify2FA = async () => {
    try {
      const response = await fetch('/api/security/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      });

      if (response.ok) {
        setSetupMode(null);
        loadSecurityData();
        alert('2FA enabled successfully!');
      } else {
        alert('Invalid verification code');
      }
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
    }
  };

  const disable2FA = async () => {
    const token = prompt('Enter your 2FA code to disable:');
    if (!token) return;

    try {
      const response = await fetch('/api/security/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        loadSecurityData();
        alert('2FA disabled successfully!');
      } else {
        alert('Invalid verification code');
      }
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
    }
  };

  const updatePrivacySettings = async (updates: Partial<PrivacySettings>) => {
    try {
      const response = await fetch('/api/gdpr/privacy-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setPrivacySettings(prev => ({ ...prev, ...updates } as PrivacySettings));
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  };

  const exportData = async (format: 'JSON' | 'CSV' | 'PDF') => {
    try {
      const response = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      const data = await response.json();
      if (response.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      } else {
        alert('Data export is being processed. You will receive a notification when ready.');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security & Privacy Dashboard</h1>

      {/* Two-Factor Authentication */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">
              Status: {securitySettings?.twoFactorEnabled ? 
                <span className="text-green-600 font-medium">Enabled</span> : 
                <span className="text-orange-600 font-medium">Disabled</span>
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
          <div className="space-x-2">
            {securitySettings?.twoFactorEnabled ? (
              <Button onClick={disable2FA} variant="outline" className="bg-red-50 hover:bg-red-100">
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={setup2FA} className="bg-blue-600 hover:bg-blue-700">
                Enable 2FA
              </Button>
            )}
          </div>
        </div>

        {setupMode === '2fa' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Setup Two-Factor Authentication</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  1. Scan this QR code with your authenticator app:
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  2. Save these backup codes in a secure location:
                </p>
                <div className="bg-white p-3 rounded border font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index}>{code}</div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  3. Enter verification code from your authenticator app:
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    placeholder="000000"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <Button onClick={verify2FA}>Verify & Enable</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Privacy Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Profile Visibility</p>
              <p className="text-sm text-gray-500">Control who can see your profile</p>
            </div>
            <select
              value={privacySettings?.profileVisibility || 'PRIVATE'}
              onChange={(e) => updatePrivacySettings({ profileVisibility: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="PUBLIC">Public</option>
              <option value="RESTRICTED">Restricted</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Data Consent</h3>
            {[
              { key: 'dataProcessingConsent', label: 'Data Processing' },
              { key: 'marketingConsent', label: 'Marketing Communications' },
              { key: 'analyticsConsent', label: 'Analytics & Performance' },
              { key: 'cookieConsent', label: 'Cookies & Tracking' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <input
                  type="checkbox"
                  checked={privacySettings?.[key as keyof PrivacySettings] as boolean || false}
                  onChange={(e) => updatePrivacySettings({ [key]: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Data Export & Management */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Export Your Data</h3>
            <p className="text-sm text-gray-600 mb-3">
              Download a copy of all your data in your preferred format
            </p>
            <div className="space-x-2">
              <Button onClick={() => exportData('JSON')} variant="outline">
                Export as JSON
              </Button>
              <Button onClick={() => exportData('CSV')} variant="outline">
                Export as CSV
              </Button>
              <Button onClick={() => exportData('PDF')} variant="outline">
                Export as PDF
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2 text-red-600">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-3">
              These actions are permanent and cannot be undone
            </p>
            <div className="space-x-2">
              <Button 
                onClick={() => {
                  if (confirm('Are you sure you want to anonymize your data? This cannot be undone.')) {
                    fetch('/api/gdpr/delete-account', { 
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ confirmPassword: 'dummy' })
                    });
                  }
                }}
                variant="outline" 
                className="bg-orange-50 hover:bg-orange-100 text-orange-700"
              >
                Anonymize Data
              </Button>
              <Button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    fetch('/api/gdpr/delete-account', { 
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ confirmPassword: 'dummy' })
                    });
                  }
                }}
                variant="outline" 
                className="bg-red-50 hover:bg-red-100 text-red-700"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Security Activity</h2>
        <div className="space-y-3">
          {auditLogs.length > 0 ? (
            auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">{log.action} on {log.resource}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleString()} • IP: {log.ipAddress}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </Card>
    </div>
  );
}