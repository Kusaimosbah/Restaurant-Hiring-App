'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string | null;
  credentialId?: string | null;
  verificationUrl?: string | null;
  documentUrl?: string | null;
  isVerified: boolean;
}

interface CertificationsFormProps {
  initialCertifications?: Certification[];
  onAddCertification: (certification: Omit<Certification, 'id' | 'isVerified'>) => Promise<boolean>;
  onUpdateCertification: (id: string, certification: Partial<Omit<Certification, 'id' | 'isVerified'>>) => Promise<boolean>;
  onDeleteCertification: (id: string) => Promise<boolean>;
  isLoading?: boolean;
}

export default function CertificationsForm({
  initialCertifications = [],
  onAddCertification,
  onUpdateCertification,
  onDeleteCertification,
  isLoading = false,
}: CertificationsFormProps) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [newCert, setNewCert] = useState({
    name: '',
    issuingOrganization: '',
    issueDate: '',
    expirationDate: '',
    credentialId: '',
    verificationUrl: '',
    documentUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load initial certifications when component mounts or initialCertifications changes
  useEffect(() => {
    if (initialCertifications) {
      setCertifications(initialCertifications);
    }
  }, [initialCertifications]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle form field changes for new certification
  const handleNewCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCert(prev => ({ ...prev, [name]: value }));
    
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

  // Handle form field changes for editing existing certification
  const handleEditCertChange = (id: string, field: string, value: string) => {
    setCertifications(prev => 
      prev.map(cert => 
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    );
    
    // Clear success message when form is modified
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle adding a new certification
  const handleAddCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!newCert.name.trim()) {
      newErrors.name = 'Certification name is required';
    }
    
    if (!newCert.issuingOrganization.trim()) {
      newErrors.issuingOrganization = 'Issuing organization is required';
    }
    
    if (!newCert.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    } else if (isNaN(Date.parse(newCert.issueDate))) {
      newErrors.issueDate = 'Issue date must be a valid date';
    }
    
    if (newCert.expirationDate && isNaN(Date.parse(newCert.expirationDate))) {
      newErrors.expirationDate = 'Expiration date must be a valid date';
    }
    
    if (newCert.verificationUrl && !isValidUrl(newCert.verificationUrl)) {
      newErrors.verificationUrl = 'Verification URL must be a valid URL';
    }
    
    // Set errors or submit form
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    const success = await onAddCertification(newCert);
    
    if (success) {
      setSuccessMessage('Certification added successfully!');
      // Reset form
      setNewCert({
        name: '',
        issuingOrganization: '',
        issueDate: '',
        expirationDate: '',
        credentialId: '',
        verificationUrl: '',
        documentUrl: '',
      });
      setShowAddForm(false);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Handle updating an existing certification
  const handleUpdateCertification = async (id: string) => {
    const cert = certifications.find(c => c.id === id);
    if (!cert) return;
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!cert.name.trim()) {
      newErrors.name = 'Certification name is required';
    }
    
    if (!cert.issuingOrganization.trim()) {
      newErrors.issuingOrganization = 'Issuing organization is required';
    }
    
    if (cert.verificationUrl && !isValidUrl(cert.verificationUrl)) {
      newErrors.verificationUrl = 'Verification URL must be a valid URL';
    }
    
    // Set errors or submit form
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Format data for submission
    const submissionData = {
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate,
      expirationDate: cert.expirationDate,
      credentialId: cert.credentialId,
      verificationUrl: cert.verificationUrl,
      documentUrl: cert.documentUrl,
    };
    
    // Submit form
    const success = await onUpdateCertification(id, submissionData);
    
    if (success) {
      setSuccessMessage('Certification updated successfully!');
      setEditingCertId(null);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Handle deleting a certification
  const handleDeleteCertification = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this certification?')) {
      const success = await onDeleteCertification(id);
      
      if (success) {
        setSuccessMessage('Certification deleted successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    }
  };

  // Validate URL
  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Certification Button */}
      {!showAddForm && (
        <div className="flex justify-end">
          <Button 
            type="button" 
            onClick={() => setShowAddForm(true)}
          >
            Add New Certification
          </Button>
        </div>
      )}

      {/* Add New Certification Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Certification</h3>
          
          <form onSubmit={handleAddCertification} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Certification Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newCert.name}
                  onChange={handleNewCertChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. Food Handler Certification"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="issuingOrganization" className="block text-sm font-medium text-gray-700 mb-1">
                  Issuing Organization*
                </label>
                <input
                  type="text"
                  id="issuingOrganization"
                  name="issuingOrganization"
                  value={newCert.issuingOrganization}
                  onChange={handleNewCertChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.issuingOrganization ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. ServSafe"
                />
                {errors.issuingOrganization && (
                  <p className="mt-1 text-sm text-red-600">{errors.issuingOrganization}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date*
                </label>
                <input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  value={newCert.issueDate}
                  onChange={handleNewCertChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.issueDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.issueDate && <p className="mt-1 text-sm text-red-600">{errors.issueDate}</p>}
              </div>
              
              <div>
                <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (if applicable)
                </label>
                <input
                  type="date"
                  id="expirationDate"
                  name="expirationDate"
                  value={newCert.expirationDate}
                  onChange={handleNewCertChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.expirationDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.expirationDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expirationDate}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="credentialId" className="block text-sm font-medium text-gray-700 mb-1">
                  Credential ID
                </label>
                <input
                  type="text"
                  id="credentialId"
                  name="credentialId"
                  value={newCert.credentialId}
                  onChange={handleNewCertChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                  placeholder="e.g. SS-123456"
                />
              </div>
              
              <div>
                <label htmlFor="verificationUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification URL
                </label>
                <input
                  type="url"
                  id="verificationUrl"
                  name="verificationUrl"
                  value={newCert.verificationUrl}
                  onChange={handleNewCertChange}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.verificationUrl ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g. https://servsafe.com/verify/SS-123456"
                />
                {errors.verificationUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.verificationUrl}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="documentUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Document URL
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  id="documentUrl"
                  name="documentUrl"
                  value={newCert.documentUrl}
                  onChange={handleNewCertChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                  placeholder="Upload your certification document"
                  readOnly
                />
                <button
                  type="button"
                  className="ml-2 px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => {
                    // This would typically open a file picker
                    alert('File upload functionality will be implemented here.');
                    // For now, set a placeholder URL
                    setNewCert(prev => ({
                      ...prev,
                      documentUrl: 'https://example.com/documents/certification.pdf'
                    }));
                  }}
                >
                  Upload
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add Certification'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Certifications List */}
      <div className="bg-white rounded-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Your Certifications</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage your professional certifications and qualifications.
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {certifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              You haven't added any certifications yet.
            </div>
          ) : (
            certifications.map(cert => (
              <div key={cert.id} className="p-4">
                {editingCertId === cert.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Certification Name*
                        </label>
                        <input
                          type="text"
                          value={cert.name}
                          onChange={(e) => handleEditCertChange(cert.id, 'name', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issuing Organization*
                        </label>
                        <input
                          type="text"
                          value={cert.issuingOrganization}
                          onChange={(e) => handleEditCertChange(cert.id, 'issuingOrganization', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Issue Date*
                        </label>
                        <input
                          type="date"
                          value={cert.issueDate.substring(0, 10)}
                          onChange={(e) => handleEditCertChange(cert.id, 'issueDate', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiration Date (if applicable)
                        </label>
                        <input
                          type="date"
                          value={cert.expirationDate ? cert.expirationDate.substring(0, 10) : ''}
                          onChange={(e) => handleEditCertChange(cert.id, 'expirationDate', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Credential ID
                        </label>
                        <input
                          type="text"
                          value={cert.credentialId || ''}
                          onChange={(e) => handleEditCertChange(cert.id, 'credentialId', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verification URL
                        </label>
                        <input
                          type="url"
                          value={cert.verificationUrl || ''}
                          onChange={(e) => handleEditCertChange(cert.id, 'verificationUrl', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditingCertId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => handleUpdateCertification(cert.id)}
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
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{cert.name}</h4>
                        <p className="text-sm text-gray-600">{cert.issuingOrganization}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingCertId(cert.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(cert.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Issue Date:</span>
                        <span className="ml-2 text-sm text-gray-900">{formatDate(cert.issueDate)}</span>
                      </div>
                      
                      {cert.expirationDate && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Expiration Date:</span>
                          <span className="ml-2 text-sm text-gray-900">{formatDate(cert.expirationDate)}</span>
                        </div>
                      )}
                      
                      {cert.credentialId && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Credential ID:</span>
                          <span className="ml-2 text-sm text-gray-900">{cert.credentialId}</span>
                        </div>
                      )}
                      
                      {cert.verificationUrl && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Verification:</span>
                          <a 
                            href={cert.verificationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            Verify
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {cert.documentUrl && (
                      <div className="mt-2">
                        <a 
                          href={cert.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                        >
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          View Document
                        </a>
                      </div>
                    )}
                    
                    {cert.isVerified && (
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
