'use client';

import { useEffect, useState } from 'react';
import { Form, FormField, FormSection, FormActions } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';

// Business types options
const businessTypes = [
  { value: 'FINE_DINING', label: 'Fine Dining' },
  { value: 'CASUAL_DINING', label: 'Casual Dining' },
  { value: 'FAST_CASUAL', label: 'Fast Casual' },
  { value: 'FAST_FOOD', label: 'Fast Food' },
  { value: 'CAFE', label: 'Café' },
  { value: 'BISTRO', label: 'Bistro' },
  { value: 'PUB', label: 'Pub/Bar' },
  { value: 'FOOD_TRUCK', label: 'Food Truck' },
  { value: 'BUFFET', label: 'Buffet' },
  { value: 'GHOST_KITCHEN', label: 'Ghost Kitchen' },
  { value: 'OTHER', label: 'Other' },
];

// Cuisine types options
const cuisineTypes = [
  { value: 'AMERICAN', label: 'American' },
  { value: 'ITALIAN', label: 'Italian' },
  { value: 'MEXICAN', label: 'Mexican' },
  { value: 'CHINESE', label: 'Chinese' },
  { value: 'JAPANESE', label: 'Japanese' },
  { value: 'INDIAN', label: 'Indian' },
  { value: 'FRENCH', label: 'French' },
  { value: 'MEDITERRANEAN', label: 'Mediterranean' },
  { value: 'THAI', label: 'Thai' },
  { value: 'KOREAN', label: 'Korean' },
  { value: 'VIETNAMESE', label: 'Vietnamese' },
  { value: 'GREEK', label: 'Greek' },
  { value: 'SPANISH', label: 'Spanish' },
  { value: 'MIDDLE_EASTERN', label: 'Middle Eastern' },
  { value: 'FUSION', label: 'Fusion' },
  { value: 'VEGETARIAN', label: 'Vegetarian/Vegan' },
  { value: 'SEAFOOD', label: 'Seafood' },
  { value: 'BBQ', label: 'BBQ' },
  { value: 'STEAKHOUSE', label: 'Steakhouse' },
  { value: 'DESSERT', label: 'Dessert/Bakery' },
  { value: 'OTHER', label: 'Other' },
];

interface BusinessDetailsFormProps {
  initialData?: {
    name?: string;
    description?: string;
    phone?: string;
    email?: string;
    businessType?: string;
    cuisineType?: string;
    websiteUrl?: string;
    logoUrl?: string;
  };
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function BusinessDetailsForm({
  initialData = {},
  onSubmit,
  isLoading = false,
  onCancel,
}: BusinessDetailsFormProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    businessType: initialData.businessType || '',
    cuisineType: initialData.cuisineType || '',
    websiteUrl: initialData.websiteUrl || '',
    logoUrl: initialData.logoUrl || '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Keep form in sync if parent provides new initialData
  useEffect(() => {
    setFormData({
      name: initialData.name || '',
      description: initialData.description || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      businessType: initialData.businessType || '',
      cuisineType: initialData.cuisineType || '',
      websiteUrl: initialData.websiteUrl || '',
      logoUrl: initialData.logoUrl || '',
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.websiteUrl && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
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
    // Reset all fields back to the initial values and clear errors
    setFormData({
      name: initialData.name || '',
      description: initialData.description || '',
      phone: initialData.phone || '',
      email: initialData.email || '',
      businessType: initialData.businessType || '',
      cuisineType: initialData.cuisineType || '',
      websiteUrl: initialData.websiteUrl || '',
      logoUrl: initialData.logoUrl || '',
    });
    setErrors({});
    onCancel?.();
  };

  return (
    <Form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-lg border border-gray-100 shadow-sm p-6">
      <FormSection title="Basic Information" description="General information about your restaurant">
        <div className="border-l-4 border-indigo-500 pl-4 py-1 mb-4 bg-indigo-50 rounded-r-md">
          <p className="text-sm text-indigo-700">This information will be displayed to potential employees</p>
        </div>
        <FormField label="Business Name" htmlFor="name" error={errors.name}>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="The Golden Fork"
          />
        </FormField>
        
        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Tell customers about your restaurant..."
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Business Type & Cuisine" description="Categorize your restaurant to help customers find you">
        <div className="border-l-4 border-green-500 pl-4 py-1 mb-4 bg-green-50 rounded-r-md">
          <p className="text-sm text-green-700">Proper categorization helps job seekers find your restaurant</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Business Type" htmlFor="businessType">
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select Business Type</option>
              {businessTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>
          
          <FormField label="Cuisine Type" htmlFor="cuisineType">
            <select
              id="cuisineType"
              name="cuisineType"
              value={formData.cuisineType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select Cuisine Type</option>
              {cuisineTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </FormSection>
      
      <FormSection title="Contact Information" description="How customers can reach your business">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Phone Number" htmlFor="phone">
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="+1 (555) 123-4567"
            />
          </FormField>
          
          <FormField label="Email Address" htmlFor="email" error={errors.email}>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="contact@restaurant.com"
            />
          </FormField>
        </div>
      </FormSection>
      
      <FormSection title="Web Presence" description="Your restaurant's online presence">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Website URL" htmlFor="websiteUrl" error={errors.websiteUrl}>
            <input
              type="url"
              id="websiteUrl"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="https://www.yourrestaurant.com"
            />
          </FormField>
          
          <FormField label="Logo URL" htmlFor="logoUrl">
            <input
              type="url"
              id="logoUrl"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="https://www.yourrestaurant.com/logo.png"
            />
          </FormField>
        </div>
      </FormSection>
      
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
    </Form>
  );
}
