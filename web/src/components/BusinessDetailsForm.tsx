'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  FormField, 
  FormRow, 
  FormColumn, 
  FormSection, 
  FormActions, 
  ResponsiveInput, 
  ResponsiveSelect, 
  ResponsiveTextarea 
} from '@/components/ui/ResponsiveForm';
import useKeyboardHandling from '@/lib/hooks/useKeyboardHandling';

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
  const { formId, formRef } = useKeyboardHandling('business-details-form');
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
    <form onSubmit={handleSubmit} className="space-y-8 mobile-form-container" id={formId}>
      <div ref={formRef}>
      <FormSection title="Basic Information" description="General information about your restaurant">
        <FormField label="Business Name" htmlFor="name" error={errors.name} required>
          <ResponsiveInput
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="The Golden Fork"
            required
          />
        </FormField>
        
        <FormField label="Description" htmlFor="description">
          <ResponsiveTextarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell customers about your restaurant..."
          />
        </FormField>
      </FormSection>
      
      <FormSection title="Business Type & Cuisine" description="Categorize your restaurant to help customers find you">
        <FormRow>
          <FormColumn width="1/2">
            <FormField label="Business Type" htmlFor="businessType">
              <ResponsiveSelect
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
              >
                <option value="">Select Business Type</option>
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </ResponsiveSelect>
            </FormField>
          </FormColumn>
          
          <FormColumn width="1/2">
            <FormField label="Cuisine Type" htmlFor="cuisineType">
              <ResponsiveSelect
                id="cuisineType"
                name="cuisineType"
                value={formData.cuisineType}
                onChange={handleChange}
              >
                <option value="">Select Cuisine Type</option>
                {cuisineTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </ResponsiveSelect>
            </FormField>
          </FormColumn>
        </FormRow>
      </FormSection>
      
      <FormSection title="Contact Information" description="How customers can reach your business">
        <FormRow>
          <FormColumn width="1/2">
            <FormField label="Phone Number" htmlFor="phone">
              <ResponsiveInput
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </FormField>
          </FormColumn>
          
          <FormColumn width="1/2">
            <FormField label="Email Address" htmlFor="email" error={errors.email}>
              <ResponsiveInput
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@restaurant.com"
              />
            </FormField>
          </FormColumn>
        </FormRow>
      </FormSection>
      
      <FormSection title="Web Presence" description="Your restaurant's online presence">
        <FormRow>
          <FormColumn width="1/2">
            <FormField label="Website URL" htmlFor="websiteUrl" error={errors.websiteUrl}>
              <ResponsiveInput
                type="url"
                id="websiteUrl"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                placeholder="https://www.yourrestaurant.com"
              />
            </FormField>
          </FormColumn>
          
          <FormColumn width="1/2">
            <FormField label="Logo URL" htmlFor="logoUrl">
              <ResponsiveInput
                type="url"
                id="logoUrl"
                name="logoUrl"
                value={formData.logoUrl}
                onChange={handleChange}
                placeholder="https://www.yourrestaurant.com/logo.png"
              />
            </FormField>
          </FormColumn>
        </FormRow>
      </FormSection>
      </div>
      
      <FormActions stickyOnMobile>
        <Button type="button" variant="outline" onClick={handleCancel} size="lg">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </FormActions>
    </form>
  );
}
