import { prisma } from '@/lib/prisma';
import { NotificationTriggers } from './NotificationTriggers';

export type WorkflowEventType = 
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_VIEWED'
  | 'APPLICATION_ACCEPTED'
  | 'APPLICATION_REJECTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'JOB_POSTED'
  | 'JOB_EXPIRED'
  | 'WORKER_PROFILE_UPDATED'
  | 'RESTAURANT_PROFILE_UPDATED';

export type WorkflowActionType =
  | 'SEND_NOTIFICATION'
  | 'SEND_EMAIL'
  | 'UPDATE_STATUS'
  | 'ASSIGN_REVIEWER'
  | 'SCHEDULE_TASK'
  | 'CREATE_FOLLOW_UP'
  | 'TRIGGER_WEBHOOK'
  | 'RUN_CUSTOM_SCRIPT';

export type WorkflowConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in';

export interface WorkflowCondition {
  field: string;
  operator: WorkflowConditionOperator;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'date';
}

export interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  parameters: Record<string, any>;
  delay?: number; // delay in minutes
  condition?: WorkflowCondition;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  restaurantId: string;
  eventType: WorkflowEventType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  priority: number; // Higher number = higher priority
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  eventType: WorkflowEventType;
  eventData: Record<string, any>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  executedActions: Array<{
    actionId: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    executedAt?: Date;
    error?: string;
    result?: any;
  }>;
}

/**
 * Advanced Workflow Engine
 * Automates hiring processes with configurable rules and actions
 */
