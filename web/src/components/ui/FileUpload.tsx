'use client';

import { useState } from 'react';
import { Button } from './Button';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string) => void;
  fileType: 'resume' | 'cover-letter' | 'profile-picture' | 'document';
  acceptedFormats?: string;
  maxSizeMB?: number;
  currentFile?: string;
  className?: string;
}

export default function FileUpload({ 
  onFileUploaded, 
  fileType, 
  acceptedFormats, 
  maxSizeMB = 5,
  currentFile,
  className = ''
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        onFileUploaded(result.fileUrl, result.fileName);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const deleteFile = async () => {
    if (!currentFile) return;

    try {
      const response = await fetch(`/api/upload?fileUrl=${encodeURIComponent(currentFile)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onFileUploaded('', ''); // Clear the file
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to delete file');
      }
    } catch (error) {
      setError('Failed to delete file');
      console.error('Delete error:', error);
    }
  };

  const getAcceptAttribute = () => {
    switch (fileType) {
      case 'resume':
      case 'cover-letter':
        return '.pdf,.doc,.docx';
      case 'profile-picture':
        return '.jpg,.jpeg,.png,.webp';
      case 'document':
        return '.pdf,.jpg,.jpeg,.png';
      default:
        return '';
    }
  };

  const formatFileType = (type: string) => {
    switch (type) {
      case 'profile-picture':
        return 'Profile Picture';
      case 'cover-letter':
        return 'Cover Letter';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {formatFileType(fileType)}
        {acceptedFormats && (
          <span className="text-gray-500 text-xs ml-1">({acceptedFormats})</span>
        )}
      </label>

      {currentFile ? (
        <div className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800">File uploaded successfully</span>
          </div>
          <div className="flex gap-2">
            <a 
              href={currentFile} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View
            </a>
            <button
              onClick={deleteFile}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            accept={getAcceptAttribute()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </div>
            
            <p className="text-xs text-gray-500">
              {acceptedFormats || `${formatFileType(fileType)} files up to ${maxSizeMB}MB`}
            </p>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}