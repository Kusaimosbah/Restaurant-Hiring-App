'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
  assignedBy: string;
  restaurant: string;
}

export default function TasksPage() {
  return <TasksPageContent />;
}

function TasksPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (isAdmin) {
      router.push('/dashboard');
      return;
    }
    loadTasks();
  }, [session, status, router, isAdmin]);

  const loadTasks = async () => {
    try {
      // Mock tasks data for demonstration
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Complete Food Safety Training',
          description: 'Complete the online food safety certification course before your first shift.',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: '2024-01-20',
          assignedBy: 'Restaurant Manager',
          restaurant: 'The Gourmet Bistro'
        },
        {
          id: '2',
          title: 'Review POS System Manual',
          description: 'Familiarize yourself with our point-of-sale system and payment processing.',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          dueDate: '2024-01-18',
          assignedBy: 'Head Server',
          restaurant: 'The Gourmet Bistro'
        },
        {
          id: '3',
          title: 'Submit Tax Documents',
          description: 'Provide W-4 and other required tax documentation to HR.',
          priority: 'HIGH',
          status: 'COMPLETED',
          dueDate: '2024-01-15',
          assignedBy: 'HR Department',
          restaurant: 'The Gourmet Bistro'
        },
        {
          id: '4',
          title: 'Uniform Fitting',
          description: 'Schedule a time to pick up your uniform and ensure proper fit.',
          priority: 'LOW',
          status: 'PENDING',
          assignedBy: 'Assistant Manager',
          restaurant: 'The Gourmet Bistro'
        }
      ];
      
      setTasks(mockTasks);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <DashboardHeader title="Loading..." />
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(task => task.status === 'PENDING');
  const inProgressTasks = tasks.filter(task => task.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <DashboardHeader 
          title="My Tasks"
          subtitle="Track your onboarding and work-related tasks"
        />
        
        <div className="p-6">
          {/* Task Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-red-600">{pendingTasks.length}</div>
                <div className="text-sm font-medium text-gray-900">Pending Tasks</div>
                <div className="text-xs text-gray-500">Need your attention</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
                <div className="text-sm font-medium text-gray-900">In Progress</div>
                <div className="text-xs text-gray-500">Currently working on</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                <div className="text-sm font-medium text-gray-900">Completed</div>
                <div className="text-xs text-gray-500">Finished tasks</div>
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Assigned by:</span>
                          <p className="font-medium">{task.assignedBy}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Restaurant:</span>
                          <p className="font-medium">{task.restaurant}</p>
                        </div>
                        {task.dueDate && (
                          <div>
                            <span className="text-gray-500">Due Date:</span>
                            <p className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      
                      {task.status !== 'COMPLETED' && (
                        <div className="flex gap-2">
                          {task.status === 'PENDING' && (
                            <Button 
                              onClick={() => handleUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                              variant="primary"
                              size="sm"
                            >
                              Start Task
                            </Button>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <Button 
                              onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                              variant="success"
                              size="sm"
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tasks assigned yet.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Tasks will appear here once you're hired and onboarding begins.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}