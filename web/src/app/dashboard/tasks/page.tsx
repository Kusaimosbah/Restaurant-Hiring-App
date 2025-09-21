'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import {
  ClipboardDocumentListIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  completedAt?: string;
  estimatedDuration?: number; // in minutes
  category: 'PROFILE' | 'TRAINING' | 'CERTIFICATION' | 'ONBOARDING' | 'SHIFT_PREP';
  job?: {
    id: string;
    title: string;
    restaurant: {
      name: string;
    };
  };
  createdAt: string;
}

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'TODO' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'URGENT'>('ALL');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (session.user?.role !== 'WORKER') {
      router.push('/dashboard');
      return;
    }
    loadTasks();
  }, [session, status, router]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      // For now, we'll use dummy data since we need to create API endpoints
      setTimeout(() => {
        setTasks([
          {
            id: '1',
            title: 'Complete Profile Information',
            description: 'Add your bio, skills, and experience to attract more job opportunities.',
            priority: 'HIGH',
            status: 'TODO',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 15,
            category: 'PROFILE',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'Food Safety Certification',
            description: 'Complete the required food safety training course to be eligible for kitchen positions.',
            priority: 'MEDIUM',
            status: 'TODO',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 120,
            category: 'CERTIFICATION',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            title: 'Submit Work Availability',
            description: 'Update your availability slots to receive relevant job matches.',
            priority: 'MEDIUM',
            status: 'TODO',
            estimatedDuration: 10,
            category: 'PROFILE',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '4',
            title: 'Review Job Requirements',
            description: 'Read through the specific requirements for your upcoming server shift.',
            priority: 'HIGH',
            status: 'TODO',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 20,
            category: 'SHIFT_PREP',
            job: {
              id: 'job1',
              title: 'Server - Weekend Shift',
              restaurant: {
                name: 'The Golden Fork'
              }
            },
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '5',
            title: 'Complete Onboarding Documents',
            description: 'Fill out tax forms and emergency contact information.',
            priority: 'URGENT',
            status: 'IN_PROGRESS',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 30,
            category: 'ONBOARDING',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '6',
            title: 'Upload Profile Photo',
            description: 'Add a professional profile photo to increase your application success rate.',
            priority: 'LOW',
            status: 'COMPLETED',
            completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 5,
            category: 'PROFILE',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '7',
            title: 'Restaurant Orientation Training',
            description: 'Complete the video training for Bistro Central procedures and policies.',
            priority: 'MEDIUM',
            status: 'COMPLETED',
            completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 60,
            category: 'TRAINING',
            job: {
              id: 'job2',
              title: 'Kitchen Assistant',
              restaurant: {
                name: 'Bistro Central'
              }
            },
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks');
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => {
    try {
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, status, completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined }
            : task
        )
      );
      alert(`Task marked as ${status.toLowerCase().replace('_', ' ')}!`);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PROFILE':
        return '👤';
      case 'TRAINING':
        return '📚';
      case 'CERTIFICATION':
        return '📜';
      case 'ONBOARDING':
        return '📋';
      case 'SHIFT_PREP':
        return '⏰';
      default:
        return '📝';
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    return new Date(task.dueDate) < new Date();
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filter === 'ALL' || 
      (filter === 'TODO' && (task.status === 'TODO' || task.status === 'IN_PROGRESS')) ||
      (filter === 'COMPLETED' && task.status === 'COMPLETED');
    
    const priorityMatch = priorityFilter === 'ALL' || task.priority === priorityFilter;
    
    return statusMatch && priorityMatch;
  });

  const completedTasks = tasks.filter(task => task.status === 'COMPLETED');
  const pendingTasks = tasks.filter(task => task.status === 'TODO' || task.status === 'IN_PROGRESS');
  const overdueTasks = tasks.filter(task => isOverdue(task));
  const urgentTasks = tasks.filter(task => task.priority === 'URGENT' && task.status !== 'COMPLETED');

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse">
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="My Tasks"
          subtitle="Track and complete your assignments and requirements"
        />
        
        <div className="p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                  </div>
                  <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
                  </div>
                  <CheckIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{overdueTasks.length}</p>
                  </div>
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Urgent</p>
                    <p className="text-2xl font-bold text-orange-600">{urgentTasks.length}</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex space-x-2">
              <Button
                variant={filter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('ALL')}
              >
                All Tasks
              </Button>
              <Button
                variant={filter === 'TODO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('TODO')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('COMPLETED')}
              >
                Completed
              </Button>
            </div>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | 'HIGH' | 'URGENT')}
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Only</option>
            </select>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <Button variant="outline" onClick={loadTasks} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Urgent/Overdue Tasks Alert */}
          {(urgentTasks.length > 0 || overdueTasks.length > 0) && filter !== 'COMPLETED' && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                <p className="text-orange-800 font-medium">
                  You have {urgentTasks.length} urgent task{urgentTasks.length !== 1 ? 's' : ''}
                  {overdueTasks.length > 0 && ` and ${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}`}
                  {' '}that need attention.
                </p>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <Card key={task.id} className={`hover:shadow-lg transition-shadow ${
                  isOverdue(task) ? 'border-red-200 bg-red-50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-lg">{getCategoryIcon(task.category)}</span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {task.title}
                          </h3>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          {isOverdue(task) && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              OVERDUE
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 mb-3">{task.description}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          {task.estimatedDuration && (
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="h-4 w-4" />
                              <span>{formatDuration(task.estimatedDuration)}</span>
                            </div>
                          )}
                          
                          {task.dueDate && (
                            <div className="flex items-center space-x-1">
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </div>
                          )}
                          
                          {task.completedAt && (
                            <div className="flex items-center space-x-1">
                              <CheckIcon className="h-4 w-4 text-green-500" />
                              <span>Completed {formatDate(task.completedAt)}</span>
                            </div>
                          )}
                        </div>

                        {task.job && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center space-x-2">
                              <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                              <span className="text-sm text-blue-800">
                                Related to: <strong>{task.job.title}</strong> at {task.job.restaurant.name}
                              </span>
                            </div>
                          </div>
                        )}

                        {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                          <div className="flex space-x-2 pt-4 border-t border-gray-200">
                            {task.status === 'TODO' && (
                              <Button
                                size="sm"
                                onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                                className="flex items-center space-x-1"
                              >
                                <ClockIcon className="h-4 w-4" />
                                <span>Start Task</span>
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                              className="flex items-center space-x-1"
                            >
                              <CheckIcon className="h-4 w-4" />
                              <span>Mark Complete</span>
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'CANCELLED')}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                              <span>Cancel</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === 'COMPLETED' ? 'No completed tasks yet' : 'No tasks found'}
                </h3>
                <p className="text-gray-600">
                  {filter === 'COMPLETED' 
                    ? 'Complete some tasks to see them here.' 
                    : 'Tasks will appear here as you receive job assignments and requirements.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}