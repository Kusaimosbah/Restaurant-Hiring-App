'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  estimatedTimeMinutes: number;
  targetRole: string;
  materials: TrainingMaterial[];
  prerequisites: {
    id: string;
    title: string;
  }[];
  requiredFor: {
    id: string;
    title: string;
  }[];
  progress: {
    completionPercentage: number;
    completedMaterials: number;
    totalMaterials: number;
    prerequisitesCompleted: boolean;
  };
}

interface TrainingMaterial {
  id: string;
  title: string;
  description: string;
  type: 'VIDEO' | 'DOCUMENT' | 'QUIZ' | 'INTERACTIVE';
  order: number;
  estimatedTimeMinutes: number;
  progress?: any;
}

export default function ModuleDetail({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchModuleDetails();
  }, [moduleId]);
  
  const fetchModuleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/training/modules/${moduleId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch module details');
      }
      
      const data = await response.json();
      setModule(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching module details:', error);
      setError('Failed to load training module. Please try again later.');
      setLoading(false);
    }
  };
  
  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'Video';
      case 'DOCUMENT':
        return 'Document';
      case 'QUIZ':
        return 'Quiz';
      case 'INTERACTIVE':
        return 'Interactive';
      default:
        return 'Material';
    }
  };
  
  const getMaterialStatusBadge = (material: TrainingMaterial) => {
    if (!material.progress) {
      return <Badge variant="outline">Not Started</Badge>;
    }
    
    switch (material.progress.status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500 text-white">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };
  
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'm' : ''}`;
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <p>Loading training module...</p>
        </div>
      </div>
    );
  }
  
  if (error || !module) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Module not found'}</p>
          <Button 
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/training')}
          >
            Back to Training Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  const isModuleLocked = !module.progress.prerequisitesCompleted;
  
  return (
    <div className="container mx-auto px-4 py-6 bg-white text-black">
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/training')}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Training
        </Button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
          {module.isRequired && (
            <Badge variant="outline" className="text-gray-700 border-gray-300">Required</Badge>
          )}
        </div>
        <p className="text-gray-700 mt-1">{module.description}</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-lg font-medium">Progress</h3>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{module.progress.completedMaterials} of {module.progress.totalMaterials} completed</span>
                  <span>{module.progress.completionPercentage}%</span>
                </div>
                <Progress value={module.progress.completionPercentage} className="h-2" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Estimated Time</h3>
              <p className="text-2xl font-bold mt-2 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
                {formatTime(module.estimatedTimeMinutes)}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Status</h3>
              <div className="mt-2">
                {module.progress.completionPercentage === 100 ? (
                  <Badge className="bg-green-500 text-white px-3 py-1">
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    Completed
                  </Badge>
                ) : module.progress.completionPercentage > 0 ? (
                  <Badge className="bg-blue-500 text-white px-3 py-1">In Progress</Badge>
                ) : isModuleLocked ? (
                  <Badge className="bg-gray-500 text-white px-3 py-1">
                    <LockClosedIcon className="h-5 w-5 mr-1" />
                    Prerequisites Required
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500 text-white px-3 py-1">Not Started</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isModuleLocked && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Prerequisites Required</h3>
                <p className="text-yellow-700 mt-1">
                  You need to complete the following modules before starting this one:
                </p>
                <ul className="list-disc list-inside mt-2 text-yellow-700">
                  {module.prerequisites.map((prereq) => (
                    <li key={prereq.id}>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-yellow-700 underline"
                        onClick={() => router.push(`/training/modules/${prereq.id}`)}
                      >
                        {prereq.title}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <h2 className="text-xl font-semibold mb-4">Module Materials</h2>
      
      {module.materials.map((material, index) => (
        <Card key={material.id} className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                  {index + 1}
                </div>
                <CardTitle className="text-lg">{material.title}</CardTitle>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  {getMaterialTypeLabel(material.type)}
                </Badge>
                {getMaterialStatusBadge(material)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">{material.description}</p>
            
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatTime(material.estimatedTimeMinutes)}</span>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant={material.progress?.status === 'COMPLETED' ? "outline" : "default"}
                size="sm"
                disabled={isModuleLocked}
                onClick={() => router.push(`/training/materials/${material.id}`)}
              >
                {material.progress?.status === 'COMPLETED' ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Review
                  </>
                ) : material.progress?.status === 'IN_PROGRESS' ? (
                  <>
                    <ArrowRightIcon className="h-4 w-4 mr-1" />
                    Continue
                  </>
                ) : (
                  <>
                    <ArrowRightIcon className="h-4 w-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {module.requiredFor.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Next Modules</h2>
          <p className="text-sm text-gray-600 mb-4">
            After completing this module, you can proceed to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {module.requiredFor.map((nextModule) => (
              <Card key={nextModule.id}>
                <CardContent className="p-4">
                  <h3 className="font-medium">{nextModule.title}</h3>
                  <div className="flex justify-end mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/training/modules/${nextModule.id}`)}
                    >
                      View Module
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
