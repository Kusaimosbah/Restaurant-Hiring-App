'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

interface TaskListProps {
  title?: string;
  tasks: Task[];
  loading?: boolean;
  onTaskToggle?: (id: string, completed: boolean) => void;
  onTaskAdd?: (task: Omit<Task, 'id'>) => void;
}

export default function TaskList({
  title = 'Tasks',
  tasks,
  loading = false,
  onTaskToggle,
  onTaskAdd,
}: TaskListProps) {
  const [newTask, setNewTask] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const handleTaskToggle = (id: string, completed: boolean) => {
    if (onTaskToggle) {
      onTaskToggle(id, completed);
    }
  };

  const handleAddTask = () => {
    if (newTask.trim() && onTaskAdd) {
      onTaskAdd({
        title: newTask.trim(),
        completed: false,
        priority: 'medium',
      });
      setNewTask('');
      setShowAddTask(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          {onTaskAdd && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddTask(!showAddTask)}
              className="text-xs"
            >
              {showAddTask ? 'Cancel' : '+ Add Task'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showAddTask && (
          <div className="mb-4 flex space-x-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Enter new task"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <Button size="sm" onClick={handleAddTask}>
              Add
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="animate-pulse h-4 w-4 rounded bg-gray-200"></div>
                <div className="animate-pulse h-4 w-full bg-gray-200 rounded"></div>
              </div>
            ))
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div className="flex-1">
                  <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </span>
                  {task.priority && (
                    <span className={`ml-2 text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
                {task.dueDate && (
                  <span className="text-xs text-gray-500">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No tasks</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
