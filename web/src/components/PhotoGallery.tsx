'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';

// Temporary RestaurantPhoto type since it's not available from current Prisma schema
interface RestaurantPhoto {
  id: string;
  url: string;
  type?: string;
  caption?: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
  restaurantId: string;
}

// Photo types for dropdown
const photoTypes = [
  { value: 'INTERIOR', label: 'Interior' },
  { value: 'EXTERIOR', label: 'Exterior' },
  { value: 'FOOD', label: 'Food' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'OTHER', label: 'Other' },
];

interface PhotoGalleryProps {
  photos: RestaurantPhoto[];
  onAddPhoto: (photoData: FormData) => Promise<void>;
  onUpdatePhoto: (id: string, data: { caption?: string; type?: string; sortOrder?: number }) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PhotoGallery({
  photos = [],
  onAddPhoto,
  onUpdatePhoto,
  onDeletePhoto,
  isLoading = false,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<RestaurantPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    caption: '',
    type: 'INTERIOR',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group photos by type
  const photosByType = photos.reduce((acc, photo) => {
    const type = photo.type || 'OTHER';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(photo);
    return acc;
  }, {} as Record<string, RestaurantPhoto[]>);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create FormData
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', editData.type);
      formData.append('caption', editData.caption || '');
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      // First upload the file to get a URL
      const uploadResponse = await fetch('/api/restaurant/photos/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.status}`);
      }
      
      // Get the URL from the upload response
      const uploadResult = await uploadResponse.json();
      
      // Now create the photo record with the URL
      const photoFormData = new FormData();
      photoFormData.append('url', uploadResult.url);
      photoFormData.append('type', uploadResult.type || editData.type);
      photoFormData.append('caption', uploadResult.caption || editData.caption || '');
      
      await onAddPhoto(photoFormData);
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setEditData({
        caption: '',
        type: 'INTERIOR',
      });
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('Failed to upload photo. Please try again.');
    }
  };

  const handleEditClick = (photo: RestaurantPhoto) => {
    setSelectedPhoto(photo);
    setEditData({
      caption: photo.caption || '',
      type: photo.type || 'OTHER',
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPhoto) return;
    
    try {
      await onUpdatePhoto(selectedPhoto.id, {
        caption: editData.caption,
        type: editData.type,
      });
      
      setEditMode(false);
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Error updating photo:', error);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await onDeletePhoto(id);
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-4">Upload New Photo</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo Type
            </label>
            <select
              value={editData.type}
              onChange={(e) => setEditData({ ...editData, type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isUploading}
            >
              {photoTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <input
              type="text"
              value={editData.caption}
              onChange={(e) => setEditData({ ...editData, caption: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Describe this photo"
              disabled={isUploading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
              disabled={isUploading || isLoading}
            />
          </div>
          
          {isUploading && (
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Photo Gallery */}
      {photos.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No photos uploaded yet. Add your first photo above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(photosByType).map(([type, typePhotos]) => (
            <div key={type} className="space-y-2">
              <h3 className="text-lg font-medium">
                {photoTypes.find(t => t.value === type)?.label || 'Other'} Photos
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {typePhotos.map((photo) => (
                  <div 
                    key={photo.id}
                    className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    {/* Photo */}
                    <div className="aspect-w-4 aspect-h-3">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Restaurant photo'}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    
                    {/* Caption */}
                    <div className="p-3">
                      <p className="text-sm text-gray-700 truncate">
                        {photo.caption || 'No caption'}
                      </p>
                    </div>
                    
                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditClick(photo)}
                        className="bg-white text-gray-800 hover:bg-gray-100"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(photo.id)}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Modal */}
      {editMode && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Photo</h3>
            
            <div className="mb-4">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Restaurant photo'}
                className="w-full h-40 object-cover rounded-md"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo Type
                </label>
                <select
                  value={editData.type}
                  onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {photoTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <input
                  type="text"
                  value={editData.caption}
                  onChange={(e) => setEditData({ ...editData, caption: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Describe this photo"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    setSelectedPhoto(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
