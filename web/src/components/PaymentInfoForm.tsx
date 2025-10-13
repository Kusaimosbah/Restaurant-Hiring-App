'use client';

import { useState } from 'react';
import { PaymentInfo } from '@prisma/client';
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
}

export default function PaymentInfoForm({
  initialData = {},
  onSubmit,
  onConnectStripe,
  isLoading = false,
}: PaymentInfoFormProps) {
  const [formData, setFormData] = useState({
    bankAccountLast4: initialData.bankAccountLast4 || '',
    cardLast4: initialData.cardLast4 || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Determine if the account is connected to Stripe
  const isStripeConnected = Boolean(initialData.stripeCustomerId || initialData.stripeAccountId);
  
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

  const handleConnectStripe = async () => {
    try {
      await onConnectStripe();
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Connection Status */}
      <div className={`p-4 rounded-md ${isStripeConnected ? 'bg-green-50' : 'bg-yellow-50'}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            {isStripeConnected ? (
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-sm font-medium ${isStripeConnected ? 'text-green-800' : 'text-yellow-800'}`}>
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
                  onClick={handleConnectStripe}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                >
                  Connect with Stripe
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <FormSection title="Payment Information" description="Manage your payment details for processing transactions">
        {isStripeConnected && (
          <div className="space-y-4">
            {initialData.stripeCustomerId && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Stripe Customer ID:</strong> {initialData.stripeCustomerId}
                </p>
              </div>
            )}
            
            {initialData.stripeAccountId && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Stripe Account ID:</strong> {initialData.stripeAccountId}
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="4242"
                  maxLength={4}
                  pattern="\d{4}"
                />
              </FormField>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> In a real application, these payment details would be securely managed through Stripe's API and dashboard. This form is for demonstration purposes only.
              </p>
            </div>
          </div>
        )}
      </FormSection>
      
      {/* Payout Settings */}
      {isStripeConnected && (
        <FormSection title="Payout Settings" description="Configure how and when you receive your payments">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">
              Payout settings are managed through your Stripe dashboard. Click the button below to access your Stripe account settings.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                className="text-indigo-600 border-indigo-600"
              >
                Open Stripe Dashboard
              </Button>
            </div>
          </div>
        </FormSection>
      )}
      
      {/* Form Actions */}
      {isStripeConnected && (
        <FormActions>
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Payment Information'}
          </Button>
        </FormActions>
      )}
    </Form>
  );
}
