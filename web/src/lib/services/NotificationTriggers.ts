import { NotificationService } from './notificationService';
import { prisma } from '@/lib/prisma';

/**
 * Notification Triggers - Handles automatic notification sending based on system events
 */
export class NotificationTriggers {
  private static notificationService = NotificationService.getInstance();

  /**
   * Trigger when a new job application is submitted
   */
  static async onApplicationSubmitted(applicationId: string) {
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              restaurant: {
                include: {
                  owner: true
                }
              }
            }
          },
          worker: {
            include: {
              user: true
            }
          }
        }
      });

      if (!application) return;

      // Notify restaurant owner about new application
      await this.notificationService.sendNotificationInstance({
        userId: application.job.restaurant.owner.id,
        type: 'NEW_APPLICATION',
        title: 'New Job Application',
        message: `${application.worker.user.name} applied for ${application.job.title}`,
        data: {
          applicationId: application.id,
          jobId: application.job.id,
          applicantName: application.worker.user.name,
          jobTitle: application.job.title,
          href: `/dashboard/applications/${application.id}`
        }
      });

      // Notify applicant about successful submission
      await this.notificationService.sendNotificationInstance({
        userId: application.worker.user.id,
        type: 'APPLICATION_STATUS',
        title: 'Application Submitted',
        message: `Your application for ${application.job.title} has been submitted successfully`,
        data: {
          applicationId: application.id,
          jobId: application.job.id,
          jobTitle: application.job.title,
          status: 'PENDING',
          href: `/applications/${application.id}`
        }
      });

    } catch (error) {
      console.error('Error triggering application submitted notifications:', error);
    }
  }

  /**
   * Trigger when application status changes
   */
  static async onApplicationStatusChanged(applicationId: string, newStatus: string, notes?: string) {
    try {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: {
            include: {
              restaurant: {
                include: {
                  owner: true
                }
              }
            }
          },
          worker: {
            include: {
              user: true
            }
          }
        }
      });

      if (!application) return;

      let title = '';
      let message = '';
      let notificationType = 'APPLICATION_STATUS';

      switch (newStatus) {
        case 'ACCEPTED':
          title = '🎉 Application Accepted!';
          message = `Congratulations! Your application for ${application.job.title} has been accepted.`;
          notificationType = 'APPLICATION_ACCEPTED';
          break;
        case 'REJECTED':
          title = 'Application Update';
          message = `Your application for ${application.job.title} was not selected at this time.`;
          notificationType = 'APPLICATION_REJECTED';
          break;
        case 'INTERVIEW_SCHEDULED':
          title = '📅 Interview Scheduled';
          message = `An interview has been scheduled for your application to ${application.job.title}.`;
          notificationType = 'INTERVIEW_SCHEDULED';
          break;
        default:
          title = 'Application Status Update';
          message = `Your application for ${application.job.title} status has been updated to ${newStatus}.`;
      }

      // Notify the applicant
      await this.notificationService.sendNotificationInstance({
        userId: application.worker.user.id,
        type: notificationType as any,
        title,
        message: notes ? `${message} Note: ${notes}` : message,
        data: {
          applicationId: application.id,
          jobId: application.job.id,
          jobTitle: application.job.title,
          status: newStatus,
          notes,
          href: `/applications/${application.id}`
        }
      });

    } catch (error) {
      console.error('Error triggering application status change notifications:', error);
    }
  }

  /**
   * Trigger when a new job is posted
   */
  static async onJobPosted(jobId: string) {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          restaurant: true
        }
      });

      if (!job) return;

      // Find relevant workers based on skills, location, etc.
      // For now, we'll notify all workers - in production, you'd want to filter based on:
      // - Location proximity
      // - Skills match
      // - Worker preferences
      // - Experience level

      const workers = await prisma.workerProfile.findMany({
        include: {
          user: true
        },
        take: 100 // Limit to prevent spam
      });

      const notifications = workers.map(worker => ({
        userId: worker.user.id,
        type: 'NEW_JOB',
        title: '💼 New Job Opportunity',
        message: `New ${job.title} position available at ${job.restaurant.name}`,
        data: {
          jobId: job.id,
          jobTitle: job.title,
          restaurantName: job.restaurant.name,
          hourlyRate: job.hourlyRate,
          href: `/jobs/${job.id}`
        }
      }));

      // Send bulk notifications
      for (const notification of notifications) {
        await this.notificationService.sendNotificationInstance(notification as any);
      }

    } catch (error) {
      console.error('Error triggering job posted notifications:', error);
    }
  }

  /**
   * Trigger when a new message is received
   */
  static async onNewMessage(messageId: string) {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: {
          sender: true,
          recipient: true,
          application: {
            include: {
              job: true
            }
          }
        }
      });

      if (!message) return;

      // Notify the recipient
      await this.notificationService.sendNotificationInstance({
        userId: message.recipientId,
        type: 'NEW_MESSAGE',
        title: `New message from ${message.sender.name}`,
        message: message.content.length > 100 
          ? `${message.content.substring(0, 100)}...` 
          : message.content,
        data: {
          messageId: message.id,
          senderId: message.senderId,
          senderName: message.sender.name,
          applicationId: message.applicationId,
          jobTitle: message.application?.job.title,
          href: message.applicationId 
            ? `/dashboard/applications/${message.applicationId}` 
            : `/messages/${message.id}`
        }
      });

    } catch (error) {
      console.error('Error triggering new message notifications:', error);
    }
  }

  /**
   * Trigger interview reminders
   */
  static async triggerInterviewReminders() {
    try {
      // This would typically be called by a cron job
      // Find interviews scheduled for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // In a real implementation, you'd have an Interview model
      // For now, we'll simulate with applications that have interview status
      const upcomingInterviews = await prisma.application.findMany({
        where: {
          status: 'INTERVIEW_SCHEDULED',
          // Assuming you have an interviewDate field
          // interviewDate: {
          //   gte: tomorrow,
          //   lt: dayAfterTomorrow
          // }
        },
        include: {
          job: {
            include: {
              restaurant: {
                include: {
                  owner: true
                }
              }
            }
          },
          worker: {
            include: {
              user: true
            }
          }
        }
      });

      for (const interview of upcomingInterviews) {
        // Notify the applicant
        await this.notificationService.sendNotificationInstance({
          userId: interview.worker.user.id,
          type: 'INTERVIEW_REMINDER',
          title: '⏰ Interview Reminder',
          message: `You have an interview tomorrow for the ${interview.job.title} position at ${interview.job.restaurant.name}`,
          data: {
            applicationId: interview.id,
            jobId: interview.job.id,
            jobTitle: interview.job.title,
            restaurantName: interview.job.restaurant.name,
            href: `/applications/${interview.id}`
          }
        });

        // Notify the restaurant owner
        await this.notificationService.sendNotificationInstance({
          userId: interview.job.restaurant.owner.id,
          type: 'INTERVIEW_REMINDER',
          title: '⏰ Interview Reminder',
          message: `You have an interview scheduled tomorrow with ${interview.worker.user.name} for the ${interview.job.title} position`,
          data: {
            applicationId: interview.id,
            jobId: interview.job.id,
            applicantName: interview.worker.user.name,
            jobTitle: interview.job.title,
            href: `/dashboard/applications/${interview.id}`
          }
        });
      }

    } catch (error) {
      console.error('Error triggering interview reminders:', error);
    }
  }

  /**
   * Trigger system maintenance notifications
   */
  static async triggerSystemMaintenance(maintenanceMessage: string, scheduledTime: Date) {
    try {
      // Get all active users
      const users = await prisma.user.findMany({
        select: { id: true },
        where: {
          // Add conditions for active users
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
          }
        }
      });

      const notifications = users.map(user => ({
        userId: user.id,
        type: 'SYSTEM_ALERT',
        title: '🔧 Scheduled Maintenance',
        message: maintenanceMessage,
        data: {
          maintenanceTime: scheduledTime.toISOString(),
          type: 'maintenance'
        }
      }));

      // Send bulk notifications
      for (const notification of notifications) {
        await this.notificationService.sendNotificationInstance(notification as any);
      }

    } catch (error) {
      console.error('Error triggering system maintenance notifications:', error);
    }
  }

  /**
   * Trigger bulk notifications for application management actions
   */
  static async onBulkApplicationAction(
    applicationIds: string[], 
    action: string, 
    performedBy: string
  ) {
    try {
      const applications = await prisma.application.findMany({
        where: {
          id: { in: applicationIds }
        },
        include: {
          job: {
            include: {
              restaurant: true
            }
          },
          worker: {
            include: {
              user: true
            }
          }
        }
      });

      for (const application of applications) {
        let title = '';
        let message = '';
        let status = '';

        switch (action) {
          case 'accept':
            title = '🎉 Application Accepted!';
            message = `Great news! Your application for ${application.job.title} has been accepted.`;
            status = 'ACCEPTED';
            break;
          case 'reject':
            title = 'Application Update';
            message = `Your application for ${application.job.title} was not selected at this time.`;
            status = 'REJECTED';
            break;
          case 'interview':
            title = '📅 Interview Invitation';
            message = `You've been invited for an interview for the ${application.job.title} position.`;
            status = 'INTERVIEW_SCHEDULED';
            break;
          case 'archive':
            title = 'Application Archived';
            message = `Your application for ${application.job.title} has been archived.`;
            status = 'ARCHIVED';
            break;
        }

        if (title && message) {
          await this.notificationService.sendNotificationInstance({
            userId: application.worker.user.id,
            type: 'APPLICATION_STATUS',
            title,
            message,
            data: {
              applicationId: application.id,
              jobId: application.job.id,
              jobTitle: application.job.title,
              restaurantName: application.job.restaurant.name,
              status,
              action,
              href: `/applications/${application.id}`
            }
          });
        }
      }

    } catch (error) {
      console.error('Error triggering bulk application action notifications:', error);
    }
  }
}