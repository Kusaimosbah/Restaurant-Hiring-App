'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface PersonalInfoFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<boolean>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function PersonalInfoForm({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
}: PersonalInfoFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    yearsOfExperience: '',
    hourlyRate: '',
    contactEmail: '',
    contactPhone: '',
    preferredContactMethod: 'Email',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    profilePictureUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load initial data when component mounts or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        bio: initialData.bio || '',
        yearsOfExperience: initialData.yearsOfExperience?.toString() || '',
        hourlyRate: initialData.hourlyRate?.toString() || '',
        contactEmail: initialData.contactEmail || initialData.user?.email || '',
        contactPhone: initialData.contactPhone || initialData.user?.phone || '',
        preferredContactMethod: initialData.preferredContactMethod || 'Email',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',
        profilePictureUrl: initialData.profilePictureUrl || '',
      });
    }
  }, [initialData]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear success message when form is modified
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }
    
    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length > 500) {
      newErrors.bio = 'Bio must be 500 characters or less';
    }
    
    if (formData.yearsOfExperience && isNaN(Number(formData.yearsOfExperience))) {
      newErrors.yearsOfExperience = 'Years of experience must be a number';
    }
    
    if (formData.hourlyRate && isNaN(Number(formData.hourlyRate))) {
      newErrors.hourlyRate = 'Hourly rate must be a number';
    }
    
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    
    // Set errors or submit form
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Format data for submission
    const submissionData = {
      ...formData,
      yearsOfExperience: formData.yearsOfExperience ? parseFloat(formData.yearsOfExperience) : null,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
    };
    
    // Submit form
    const success = await onSubmit(submissionData);
    
    if (success) {
      setSuccessMessage('Personal information updated successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Handle form reset/cancel
  const handleCancel = () => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        bio: initialData.bio || '',
        yearsOfExperience: initialData.yearsOfExperience?.toString() || '',
        hourlyRate: initialData.hourlyRate?.toString() || '',
        contactEmail: initialData.contactEmail || initialData.user?.email || '',
        contactPhone: initialData.contactPhone || initialData.user?.phone || '',
        preferredContactMethod: initialData.preferredContactMethod || 'Email',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',
        profilePictureUrl: initialData.profilePictureUrl || '',
      });
    }
    setErrors({});
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
        <div className="flex items-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
              {isUploadingImage ? (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : formData.profilePictureUrl ? (
                <img 
                  src={formData.profilePictureUrl} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // If image fails to load, show placeholder
                    e.currentTarget.onerror = null;
                    console.log("Image failed to load:", formData.profilePictureUrl);
                    
                    // For demonstration purposes, show a placeholder image
                    e.currentTarget.src = "https://via.placeholder.com/150";
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
            <label
              className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-300 shadow-sm cursor-pointer"
              htmlFor="profile-picture-upload"
            >
              <input
                type="file"
                id="profile-picture-upload"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    
                    // Create a FormData object
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    try {
                      setIsUploadingImage(true);
                      
                      // Upload the file
                      const response = await fetch('/api/worker/profile/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(data.error || 'Failed to upload profile picture');
                      }
                      
                      if (!data.url) {
                        throw new Error('No URL returned from server');
                      }
                      
                      // Update the form data with the new profile picture URL
                      setFormData(prev => ({
                        ...prev,
                        profilePictureUrl: data.url
                      }));
                      
                      // Show success message
                      setSuccessMessage('Profile picture uploaded successfully!');
                      setTimeout(() => {
                        setSuccessMessage('');
                      }, 3000);
                    } catch (error) {
                      console.error('Error uploading profile picture:', error);
                      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload profile picture. Please try again.');
                      setTimeout(() => {
                        setErrorMessage('');
                      }, 5000);
                    } finally {
                      setIsUploadingImage(false);
                    }
                  }
                }}
              />
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </label>
          </div>
          <div className="ml-5">
            <div className="text-sm text-gray-500">
              Upload a professional photo for your profile.
              <br />
              JPG or PNG. 1MB max.
            </div>
            <label
              className="mt-2 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              htmlFor="profile-picture-upload-btn"
            >
              <input
                type="file"
                id="profile-picture-upload-btn"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    
                    // Create a FormData object
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    try {
                      setIsUploadingImage(true);
                      
                      // Upload the file
                      const response = await fetch('/api/worker/profile/upload', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const data = await response.json();
                      
                      if (!response.ok) {
                        throw new Error(data.error || 'Failed to upload profile picture');
                      }
                      
                      if (!data.url) {
                        throw new Error('No URL returned from server');
                      }
                      
                      // Update the form data with the new profile picture URL
                      setFormData(prev => ({
                        ...prev,
                        profilePictureUrl: data.url
                      }));
                      
                      // Show success message
                      setSuccessMessage('Profile picture uploaded successfully!');
                      setTimeout(() => {
                        setSuccessMessage('');
                      }, 3000);
                    } catch (error) {
                      console.error('Error uploading profile picture:', error);
                      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload profile picture. Please try again.');
                      setTimeout(() => {
                        setErrorMessage('');
                      }, 5000);
                    } finally {
                      setIsUploadingImage(false);
                    }
                  }
                }}
              />
              Change photo
            </label>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g. Experienced Server"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          
          <div>
            <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="text"
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.yearsOfExperience ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g. 3.5"
            />
            {errors.yearsOfExperience && (
              <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
              Hourly Rate ($)
            </label>
            <input
              type="text"
              id="hourlyRate"
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.hourlyRate ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g. 18.50"
            />
            {errors.hourlyRate && <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>}
          </div>
        </div>
        
        <div className="mt-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              errors.bio ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Tell potential employers about yourself, your experience, and what you're looking for"
          />
          {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
          <p className="mt-1 text-xs text-gray-500">
            {formData.bio.length}/500 characters
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.contactEmail ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
            />
            {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>}
          </div>
          
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              id="contactPhone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              placeholder="e.g. (555) 123-4567"
            />
          </div>
          
          <div>
            <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Contact Method
            </label>
            <select
              id="preferredContactMethod"
              name="preferredContactMethod"
              value={formData.preferredContactMethod}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="Text">Text Message</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Address</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              placeholder="e.g. 123 Main St"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              placeholder="e.g. San Francisco"
            />
          </div>
          
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              placeholder="e.g. CA"
            />
          </div>
          
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              placeholder="e.g. 94102"
            />
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
