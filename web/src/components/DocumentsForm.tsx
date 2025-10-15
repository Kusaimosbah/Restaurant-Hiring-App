'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface Document {
  id: string;
  name: string;
  documentType: 'RESUME' | 'WORK_HISTORY' | 'ID_VERIFICATION' | 'REFERENCE_LETTER' | 'BACKGROUND_CHECK' | 'OTHER';
  filePath: string;
  isVerified: boolean;
  notes?: string | null;
  createdAt: string;
}

interface DocumentsFormProps {
  initialDocuments?: Document[];
  onAddDocument: (document: Omit<Document, 'id' | 'isVerified' | 'createdAt'>) => Promise<boolean>;
  onUpdateDocument: (id: string, document: Partial<Omit<Document, 'id' | 'isVerified' | 'createdAt'>>) => Promise<boolean>;
  onDeleteDocument: (id: string) => Promise<boolean>;
  onUploadFile: (file: File) => Promise<string>;
  isLoading?: boolean;
}

export default function DocumentsForm({
  initialDocuments = [],
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onUploadFile,
  isLoading = false,
}: DocumentsFormProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDoc, setNewDoc] = useState({
    name: '',
    documentType: 'RESUME' as const,
    filePath: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load initial documents when component mounts or initialDocuments changes
  useEffect(() => {
    if (initialDocuments) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get document type label
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'RESUME':
        return 'Resume';
      case 'WORK_HISTORY':
        return 'Work History';
      case 'ID_VERIFICATION':
        return 'ID Verification';
      case 'REFERENCE_LETTER':
        return 'Reference Letter';
      case 'BACKGROUND_CHECK':
        return 'Background Check';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };

  // Get document type color
  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'RESUME':
        return 'bg-blue-100 text-blue-800';
      case 'WORK_HISTORY':
        return 'bg-green-100 text-green-800';
      case 'ID_VERIFICATION':
        return 'bg-purple-100 text-purple-800';
      case 'REFERENCE_LETTER':
        return 'bg-yellow-100 text-yellow-800';
      case 'BACKGROUND_CHECK':
        return 'bg-red-100 text-red-800';
      case 'OTHER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle form field changes for new document
  const handleNewDocChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDoc(prev => ({ ...prev, [name]: value }));
    
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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setNewDoc(prev => ({ ...prev, name: file.name.split('.')[0] }));
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setErrors({ file: 'Please select a file to upload' });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
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

      // Upload file
      const filePath = await onUploadFile(selectedFile);
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Update form data with file path
      setNewDoc(prev => ({ ...prev, filePath }));
      
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors({ file: 'Failed to upload file. Please try again.' });
      setUploadProgress(0);
      setIsUploading(false);
      return false;
    }
  };

  // Handle form field changes for editing existing document
  const handleEditDocChange = (id: string, field: string, value: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === id ? { ...doc, [field]: value } : doc
      )
    );
    
    // Clear success message when form is modified
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle adding a new document
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!newDoc.name.trim()) {
      newErrors.name = 'Document name is required';
    }
    
    if (!newDoc.filePath) {
      newErrors.filePath = 'Please upload a file';
    }
    
    // Set errors or submit form
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    const success = await onAddDocument(newDoc);
    
    if (success) {
      setSuccessMessage('Document added successfully!');
      // Reset form
      setNewDoc({
        name: '',
        documentType: 'RESUME',
        filePath: '',
        notes: '',
      });
      setSelectedFile(null);
      setShowAddForm(false);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Handle updating an existing document
  const handleUpdateDocument = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!doc.name.trim()) {
      newErrors.name = 'Document name is required';
    }
    
    // Set errors or submit form
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Format data for submission
    const submissionData = {
      name: doc.name,
      documentType: doc.documentType,
      notes: doc.notes,
    };
    
    // Submit form
    const success = await onUpdateDocument(id, submissionData);
    
    if (success) {
      setSuccessMessage('Document updated successfully!');
      setEditingDocId(null);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Handle deleting a document
  const handleDeleteDocument = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const success = await onDeleteDocument(id);
      
      if (success) {
        setSuccessMessage('Document deleted successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Document Button */}
      {!showAddForm && (
        <div className="flex justify-end">
          <Button 
            type="button" 
            onClick={() => setShowAddForm(true)}
          >
            Upload New Document
          </Button>
        </div>
      )}

      {/* Add New Document Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Upload New Document</h3>
          
          <form onSubmit={handleAddDocument} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type*
                </label>
                <select
                  id="documentType"
                  name="documentType"
                  value={newDoc.documentType}
                  onChange={handleNewDocChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                >
                  <option value="RESUME">Resume</option>
                  <option value="WORK_HISTORY">Work History</option>
                  <option value="ID_VERIFICATION">ID Verification</option>
                  <option value="REFERENCE_LETTER">Reference Letter</option>
                  <option value="BACKGROUND_CHECK">Background Check</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newDoc.name}
                  onChange={handleNewDocChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. My Resume"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
            </div>
            
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Upload File*
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <label
                  htmlFor="file"
                  className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Choose File
                </label>
                <span className="ml-3 text-sm text-gray-500">
                  {selectedFile ? selectedFile.name : 'No file chosen'}
                </span>
                {selectedFile && !newDoc.filePath && (
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                )}
              </div>
              {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
              {errors.filePath && <p className="mt-1 text-sm text-red-600">{errors.filePath}</p>}
              
              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-right">{uploadProgress}% uploaded</p>
                </div>
              )}
              
              {newDoc.filePath && (
                <p className="mt-2 text-sm text-green-600">
                  File uploaded successfully!
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={newDoc.notes}
                onChange={handleNewDocChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                placeholder="Add any notes about this document"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedFile(null);
                  setNewDoc({
                    name: '',
                    documentType: 'RESUME',
                    filePath: '',
                    notes: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !newDoc.filePath}
              >
                {isLoading ? 'Saving...' : 'Save Document'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Your Documents</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage your resume, work history, and other important documents.
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {documents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              You haven't uploaded any documents yet.
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="p-4">
                {editingDocId === doc.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document Name*
                        </label>
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) => handleEditDocChange(doc.id, 'name', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Document Type
                        </label>
                        <select
                          value={doc.documentType}
                          onChange={(e) => handleEditDocChange(doc.id, 'documentType', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        >
                          <option value="RESUME">Resume</option>
                          <option value="WORK_HISTORY">Work History</option>
                          <option value="ID_VERIFICATION">ID Verification</option>
                          <option value="REFERENCE_LETTER">Reference Letter</option>
                          <option value="BACKGROUND_CHECK">Background Check</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        rows={3}
                        value={doc.notes || ''}
                        onChange={(e) => handleEditDocChange(doc.id, 'notes', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditingDocId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => handleUpdateDocument(doc.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">{doc.name}</h4>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(doc.documentType)}`}>
                              {getDocumentTypeLabel(doc.documentType)}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              Uploaded on {formatDate(doc.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a 
                          href={doc.filePath} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => setEditingDocId(doc.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {doc.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{doc.notes}</p>
                      </div>
                    )}
                    
                    {doc.isVerified && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
    </div>
  );
}
