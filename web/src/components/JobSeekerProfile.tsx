'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import PersonalInfoForm from './PersonalInfoForm';
import SkillsForm from './SkillsForm';
import CertificationsForm from './CertificationsForm';
import DocumentsForm from './DocumentsForm';
import ResponsiveTabs from './ui/ResponsiveTabs';

// Types for worker profile data
interface WorkerProfileData {
  worker: any;
  isLoading: boolean;
  error: string | null;
}

// Define the tabs for the profile
const tabs = [
  { id: 'personal-info', name: 'Personal Info' },
  { id: 'skills', name: 'Skills & Experience' },
  { id: 'certifications', name: 'Certifications' },
  { id: 'documents', name: 'Documents' }
];

export default function JobSeekerProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState<WorkerProfileData>({
    worker: null,
    isLoading: true,
    error: null,
  });
  const [skills, setSkills] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [isLoadingCertifications, setIsLoadingCertifications] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch worker profile data
  const fetchProfileData = async () => {
    try {
      setProfileData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/worker/profile');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      setProfileData({
        worker: data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching worker profile:', error);
      setProfileData({
        worker: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile',
      });
    }
  };

  // Fetch worker skills
  const fetchSkills = async () => {
    try {
      setIsLoadingSkills(true);
      
      const response = await fetch('/api/worker/skills');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch skills: ${response.status}`);
      }
      
      const data = await response.json();
      setSkills(data);
    } catch (error) {
      console.error('Error fetching worker skills:', error);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  // Fetch worker certifications
  const fetchCertifications = async () => {
    try {
      setIsLoadingCertifications(true);
      
      const response = await fetch('/api/worker/certifications');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch certifications: ${response.status}`);
      }
      
      const data = await response.json();
      setCertifications(data);
    } catch (error) {
      console.error('Error fetching worker certifications:', error);
    } finally {
      setIsLoadingCertifications(false);
    }
  };

  // Fetch worker documents
  const fetchDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      
      const response = await fetch('/api/worker/documents');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching worker documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Load profile data, skills, certifications, and documents on component mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'WORKER') {
      fetchProfileData();
      fetchSkills();
      fetchCertifications();
      fetchDocuments();
    }
  }, [status, session]);
  
  // Load skills when tab changes to skills tab
  useEffect(() => {
    if (activeTab === 1 && status === 'authenticated' && session?.user?.role === 'WORKER') {
      fetchSkills();
    }
  }, [activeTab, status, session]);
  
  // Load certifications when tab changes to certifications tab
  useEffect(() => {
    if (activeTab === 2 && status === 'authenticated' && session?.user?.role === 'WORKER') {
      fetchCertifications();
    }
  }, [activeTab, status, session]);
  
  // Load documents when tab changes to documents tab
  useEffect(() => {
    if (activeTab === 3 && status === 'authenticated' && session?.user?.role === 'WORKER') {
      fetchDocuments();
    }
  }, [activeTab, status, session]);

  // Handle saving personal info
  const handleSavePersonalInfo = async (personalData: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/worker/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      const updatedProfile = await response.json();
      setProfileData(prev => ({
        ...prev,
        worker: updatedProfile,
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating worker profile:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding a new skill
  const handleAddSkill = async (skillData: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/worker/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(skillData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add skill: ${response.status}`);
      }
      
      const newSkill = await response.json();
      setSkills(prev => [...prev, newSkill]);
      
      return true;
    } catch (error) {
      console.error('Error adding worker skill:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating an existing skill
  const handleUpdateSkill = async (id: string, skillData: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/worker/skills/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(skillData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update skill: ${response.status}`);
      }
      
      const updatedSkill = await response.json();
      setSkills(prev => prev.map(skill => 
        skill.id === id ? updatedSkill : skill
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating worker skill:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting a skill
  const handleDeleteSkill = async (id: string) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/worker/skills/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete skill: ${response.status}`);
      }
      
      setSkills(prev => prev.filter(skill => skill.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting worker skill:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle adding a new certification
  const handleAddCertification = async (certData: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/worker/certifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add certification: ${response.status}`);
      }
      
      const newCertification = await response.json();
      setCertifications(prev => [...prev, newCertification]);
      
      return true;
    } catch (error) {
      console.error('Error adding worker certification:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating an existing certification
  const handleUpdateCertification = async (id: string, certData: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/worker/certifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update certification: ${response.status}`);
      }
      
      const updatedCertification = await response.json();
      setCertifications(prev => prev.map(cert => 
        cert.id === id ? updatedCertification : cert
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating worker certification:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting a certification
  const handleDeleteCertification = async (id: string) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/worker/certifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete certification: ${response.status}`);
      }
      
      setCertifications(prev => prev.filter(cert => cert.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting worker certification:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle uploading a document file
  const handleUploadFile = async (file: File) => {
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/worker/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.status}`);
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Handle adding a new document
  const handleAddDocument = async (docData: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/worker/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(docData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add document: ${response.status}`);
      }
      
      const newDocument = await response.json();
      setDocuments(prev => [...prev, newDocument]);
      
      return true;
    } catch (error) {
      console.error('Error adding worker document:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating an existing document
  const handleUpdateDocument = async (id: string, docData: any) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/worker/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(docData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update document: ${response.status}`);
      }
      
      const updatedDocument = await response.json();
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? updatedDocument : doc
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating worker document:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting a document
  const handleDeleteDocument = async (id: string) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/worker/documents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.status}`);
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting worker document:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  const LoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  // Error state
  const ErrorState = ({ error }: { error: string }) => (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Error!</strong>
      <span className="block sm:inline"> {error}</span>
      <button
        className="underline ml-2"
        onClick={fetchProfileData}
      >
        Try again
      </button>
    </div>
  );

  // Unauthorized state
  const UnauthorizedState = () => (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Access Denied!</strong>
      <span className="block sm:inline"> You must be logged in as a job seeker to access this page.</span>
      <div className="mt-4">
        <Button onClick={() => router.push('/auth/signin')}>
          Sign In
        </Button>
      </div>
    </div>
  );

  // Check if user is authenticated and is a worker
  if (status === 'loading') {
    return <LoadingState />;
  }

  if (!session || session.user.role !== 'WORKER') {
    return <UnauthorizedState />;
  }

  return (
    <div className="container mx-auto px-4 py-8 job-seeker-profile-container">
      <div className="flex items-center mb-6">
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Job Seeker Profile</h1>
      </div>
      
      {profileData.isLoading ? (
        <LoadingState />
      ) : profileData.error ? (
        <ErrorState error={profileData.error} />
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <ResponsiveTabs
            tabs={[
              {
                id: 'personal-info',
                name: 'Personal Info',
                content: (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                    <p className="text-gray-500 mb-6">
                      This information will be displayed on your profile and visible to potential employers.
                    </p>
                    <PersonalInfoForm
                      initialData={profileData.worker}
                      onSubmit={handleSavePersonalInfo}
                      isLoading={isSaving}
                      onCancel={() => fetchProfileData()}
                    />
                  </>
                )
              },
              {
                id: 'skills',
                name: 'Skills & Experience',
                content: (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Skills & Experience</h2>
                    <p className="text-gray-500 mb-6">
                      Add your professional skills and indicate your experience level for each.
                    </p>
                    {isLoadingSkills ? (
                      <LoadingState />
                    ) : (
                      <SkillsForm
                        initialSkills={skills}
                        onAddSkill={handleAddSkill}
                        onUpdateSkill={handleUpdateSkill}
                        onDeleteSkill={handleDeleteSkill}
                        isLoading={isSaving}
                      />
                    )}
                  </>
                )
              },
              {
                id: 'certifications',
                name: 'Certifications',
                content: (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Certifications</h2>
                    <p className="text-gray-500 mb-6">
                      Add any professional certifications or qualifications you have earned.
                    </p>
                    {isLoadingCertifications ? (
                      <LoadingState />
                    ) : (
                      <CertificationsForm
                        initialCertifications={certifications}
                        onAddCertification={handleAddCertification}
                        onUpdateCertification={handleUpdateCertification}
                        onDeleteCertification={handleDeleteCertification}
                        isLoading={isSaving}
                      />
                    )}
                  </>
                )
              },
              {
                id: 'documents',
                name: 'Documents',
                content: (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Documents</h2>
                    <p className="text-gray-500 mb-6">
                      Upload your resume, work history verification, and other important documents.
                    </p>
                    {isLoadingDocuments ? (
                      <LoadingState />
                    ) : (
                      <DocumentsForm
                        initialDocuments={documents}
                        onAddDocument={handleAddDocument}
                        onUpdateDocument={handleUpdateDocument}
                        onDeleteDocument={handleDeleteDocument}
                        onUploadFile={handleUploadFile}
                        isLoading={isSaving}
                      />
                    )}
                  </>
                )
              }
            ]}
            defaultTab={activeTab}
            onChange={setActiveTab}
            className="job-seeker-profile-tabs"
          />
        </div>
      )}
    </div>
  );
}