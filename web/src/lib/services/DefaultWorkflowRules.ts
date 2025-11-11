import { WorkflowEngine, WorkflowRule } from '@/lib/services/WorkflowEngine';

/**
 * Default Workflow Rules Generator
 * Creates useful default automation rules for new restaurants
 */
export class DefaultWorkflowRules {
  /**
   * Generate standard workflow rules for a restaurant
   */
  static async createDefaultRules(restaurantId: string): Promise<WorkflowRule[]> {
    const workflowEngine = WorkflowEngine.getInstance();
    const rules: WorkflowRule[] = [];

    try {
      // Rule 1: Auto-acknowledge applications
      const acknowledgmentRule = await workflowEngine.createRule({
        name: 'Auto-acknowledge Applications',
        description: 'Automatically send acknowledgment when workers submit applications',
        restaurantId,
        eventType: 'APPLICATION_SUBMITTED',
        conditions: [],
        actions: [
          {
            id: 'action_ack_worker',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.workerId}',
              message: 'Thank you for your application! We have received it and will review it shortly. You can check your application status in your dashboard.',
              type: 'success',
              priority: 'medium'
            }
          },
          {
            id: 'action_notify_manager',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.restaurantOwnerId}',
              message: 'New application received for ${eventData.jobTitle}. Click to review.',
              type: 'info',
              priority: 'high'
            }
          }
        ],
        isActive: true,
        priority: 1
      });

      rules.push(acknowledgmentRule);

      // Rule 2: Follow-up on pending applications
      const followUpRule = await workflowEngine.createRule({
        name: 'Follow-up Pending Applications',
        description: 'Send reminder to review applications that have been pending for 24 hours',
        restaurantId,
        eventType: 'APPLICATION_SUBMITTED',
        conditions: [],
        actions: [
          {
            id: 'action_followup_reminder',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.restaurantOwnerId}',
              message: 'Reminder: You have a pending application for ${eventData.jobTitle} that needs review.',
              type: 'warning',
              priority: 'medium'
            },
            delay: 1440 // 24 hours in minutes
          }
        ],
        isActive: true,
        priority: 2
      });

      rules.push(followUpRule);

      // Rule 3: Welcome accepted workers
      const welcomeRule = await workflowEngine.createRule({
        name: 'Welcome Accepted Workers',
        description: 'Send welcome message and next steps when applications are accepted',
        restaurantId,
        eventType: 'APPLICATION_ACCEPTED',
        conditions: [],
        actions: [
          {
            id: 'action_welcome_worker',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.workerId}',
              message: 'Congratulations! Your application has been accepted. Please check your email for next steps and onboarding information.',
              type: 'success',
              priority: 'high'
            }
          },
          {
            id: 'action_schedule_onboarding',
            type: 'SCHEDULE_TASK',
            parameters: {
              taskType: 'onboarding',
              assigneeId: '${eventData.restaurantOwnerId}',
              description: 'Complete onboarding process for new worker',
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
            }
          }
        ],
        isActive: true,
        priority: 3
      });

      rules.push(welcomeRule);

      // Rule 4: Handle rejected applications professionally
      const rejectionRule = await workflowEngine.createRule({
        name: 'Professional Rejection Notice',
        description: 'Send professional rejection notice with feedback when applications are rejected',
        restaurantId,
        eventType: 'APPLICATION_REJECTED',
        conditions: [],
        actions: [
          {
            id: 'action_rejection_notice',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.workerId}',
              message: 'Thank you for your interest in our position. While your application was not selected this time, we encourage you to apply for future opportunities.',
              type: 'info',
              priority: 'medium'
            }
          }
        ],
        isActive: true,
        priority: 4
      });

      rules.push(rejectionRule);

      // Rule 5: Interview scheduling notifications
      const interviewRule = await workflowEngine.createRule({
        name: 'Interview Scheduling',
        description: 'Send confirmation and preparation info when interviews are scheduled',
        restaurantId,
        eventType: 'INTERVIEW_SCHEDULED',
        conditions: [],
        actions: [
          {
            id: 'action_interview_confirmation',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.workerId}',
              message: 'Your interview has been scheduled! Please check your email for details including date, time, and location.',
              type: 'info',
              priority: 'high'
            }
          },
          {
            id: 'action_interview_reminder',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.workerId}',
              message: 'Reminder: You have an interview scheduled for tomorrow. Please arrive 10 minutes early and bring required documents.',
              type: 'warning',
              priority: 'high'
            },
            delay: 1440 // 24 hours before interview
          }
        ],
        isActive: true,
        priority: 5
      });

      rules.push(interviewRule);

      // Rule 6: Job posting notifications
      const jobPostingRule = await workflowEngine.createRule({
        name: 'Job Posting Confirmation',
        description: 'Confirm job posting is live and track performance',
        restaurantId,
        eventType: 'JOB_POSTED',
        conditions: [],
        actions: [
          {
            id: 'action_job_confirmation',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.restaurantOwnerId}',
              message: 'Your job posting "${eventData.jobTitle}" is now live and accepting applications.',
              type: 'success',
              priority: 'medium'
            }
          },
          {
            id: 'action_performance_check',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.restaurantOwnerId}',
              message: 'Weekly performance report for "${eventData.jobTitle}": Check your analytics dashboard for application metrics.',
              type: 'info',
              priority: 'low'
            },
            delay: 10080 // 7 days in minutes
          }
        ],
        isActive: true,
        priority: 6
      });

      rules.push(jobPostingRule);

      // Rule 7: High-priority applications (for experienced workers)
      const priorityRule = await workflowEngine.createRule({
        name: 'Priority Application Alert',
        description: 'Special notification for applications from highly experienced workers',
        restaurantId,
        eventType: 'APPLICATION_SUBMITTED',
        conditions: [
          {
            field: 'eventData.workerExperience',
            operator: 'greater_than',
            value: 3,
            type: 'number'
          }
        ],
        actions: [
          {
            id: 'action_priority_alert',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.restaurantOwnerId}',
              message: '🌟 PRIORITY: Experienced worker (${eventData.workerExperience}+ years) applied for ${eventData.jobTitle}. Review immediately!',
              type: 'success',
              priority: 'high'
            }
          }
        ],
        isActive: true,
        priority: 10
      });

      rules.push(priorityRule);

      // Rule 8: Application deadline reminders
      const deadlineRule = await workflowEngine.createRule({
        name: 'Application Deadline Reminder',
        description: 'Remind about applications approaching review deadline',
        restaurantId,
        eventType: 'APPLICATION_SUBMITTED',
        conditions: [],
        actions: [
          {
            id: 'action_deadline_reminder',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.restaurantOwnerId}',
              message: 'Reminder: Application for ${eventData.jobTitle} needs to be reviewed by end of business today.',
              type: 'warning',
              priority: 'high'
            },
            delay: 4320 // 72 hours (3 days)
          }
        ],
        isActive: true,
        priority: 7
      });

      rules.push(deadlineRule);

      return rules;

    } catch (error) {
      console.error('Error creating default workflow rules:', error);
      throw error;
    }
  }

  /**
   * Create seasonal/promotional workflow rules
   */
  static async createSeasonalRules(restaurantId: string): Promise<WorkflowRule[]> {
    const workflowEngine = WorkflowEngine.getInstance();
    const rules: WorkflowRule[] = [];

    try {
      // Seasonal hiring boost
      const seasonalRule = await workflowEngine.createRule({
        name: 'Seasonal Hiring Boost',
        description: 'Special promotion for seasonal positions',
        restaurantId,
        eventType: 'JOB_POSTED',
        conditions: [
          {
            field: 'eventData.jobTitle',
            operator: 'contains',
            value: 'seasonal',
            type: 'string'
          }
        ],
        actions: [
          {
            id: 'action_seasonal_boost',
            type: 'SEND_NOTIFICATION',
            parameters: {
              recipient: '${eventData.restaurantOwnerId}',
              message: 'Seasonal position posted! Consider promoting on social media for better reach.',
              type: 'info',
              priority: 'medium'
            }
          }
        ],
        isActive: true,
        priority: 8
      });

      rules.push(seasonalRule);

      return rules;

    } catch (error) {
      console.error('Error creating seasonal workflow rules:', error);
      throw error;
    }
  }

  /**
   * Get workflow rule templates for different scenarios
   */
  static getWorkflowTemplates(): Array<{
    name: string;
    description: string;
    category: string;
    eventType: string;
    template: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>;
  }> {
    return [
      {
        name: 'Quick Response Rule',
        description: 'Respond to applications within 2 hours during business hours',
        category: 'Response Time',
        eventType: 'APPLICATION_SUBMITTED',
        template: {
          name: 'Quick Response Rule',
          description: 'Respond to applications within 2 hours during business hours',
          eventType: 'APPLICATION_SUBMITTED',
          conditions: [],
          actions: [
            {
              id: 'quick_response',
              type: 'SEND_NOTIFICATION',
              parameters: {
                recipient: '${eventData.restaurantOwnerId}',
                message: 'New application needs response within 2 hours for optimal candidate experience.'
              },
              delay: 120 // 2 hours
            }
          ],
          isActive: true,
          priority: 5
        }
      },
      {
        name: 'Skills Match Alert',
        description: 'Alert when applicant matches required skills perfectly',
        category: 'Matching',
        eventType: 'APPLICATION_SUBMITTED',
        template: {
          name: 'Skills Match Alert',
          description: 'Alert when applicant matches required skills perfectly',
          eventType: 'APPLICATION_SUBMITTED',
          conditions: [
            {
              field: 'eventData.skillsMatchPercentage',
              operator: 'greater_than',
              value: 90,
              type: 'number'
            }
          ],
          actions: [
            {
              id: 'skills_match',
              type: 'SEND_NOTIFICATION',
              parameters: {
                recipient: '${eventData.restaurantOwnerId}',
                message: '🎯 Perfect match! Applicant has ${eventData.skillsMatchPercentage}% skill match for ${eventData.jobTitle}'
              }
            }
          ],
          isActive: true,
          priority: 9
        }
      },
      {
        name: 'Bulk Hiring Campaign',
        description: 'Automated actions for high-volume hiring periods',
        category: 'Bulk Operations',
        eventType: 'APPLICATION_SUBMITTED',
        template: {
          name: 'Bulk Hiring Campaign',
          description: 'Automated actions for high-volume hiring periods',
          eventType: 'APPLICATION_SUBMITTED',
          conditions: [
            {
              field: 'eventData.maxWorkers',
              operator: 'greater_than',
              value: 10,
              type: 'number'
            }
          ],
          actions: [
            {
              id: 'bulk_process',
              type: 'UPDATE_STATUS',
              parameters: {
                entityType: 'application',
                newStatus: 'UNDER_REVIEW'
              }
            },
            {
              id: 'bulk_notify',
              type: 'SEND_NOTIFICATION',
              parameters: {
                recipient: '${eventData.workerId}',
                message: 'Your application is being processed as part of our bulk hiring campaign. You will hear back within 48 hours.'
              }
            }
          ],
          isActive: true,
          priority: 6
        }
      }
    ];
  }
}