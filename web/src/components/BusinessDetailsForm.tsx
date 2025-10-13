'use client';

import { useState } from 'react';
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
}

export default function BusinessDetailsForm({
  initialData = {},
  onSubmit,
  isLoading = false,
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

  return (
    <Form onSubmit={handleSubmit} className="space-y-6">
      <FormSection title="Basic Information" description="General information about your restaurant">
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
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </FormActions>
    </Form>
  );
}
