'use client';

import { useEffect, useState } from 'react';
import { Form, FormField, FormSection, FormActions } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';

interface PaymentInfoFormProps {
  initialData?: {
    stripeCustomerId?: string | null;
    stripeAccountId?: string | null;
    bankAccountLast4?: string | null;
    cardLast4?: string | null;
    isVerified?: boolean;
  };
  onSubmit: (data: any) => Promise<void>;
  onConnectStripe: () => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function PaymentInfoForm({
  initialData = {},
  onSubmit,
  onConnectStripe,
  isLoading = false,
  onCancel,
}: PaymentInfoFormProps) {
  const [formData, setFormData] = useState({
    bankAccountLast4: initialData.bankAccountLast4 || '',
    cardLast4: initialData.cardLast4 || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Determine if the account is connected to Stripe
  const isStripeConnected = Boolean(initialData.stripeCustomerId || initialData.stripeAccountId);
  
  // Sync with parent when initialData changes
  useEffect(() => {
    setFormData({
      bankAccountLast4: initialData.bankAccountLast4 || '',
      cardLast4: initialData.cardLast4 || '',
    });
    setErrors({});
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.bankAccountLast4 && formData.bankAccountLast4.length !== 4) {
      newErrors.bankAccountLast4 = 'Bank account should be last 4 digits';
    }
    
    if (formData.cardLast4 && formData.cardLast4.length !== 4) {
      newErrors.cardLast4 = 'Card number should be last 4 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting payment info:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      bankAccountLast4: initialData.bankAccountLast4 || '',
      cardLast4: initialData.cardLast4 || '',
    });
    setErrors({});
    onCancel?.();
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-lg border border-gray-100 shadow-sm p-6 text-gray-900">
      {/* Stripe Connection Status */}
      <div className={`p-6 rounded-lg shadow-sm border ${isStripeConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-1">
            {isStripeConnected ? (
              <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-lg font-medium ${isStripeConnected ? 'text-green-800' : 'text-yellow-800'}`}>
              {isStripeConnected ? 'Connected to Stripe' : 'Not Connected to Stripe'}
            </h3>
            <div className={`mt-2 text-sm ${isStripeConnected ? 'text-green-700' : 'text-yellow-700'}`}>
              {isStripeConnected ? (
                <p>
                  Your account is connected to Stripe for payment processing.
                  {initialData.isVerified && ' Your account is verified.'}
                </p>
              ) : (
                <p>
                  Connect your account to Stripe to process payments from customers.
                </p>
              )}
            </div>
            {!isStripeConnected && (
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={onConnectStripe}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                      </svg>
                      Connect with Stripe
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {isStripeConnected && (
        <FormSection title="Payment Information" description="Manage your payment details for processing transactions">
          <div className="space-y-4">
            {initialData.stripeCustomerId && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-sm text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <strong className="font-medium">Stripe Customer ID:</strong> <span className="ml-1">{initialData.stripeCustomerId}</span>
                </p>
              </div>
            )}
            
            {initialData.stripeAccountId && (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="text-sm text-gray-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <strong className="font-medium">Stripe Account ID:</strong> <span className="ml-1">{initialData.stripeAccountId}</span>
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Bank Account (Last 4 digits)" htmlFor="bankAccountLast4" error={errors.bankAccountLast4}>
                <input
                  type="text"
                  id="bankAccountLast4"
                  name="bankAccountLast4"
                  value={formData.bankAccountLast4}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                  placeholder="1234"
                  maxLength={4}
                  pattern="\d{4}"
                />
              </FormField>
              
              <FormField label="Card Number (Last 4 digits)" htmlFor="cardLast4" error={errors.cardLast4}>
                <input
                  type="text"
                  id="cardLast4"
                  name="cardLast4"
                  value={formData.cardLast4}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 bg-white"
                  placeholder="4242"
                  maxLength={4}
                  pattern="\d{4}"
                />
              </FormField>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
              <p className="text-sm text-blue-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Note:</strong> In a real application, these payment details would be securely managed through Stripe's API and dashboard. This form is for demonstration purposes only.
                </span>
              </p>
            </div>
          </div>
        </FormSection>
      )}
      
      {/* Payout Settings */}
      {isStripeConnected && (
        <FormSection title="Payout Settings" description="Configure how and when you receive your payments">
          <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-base font-medium text-gray-900">Payout Schedule</h4>
                <p className="mt-1 text-sm text-gray-700">
                  Your payouts are currently set to <strong>Weekly</strong>. Funds are deposited every Monday for the previous week's earnings.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex items-start">
              <div className="flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-base font-medium text-gray-900">Payout Method</h4>
                <p className="mt-1 text-sm text-gray-700">
                  Direct deposit to bank account ending in <strong>{formData.bankAccountLast4 || '****'}</strong>
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-gray-600">
                Payout settings are managed through your Stripe dashboard. Click the button below to access your Stripe account settings.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                  className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Stripe Dashboard
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </FormSection>
      )}
      
      {/* Form Actions */}
      {isStripeConnected && (
        <FormActions>
          <div className="flex items-center justify-between w-full border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-500">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </Button>
            </div>
          </div>
        </FormActions>
      )}
    </Form>
  );
}