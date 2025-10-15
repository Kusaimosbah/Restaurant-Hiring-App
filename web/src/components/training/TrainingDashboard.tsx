'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  CheckCircleIcon, 
  ClockIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PuzzlePieceIcon,
  ArrowPathIcon,
  ArrowLeftIcon
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
  _count: {
    materials: number;
  };
  progress?: {
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
}

interface ProgressSummary {
  totalModules: number;
  completedModules: number;
  totalMaterials: number;
  completedMaterials: number;
  overallCompletionPercentage: number;
}

export default function TrainingDashboard() {
  const { data: session } = useSession();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [inProgressModules, setInProgressModules] = useState<TrainingModule[]>([]);
  const [completedModules, setCompletedModules] = useState<TrainingModule[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    fetchModules();
    fetchProgress();
  }, []);
  
  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/training/modules');
      if (response.ok) {
        const data = await response.json();
        setModules(data);
        
        // Fetch detailed progress for each module
        const modulesWithProgress = await Promise.all(
          data.map(async (module: TrainingModule) => {
            const detailResponse = await fetch(`/api/training/modules/${module.id}`);
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              return {
                ...module,
                progress: detailData.progress
              };
            }
            return module;
          })
        );
        
        setModules(modulesWithProgress);
        
        // Filter modules by progress
        const completed = modulesWithProgress.filter(
          (module: TrainingModule) => 
            module.progress && module.progress.completionPercentage === 100
        );
        
        const inProgress = modulesWithProgress.filter(
          (module: TrainingModule) => 
            module.progress && 
            module.progress.completionPercentage > 0 && 
            module.progress.completionPercentage < 100
        );
        
        setCompletedModules(completed);
        setInProgressModules(inProgress);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching training modules:', error);
      setLoading(false);
    }
  };
  
  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/training/progress');
      if (response.ok) {
        const data = await response.json();
        setProgressSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching training progress:', error);
    }
  };
  
  const getMaterialTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <VideoCameraIcon className="h-5 w-5 text-blue-500" />;
      case 'DOCUMENT':
        return <DocumentTextIcon className="h-5 w-5 text-green-500" />;
      case 'QUIZ':
        return <PuzzlePieceIcon className="h-5 w-5 text-purple-500" />;
      case 'INTERACTIVE':
        return <ArrowPathIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <BookOpenIcon className="h-5 w-5 text-gray-500" />;
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
  
  const renderModuleCard = (module: TrainingModule) => {
    const { progress } = module;
    const isCompleted = progress && progress.completionPercentage === 100;
    const isInProgress = progress && progress.completionPercentage > 0 && progress.completionPercentage < 100;
    const isLocked = progress && !progress.prerequisitesCompleted;
    
    return (
      <Card key={module.id} className={`mb-4 ${isLocked ? 'opacity-75' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
              {isRequired && (
                <Badge variant="outline" className="ml-2">Required</Badge>
              )}
            </div>
            {isCompleted && (
              <Badge className="bg-green-500">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            )}
            {isInProgress && (
              <Badge className="bg-blue-500">In Progress</Badge>
            )}
            {isLocked && (
              <Badge className="bg-gray-500">Prerequisites Required</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">{module.description}</p>
          
          {progress && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span>{progress.completedMaterials} of {progress.totalMaterials} completed</span>
                <span>{progress.completionPercentage}%</span>
              </div>
              <Progress value={progress.completionPercentage} className="h-2" />
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatTime(module.estimatedTimeMinutes)}</span>
            </div>
            <div className="flex items-center">
              <BookOpenIcon className="h-4 w-4 mr-1" />
              <span>{module._count.materials} lessons</span>
            </div>
          </div>
          
          {module.materials.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Materials:</h4>
              <ul className="space-y-1">
                {module.materials.slice(0, 3).map((material) => (
                  <li key={material.id} className="flex items-center text-sm">
                    {getMaterialTypeIcon(material.type)}
                    <span className="ml-2">{material.title}</span>
                  </li>
                ))}
                {module.materials.length > 3 && (
                  <li className="text-sm text-gray-500 italic">
                    + {module.materials.length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          )}
          
          {module.prerequisites.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-1">Prerequisites:</h4>
              <ul className="text-sm text-gray-600">
                {module.prerequisites.map((prereq) => (
                  <li key={prereq.id}>{prereq.title}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              variant={isCompleted ? "outline" : "default"}
              size="sm"
              disabled={isLocked}
              href={`/training/modules/${module.id}`}
            >
              {isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-6 bg-white text-black">
      <div className="flex items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => { window.location.href = '/dashboard'; }}
          className="mr-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Training & Onboarding</h1>
      </div>
      
      <div className="flex justify-end mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            fetchModules();
            fetchProgress();
          }}
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {progressSummary && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <h3 className="text-lg font-medium">Overall Progress</h3>
                <div className="mt-2 relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        {progressSummary.overallCompletionPercentage}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div 
                      style={{ width: `${progressSummary.overallCompletionPercentage}%` }} 
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium">Modules</h3>
                <p className="text-3xl font-bold mt-2">
                  {progressSummary.completedModules} / {progressSummary.totalModules}
                </p>
                <p className="text-sm text-gray-500">completed</p>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium">Materials</h3>
                <p className="text-3xl font-bold mt-2">
                  {progressSummary.completedMaterials} / {progressSummary.totalMaterials}
                </p>
                <p className="text-sm text-gray-500">completed</p>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium">Status</h3>
                <div className="mt-2">
                  {progressSummary.overallCompletionPercentage === 100 ? (
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                      All Complete
                    </Badge>
                  ) : progressSummary.overallCompletionPercentage > 0 ? (
                    <Badge className="bg-blue-500 text-white px-3 py-1">In Progress</Badge>
                  ) : (
                    <Badge className="bg-gray-500 text-white px-3 py-1">Not Started</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="flex-1">
            All Modules
            <Badge variant="outline" className="ml-2">{modules.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex-1">
            In Progress
            <Badge variant="outline" className="ml-2">{inProgressModules.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed
            <Badge variant="outline" className="ml-2">{completedModules.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading training modules...</p>
            </div>
          ) : modules.length > 0 ? (
            <div>
              {modules.map(renderModuleCard)}
            </div>
          ) : (
            <div className="text-center py-8">
              <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No training modules available</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no training modules available for your role at this time.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in-progress">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading in-progress modules...</p>
            </div>
          ) : inProgressModules.length > 0 ? (
            <div>
              {inProgressModules.map(renderModuleCard)}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpenIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No modules in progress</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't started any training modules yet or all modules are completed.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading completed modules...</p>
            </div>
          ) : completedModules.length > 0 ? (
            <div>
              {completedModules.map(renderModuleCard)}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No completed modules</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't completed any training modules yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
