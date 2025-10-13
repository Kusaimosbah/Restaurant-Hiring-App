'use client';

import { useState, useEffect } from 'react';
import { Location } from '@prisma/client';
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

interface LocationFormData {
  id?: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  isMainLocation: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface LocationsManagerProps {
  locations: Location[];
  onAddLocation: (location: Omit<LocationFormData, 'id'>) => Promise<void>;
  onUpdateLocation: (id: string, location: LocationFormData) => Promise<void>;
  onDeleteLocation: (id: string) => Promise<void>;
  onSetMainLocation: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export default function LocationsManager({
  locations = [],
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onSetMainLocation,
  isLoading = false,
}: LocationsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: '',
    email: '',
    isMainLocation: false,
    latitude: null,
    longitude: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when switching between add/edit modes
  useEffect(() => {
    if (isAdding) {
      setFormData({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        phone: '',
        email: '',
        isMainLocation: false,
        latitude: null,
        longitude: null,
      });
    } else if (editingLocationId) {
      const locationToEdit = locations.find(loc => loc.id === editingLocationId);
      if (locationToEdit) {
        setFormData({
          id: locationToEdit.id,
          name: locationToEdit.name,
          street: locationToEdit.street,
          city: locationToEdit.city,
          state: locationToEdit.state,
          zipCode: locationToEdit.zipCode,
          country: locationToEdit.country,
          phone: locationToEdit.phone || '',
          email: locationToEdit.email || '',
          isMainLocation: locationToEdit.isMainLocation,
          latitude: locationToEdit.latitude,
          longitude: locationToEdit.longitude,
        });
      }
    }
    
    setErrors({});
  }, [isAdding, editingLocationId, locations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox fields
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
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
      newErrors.name = 'Location name is required';
    }
    
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
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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
      if (isAdding) {
        // Add new location
        const { id, ...locationData } = formData;
        await onAddLocation(locationData);
        setIsAdding(false);
      } else if (editingLocationId) {
        // Update existing location
        await onUpdateLocation(editingLocationId, formData);
        setEditingLocationId(null);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleCancel = () => {
    if (isAdding) {
      setIsAdding(false);
    } else if (editingLocationId) {
      setEditingLocationId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await onDeleteLocation(id);
      } catch (error) {
        console.error('Error deleting location:', error);
      }
    }
  };

  const handleSetMainLocation = async (id: string) => {
    try {
      await onSetMainLocation(id);
    } catch (error) {
      console.error('Error setting main location:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Location List */}
      {!isAdding && !editingLocationId && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Your Locations</h3>
            <Button onClick={() => setIsAdding(true)}>
              Add New Location
            </Button>
          </div>
          
          {locations.length === 0 ? (
            <div className="bg-gray-50 p-6 text-center rounded-lg">
              <p className="text-gray-500">No locations found. Add your first location.</p>
              <Button onClick={() => setIsAdding(true)} className="mt-4">
                Add Location
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map(location => (
                <div 
                  key={location.id} 
                  className={`border rounded-lg p-4 ${location.isMainLocation ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium text-lg flex items-center">
                        {location.name}
                        {location.isMainLocation && (
                          <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                            Main Location
                          </span>
                        )}
                      </h4>
                      <p className="text-gray-600 mt-1">
                        {location.street}, {location.city}, {location.state} {location.zipCode}
                      </p>
                      {(location.phone || location.email) && (
                        <p className="text-gray-500 text-sm mt-2">
                          {location.phone && <span className="mr-3">{location.phone}</span>}
                          {location.email && <span>{location.email}</span>}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingLocationId(location.id)}
                      >
                        Edit
                      </Button>
                      {!location.isMainLocation && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSetMainLocation(location.id)}
                          >
                            Set as Main
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(location.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Location Form (Add/Edit) */}
      {(isAdding || editingLocationId) && (
        <>
          <h3 className="text-lg font-medium">
            {isAdding ? 'Add New Location' : 'Edit Location'}
          </h3>
          
          <Form onSubmit={handleSubmit} className="space-y-6">
            <FormSection title="Location Details">
              <FormField label="Location Name" htmlFor="name" error={errors.name}>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Downtown Location"
                />
              </FormField>
              
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isMainLocation"
                    checked={formData.isMainLocation}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Set as main location</span>
                </label>
                {editingLocationId && locations.find(loc => loc.id === editingLocationId)?.isMainLocation && (
                  <p className="mt-1 text-sm text-amber-600">
                    This is currently set as your main location. You cannot unset it without setting another location as main first.
                  </p>
                )}
              </div>
            </FormSection>
            
            <FormSection title="Address">
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
            
            <FormSection title="Contact Information">
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
                    placeholder="location@restaurant.com"
                  />
                </FormField>
              </div>
            </FormSection>
            
            <FormSection title="Map Location (Optional)">
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
            </FormSection>
            
            <FormActions>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isAdding ? 'Add Location' : 'Update Location'}
              </Button>
            </FormActions>
          </Form>
        </>
      )}
    </div>
  );
}
