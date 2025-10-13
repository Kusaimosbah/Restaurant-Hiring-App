'use client';

import { useEffect, useState } from 'react';
import { Form, FormField, FormSection, FormActions } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';

// US States for dropdown
const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

// Countries for dropdown (simplified list)
const countries = [
  { value: 'United States', label: 'United States' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Mexico', label: 'Mexico' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Other', label: 'Other' },
];

interface AddressFormProps {
  initialData?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function AddressForm({
  initialData = {},
  onSubmit,
  isLoading = false,
  onCancel,
}: AddressFormProps) {
  const [formData, setFormData] = useState({
    street: initialData.street || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zipCode || '',
    country: initialData.country || 'United States',
    latitude: initialData.latitude || null,
    longitude: initialData.longitude || null,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync with parent when initialData changes
  useEffect(() => {
    setFormData({
      street: initialData.street || '',
      city: initialData.city || '',
      state: initialData.state || '',
      zipCode: initialData.zipCode || '',
      country: initialData.country || 'United States',
      latitude: initialData.latitude || null,
      longitude: initialData.longitude || null,
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
    
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
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
      console.error('Error submitting form:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      street: initialData.street || '',
      city: initialData.city || '',
      state: initialData.state || '',
      zipCode: initialData.zipCode || '',
      country: initialData.country || 'United States',
      latitude: initialData.latitude || null,
      longitude: initialData.longitude || null,
    });
    setErrors({});
    onCancel?.();
  };

  // TODO: Add map component for selecting location (latitude/longitude)

  return (
    <Form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Address Details" description="Enter your restaurant's physical address">
        <FormField label="Street Address" htmlFor="street" error={errors.street}>
          <input
            type="text"
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="123 Main Street"
          />
        </FormField>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="City" htmlFor="city" error={errors.city}>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="San Francisco"
            />
          </FormField>
          
          <FormField label="State/Province" htmlFor="state" error={errors.state}>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select State</option>
              {usStates.map(state => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="ZIP/Postal Code" htmlFor="zipCode" error={errors.zipCode}>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="94102"
            />
          </FormField>
          
          <FormField label="Country" htmlFor="country">
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {countries.map(country => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>
      
      <FormSection title="Map Location" description="Coordinates for your restaurant (optional)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Latitude" htmlFor="latitude">
            <input
              type="number"
              step="0.000001"
              id="latitude"
              name="latitude"
              value={formData.latitude || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="37.7749"
            />
          </FormField>
          
          <FormField label="Longitude" htmlFor="longitude">
            <input
              type="number"
              step="0.000001"
              id="longitude"
              name="longitude"
              value={formData.longitude || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="-122.4194"
            />
          </FormField>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-500">
            Map integration for selecting location will be implemented in a future update.
          </p>
        </div>
      </FormSection>
      
      <FormActions>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Address'}
        </Button>
      </FormActions>
    </Form>
  );
}
