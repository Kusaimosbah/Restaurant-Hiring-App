import { useState, useEffect, useCallback } from 'react';
import { WorkflowRule, WorkflowExecution, WorkflowEventType } from '@/lib/services/WorkflowEngine';

export interface UseWorkflowsResult {
  rules: WorkflowRule[];
  executions: WorkflowExecution[];
  loading: boolean;
  error: string | null;
  createRule: (rule: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => Promise<void>;
  updateRule: (ruleId: string, updates: Partial<WorkflowRule>) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
  triggerEvent: (eventType: WorkflowEventType, eventData: Record<string, any>) => Promise<void>;
  refreshRules: () => void;
  refreshExecutions: () => void;
}

/**
 * Hook for managing workflow automation
 */
export function useWorkflows(): UseWorkflowsResult {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/workflows?type=rules');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch workflow rules');
      }

      if (result.success) {
        setRules(result.data);
      }
    } catch (err) {
      console.error('Error fetching workflow rules:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, []);

  const fetchExecutions = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/workflows?type=executions&limit=100');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch workflow executions');
      }

      if (result.success) {
        setExecutions(result.data);
      }
    } catch (err) {
      console.error('Error fetching workflow executions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, []);

  const createRule = useCallback(async (
    rule: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>
  ) => {
    try {
      setError(null);
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_rule',
          ...rule
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create workflow rule');
      }

      if (result.success) {
        setRules(prev => [...prev, result.data]);
      }
    } catch (err) {
      console.error('Error creating workflow rule:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, []);

  const updateRule = useCallback(async (
    ruleId: string,
    updates: Partial<WorkflowRule>
  ) => {
    try {
      setError(null);
      const response = await fetch('/api/workflows', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ruleId,
          ...updates
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update workflow rule');
      }

      if (result.success) {
        setRules(prev => 
          prev.map(rule => 
            rule.id === ruleId ? { ...rule, ...result.data } : rule
          )
        );
      }
    } catch (err) {
      console.error('Error updating workflow rule:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, []);

  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/workflows?ruleId=${ruleId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete workflow rule');
      }

      if (result.success) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId));
      }
    } catch (err) {
      console.error('Error deleting workflow rule:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, []);

  const triggerEvent = useCallback(async (
    eventType: WorkflowEventType,
    eventData: Record<string, any>
  ) => {
    try {
      setError(null);
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'trigger_event',
          eventType,
          eventData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to trigger workflow event');
      }

      // Refresh executions to see the new ones
      setTimeout(fetchExecutions, 1000);
    } catch (err) {
      console.error('Error triggering workflow event:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  }, [fetchExecutions]);

  const refreshRules = useCallback(() => {
    fetchRules();
  }, [fetchRules]);

  const refreshExecutions = useCallback(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRules(), fetchExecutions()]);
      setLoading(false);
    };

    loadData();
  }, [fetchRules, fetchExecutions]);

  return {
    rules,
    executions,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    triggerEvent,
    refreshRules,
    refreshExecutions
  };
}

/**
 * Hook for workflow rule builder
 */
export function useWorkflowBuilder() {
  const [rule, setRule] = useState<Partial<WorkflowRule>>({
    name: '',
    description: '',
    eventType: 'APPLICATION_SUBMITTED',
    conditions: [],
    actions: [],
    isActive: true,
    priority: 1
  });

  const updateRule = useCallback((updates: Partial<WorkflowRule>) => {
    setRule(prev => ({ ...prev, ...updates }));
  }, []);

  const addCondition = useCallback(() => {
    setRule(prev => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        {
          field: '',
          operator: 'equals',
          value: '',
          type: 'string'
        }
      ]
    }));
  }, []);

  const updateCondition = useCallback((index: number, updates: any) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions?.map((condition, i) => 
        i === index ? { ...condition, ...updates } : condition
      ) || []
    }));
  }, []);

  const removeCondition = useCallback((index: number) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const addAction = useCallback(() => {
    const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setRule(prev => ({
      ...prev,
      actions: [
        ...(prev.actions || []),
        {
          id: actionId,
          type: 'SEND_NOTIFICATION',
          parameters: {}
        }
      ]
    }));
  }, []);

  const updateAction = useCallback((index: number, updates: any) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions?.map((action, i) => 
        i === index ? { ...action, ...updates } : action
      ) || []
    }));
  }, []);

  const removeAction = useCallback((index: number) => {
    setRule(prev => ({
      ...prev,
      actions: prev.actions?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const resetRule = useCallback(() => {
    setRule({
      name: '',
      description: '',
      eventType: 'APPLICATION_SUBMITTED',
      conditions: [],
      actions: [],
      isActive: true,
      priority: 1
    });
  }, []);

  const validateRule = useCallback((): string[] => {
    const errors: string[] = [];

    if (!rule.name?.trim()) {
      errors.push('Rule name is required');
    }

    if (!rule.eventType) {
      errors.push('Event type is required');
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push('At least one action is required');
    }

    rule.actions?.forEach((action, index) => {
      if (!action.type) {
        errors.push(`Action ${index + 1}: Type is required`);
      }
      if (!action.parameters || Object.keys(action.parameters).length === 0) {
        errors.push(`Action ${index + 1}: Parameters are required`);
      }
    });

    rule.conditions?.forEach((condition, index) => {
      if (!condition.field?.trim()) {
        errors.push(`Condition ${index + 1}: Field is required`);
      }
      if (condition.value === undefined || condition.value === '') {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });

    return errors;
  }, [rule]);

  return {
    rule,
    updateRule,
    addCondition,
    updateCondition,
    removeCondition,
    addAction,
    updateAction,
    removeAction,
    resetRule,
    validateRule
  };
}

/**
 * Hook for workflow analytics
 */
export function useWorkflowAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalRules: 0,
    activeRules: 0,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    avgExecutionTime: 0,
    mostTriggeredEvents: [] as Array<{
      eventType: string;
      count: number;
    }>,
    executionTrends: [] as Array<{
      date: string;
      executions: number;
      successful: number;
      failed: number;
    }>
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this would fetch real analytics data
    const mockAnalytics = {
      totalRules: 8,
      activeRules: 6,
      totalExecutions: 245,
      successfulExecutions: 231,
      failedExecutions: 14,
      avgExecutionTime: 1.2,
      mostTriggeredEvents: [
        { eventType: 'APPLICATION_SUBMITTED', count: 89 },
        { eventType: 'APPLICATION_VIEWED', count: 67 },
        { eventType: 'APPLICATION_ACCEPTED', count: 34 },
        { eventType: 'INTERVIEW_SCHEDULED', count: 28 },
        { eventType: 'JOB_POSTED', count: 27 }
      ],
      executionTrends: [
        { date: '2025-10-21', executions: 32, successful: 30, failed: 2 },
        { date: '2025-10-22', executions: 28, successful: 26, failed: 2 },
        { date: '2025-10-23', executions: 35, successful: 33, failed: 2 },
        { date: '2025-10-24', executions: 41, successful: 39, failed: 2 },
        { date: '2025-10-25', executions: 38, successful: 36, failed: 2 },
        { date: '2025-10-26', executions: 43, successful: 41, failed: 2 },
        { date: '2025-10-27', executions: 28, successful: 26, failed: 2 }
      ]
    };

    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, []);

  return {
    analytics,
    loading
  };
}