export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private executionQueue: Map<string, WorkflowExecution> = new Map();

  private constructor() {
    // Initialize workflow engine
    this.startExecutionProcessor();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Trigger workflow execution for an event
   */
  async triggerWorkflow(
    eventType: WorkflowEventType,
    eventData: Record<string, any>,
    restaurantId: string
  ): Promise<void> {
    try {
      console.log(`Triggering workflow for event: ${eventType}`, eventData);

      // Get all active workflow rules for this event type and restaurant
      const rules = await this.getActiveRules(eventType, restaurantId);

      // Sort by priority (highest first)
      rules.sort((a, b) => b.priority - a.priority);

      // Execute each matching rule
      for (const rule of rules) {
        if (await this.evaluateConditions(rule.conditions, eventData)) {
          await this.executeRule(rule, eventData);
        }
      }

    } catch (error) {
      console.error('Workflow trigger error:', error);
      throw error;
    }
  }

  /**
   * Create a new workflow rule
   */
  async createRule(rule: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowRule> {
    try {
      // Validate rule structure
      this.validateRule(rule);

      // Create in database (simplified for now - in production would use proper schema)
      const newRule: WorkflowRule = {
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in cache or database
      console.log('Created workflow rule:', newRule);
      return newRule;

    } catch (error) {
      console.error('Error creating workflow rule:', error);
      throw error;
    }
  }

  /**
   * Update an existing workflow rule
   */
  async updateRule(ruleId: string, updates: Partial<WorkflowRule>): Promise<WorkflowRule> {
    try {
      // Validate updates
      if (updates.conditions || updates.actions) {
        this.validateRule(updates as any);
      }

      // Update in database
      const updatedRule: WorkflowRule = {
        ...updates,
        id: ruleId,
        updatedAt: new Date()
      } as WorkflowRule;

      console.log('Updated workflow rule:', updatedRule);
      return updatedRule;

    } catch (error) {
      console.error('Error updating workflow rule:', error);
      throw error;
    }
  }

  /**
   * Delete a workflow rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    try {
      // Cancel any pending executions for this rule
      for (const [executionId, execution] of this.executionQueue.entries()) {
        if (execution.ruleId === ruleId && execution.status === 'PENDING') {
          execution.status = 'CANCELLED';
          this.executionQueue.delete(executionId);
        }
      }

      console.log('Deleted workflow rule:', ruleId);

    } catch (error) {
      console.error('Error deleting workflow rule:', error);
      throw error;
    }
  }

  /**
   * Get workflow rules for a restaurant
   */
  async getRules(restaurantId: string): Promise<WorkflowRule[]> {
    try {
      // In production, this would query the database
      // For now, return sample rules
      return this.getSampleRules(restaurantId);

    } catch (error) {
      console.error('Error getting workflow rules:', error);
      throw error;
    }
  }

  /**
   * Get workflow execution history
   */
  async getExecutionHistory(
    restaurantId: string,
    limit: number = 50
  ): Promise<WorkflowExecution[]> {
    try {
      // In production, this would query the database
      return Array.from(this.executionQueue.values())
        .filter(execution => execution.eventData.restaurantId === restaurantId)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting execution history:', error);
      throw error;
    }
  }

  /**
   * Get active rules for an event type and restaurant
   */
  private async getActiveRules(
    eventType: WorkflowEventType,
    restaurantId: string
  ): Promise<WorkflowRule[]> {
    const allRules = await this.getRules(restaurantId);
    return allRules.filter(rule => 
      rule.isActive && 
      rule.eventType === eventType
    );
  }

  /**
   * Evaluate workflow conditions
   */
  private async evaluateConditions(
    conditions: WorkflowCondition[],
    eventData: Record<string, any>
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, eventData)) {
        return false; // All conditions must be true (AND logic)
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: WorkflowCondition,
    eventData: Record<string, any>
  ): boolean {
    const fieldValue = this.getNestedValue(eventData, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Execute a workflow rule
   */
  private async executeRule(
    rule: WorkflowRule,
    eventData: Record<string, any>
  ): Promise<void> {
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      eventType: rule.eventType,
      eventData,
      status: 'PENDING',
      startedAt: new Date(),
      executedActions: rule.actions.map(action => ({
        actionId: action.id,
        status: 'PENDING'
      }))
    };

    this.executionQueue.set(execution.id, execution);

    try {
      execution.status = 'RUNNING';

      for (const action of rule.actions) {
        // Check if action has a delay
        if (action.delay && action.delay > 0) {
          setTimeout(() => {
            this.executeAction(action, eventData, execution);
          }, action.delay * 60 * 1000); // Convert minutes to milliseconds
        } else {
          await this.executeAction(action, eventData, execution);
        }
      }

      execution.status = 'COMPLETED';
      execution.completedAt = new Date();

    } catch (error) {
      execution.status = 'FAILED';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();
      console.error('Workflow execution failed:', error);
    }
  }

  /**
   * Execute a workflow action
   */
  private async executeAction(
    action: WorkflowAction,
    eventData: Record<string, any>,
    execution: WorkflowExecution
  ): Promise<void> {
    const actionExecution = execution.executedActions.find(a => a.actionId === action.id);
    if (!actionExecution) return;

    try {
      // Check action condition if present
      if (action.condition && !this.evaluateCondition(action.condition, eventData)) {
        actionExecution.status = 'COMPLETED';
        actionExecution.executedAt = new Date();
        actionExecution.result = 'Skipped due to condition';
        return;
      }

      let result: any;

      switch (action.type) {
        case 'SEND_NOTIFICATION':
          result = await this.executeSendNotification(action, eventData);
          break;
        case 'SEND_EMAIL':
          result = await this.executeSendEmail(action, eventData);
          break;
        case 'UPDATE_STATUS':
          result = await this.executeUpdateStatus(action, eventData);
          break;
        case 'ASSIGN_REVIEWER':
          result = await this.executeAssignReviewer(action, eventData);
          break;
        case 'SCHEDULE_TASK':
          result = await this.executeScheduleTask(action, eventData);
          break;
        case 'CREATE_FOLLOW_UP':
          result = await this.executeCreateFollowUp(action, eventData);
          break;
        case 'TRIGGER_WEBHOOK':
          result = await this.executeTriggerWebhook(action, eventData);
          break;
        case 'RUN_CUSTOM_SCRIPT':
          result = await this.executeCustomScript(action, eventData);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      actionExecution.status = 'COMPLETED';
      actionExecution.executedAt = new Date();
      actionExecution.result = result;

    } catch (error) {
      actionExecution.status = 'FAILED';
      actionExecution.executedAt = new Date();
      actionExecution.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Execute send notification action
   */
  private async executeSendNotification(
    action: WorkflowAction,
    eventData: Record<string, any>
  ): Promise<any> {
    const { recipient, message, type, priority } = action.parameters;

    // Use existing notification system
    await NotificationTriggers.sendCustomNotification(
      eventData.userId || recipient,
      message,
      type || 'info',
      priority || 'medium'
    );

    return { sent: true, recipient, message };
  }

  /**
   * Execute send email action
   */
  private async executeSendEmail(
    action: WorkflowAction,
    eventData: Record<string, any>
  ): Promise<any> {
    const { to, subject, template, data } = action.parameters;

    // In production, integrate with email service
    console.log('Sending email:', { to, subject, template, data });

    return { sent: true, to, subject };
  }

  /**
   * Execute update status action
   */
  private async executeUpdateStatus(
    action: WorkflowAction,
    eventData: Record<string, any>
  ): Promise<any> {
    const { entityType, entityId, newStatus } = action.parameters;

    // Update entity status in database
    switch (entityType) {
      case 'application':
        if (eventData.applicationId) {
          await prisma.application.update({
            where: { id: eventData.applicationId },
            data: { status: newStatus }
          });
        }
        break;
      case 'job':
        if (eventData.jobId) {
          await prisma.job.update({
            where: { id: eventData.jobId },
            data: { status: newStatus }
          });
        }
        break;
    }

    return { entityType, entityId, newStatus };
  }

  /**
   * Execute assign reviewer action
   */
  private async executeAssignReviewer(
    action: WorkflowAction,
    eventData: Record<string, any>
  ): Promise<any> {
    const { reviewerId, applicationId } = action.parameters;

    // Assign reviewer to application
    if (eventData.applicationId) {
      await prisma.application.update({
        where: { id: eventData.applicationId },
        data: { assignedReviewerId: reviewerId }
      });
    }

    return { reviewerId, applicationId };
  }

  /**
   * Execute schedule task action
   */
  private async executeScheduleTask(
    action: WorkflowAction,
    eventData: Record<string, any>
  ): Promise<any> {
    const { taskType, dueDate, assigneeId, description } = action.parameters;

    // Create scheduled task (would integrate with task management system)
    console.log('Scheduling task:', { taskType, dueDate, assigneeId, description });

    return { taskType, dueDate, assigneeId };
  }

  /**
   * Execute create follow-up action
   */
  private async executeCreateFollowUp(
    action: WorkflowAction,
    eventData: Record<string, any>
  ): Promise<any> {
    const { followUpType, scheduledDate, message } = action.parameters;

    // Schedule follow-up action
    console.log('Creating follow-up:', { followUpType, scheduledDate, message });

    return { followUpType, scheduledDate };
  }

  /**
   * Execute trigger webhook action
   */
  private async executeTriggerWebhook(
    action: WorkflowAction,
    eventData: Record<string, any>
  ): Promise<any> {
    const { url, method, headers, payload } = action.parameters;

    // Make HTTP request to webhook
    const response = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ ...payload, eventData })
    });

    return { status: response.status, statusText: response.statusText };
  }

  /**
   * Execute custom script action
   */
  private async executeCustomScript(
    action: WorkflowAction,
    eventData: Record<string, any>
  ): Promise<any> {
    const { script, context } = action.parameters;

    // Execute custom JavaScript code (in production, use a sandboxed environment)
    console.log('Executing custom script:', script);

    return { executed: true, script };
  }

  /**
   * Validate workflow rule structure
   */
  private validateRule(rule: Partial<WorkflowRule>): void {
    if (!rule.name || !rule.eventType || !rule.actions) {
      throw new Error('Rule must have name, eventType, and actions');
    }

    if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
      throw new Error('Rule must have at least one action');
    }

    // Validate each action
    rule.actions.forEach((action, index) => {
      if (!action.id || !action.type || !action.parameters) {
        throw new Error(`Action ${index} must have id, type, and parameters`);
      }
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Start the execution processor
   */
  private startExecutionProcessor(): void {
    // Process execution queue periodically
    setInterval(() => {
      this.processExecutionQueue();
    }, 5000); // Process every 5 seconds
  }

  /**
   * Process pending executions
   */
  private processExecutionQueue(): void {
    const pendingExecutions = Array.from(this.executionQueue.values())
      .filter(execution => execution.status === 'PENDING');

    // Clean up completed executions older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [executionId, execution] of this.executionQueue.entries()) {
      if (execution.completedAt && execution.completedAt < oneHourAgo) {
        this.executionQueue.delete(executionId);
      }
    }
  }

  /**
   * Get sample workflow rules for demonstration
   */
  private getSampleRules(restaurantId: string): WorkflowRule[] {
    return [
      {
        id: 'rule_1',
        name: 'Auto-acknowledge Applications',
        description: 'Automatically send acknowledgment when application is submitted',
        restaurantId,
        eventType: 'APPLICATION_SUBMITTED',
        conditions: [],
        actions: [
          {
            id: 'action_1',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.workerId}',
              message: 'Thank you for your application! We will review it shortly.',
              type: 'success'
            }
          }
        ],
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rule_2', 
        name: 'Notify Manager of New Applications',
        description: 'Send notification to restaurant manager when new applications arrive',
        restaurantId,
        eventType: 'APPLICATION_SUBMITTED',
        conditions: [],
        actions: [
          {
            id: 'action_2',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.restaurantOwnerId}',
              message: 'New application received for ${eventData.jobTitle}',
              type: 'info'
            }
          }
        ],
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}