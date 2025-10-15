import { PrismaClient, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendEmail } from './emailService';

// Interface for notification data
interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

/**
 * Service for handling notifications
 */
export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async sendNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      // Get user's notification preferences
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId: notificationData.userId }
      });

      // Default to all enabled if no preferences found
      const prefs = preferences || {
        inAppEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
        applicationUpdates: true,
        messages: true,
        jobPostings: true,
        shiftReminders: true,
        reviewsAndRatings: true,
        paymentUpdates: true
      };

      // Check if this notification type is enabled
      const isTypeEnabled = this.isNotificationTypeEnabled(notificationData.type, prefs);
      
      if (!isTypeEnabled) {
        console.log(`Notification type ${notificationData.type} is disabled for user ${notificationData.userId}`);
        return false;
      }

      // Create in-app notification if enabled
      if (prefs.inAppEnabled) {
        await this.createInAppNotification(notificationData);
      }

      // Send email notification if enabled
      if (prefs.emailEnabled) {
        await this.sendEmailNotification(notificationData);
      }

      // Send push notification if enabled
      if (prefs.pushEnabled) {
        await this.sendPushNotification(notificationData);
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Create an in-app notification
   */
  private static async createInAppNotification(notificationData: NotificationData) {
    try {
      await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data ? notificationData.data : undefined,
          isRead: false
        }
      });
      
      console.log(`In-app notification created for user ${notificationData.userId}`);
      return true;
    } catch (error) {
      console.error('Error creating in-app notification:', error);
      return false;
    }
  }

  /**
   * Send an email notification
   */
  private static async sendEmailNotification(notificationData: NotificationData) {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: notificationData.userId },
        select: { email: true, name: true }
      });

      if (!user?.email) {
        console.error(`User ${notificationData.userId} has no email address`);
        return false;
      }

      // In a real implementation, this would use a template system
      // For now, we'll just send a simple email
      await sendEmail({
        to: user.email,
        subject: notificationData.title,
        text: notificationData.message,
        html: `<h1>${notificationData.title}</h1><p>${notificationData.message}</p>`
      });
      
      console.log(`Email notification sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  /**
   * Send a push notification
   */
  private static async sendPushNotification(notificationData: NotificationData) {
    try {
      // Get user's registered devices
      const devices = await prisma.notificationDevice.findMany({
        where: { userId: notificationData.userId }
      });

      if (devices.length === 0) {
        console.log(`No devices registered for user ${notificationData.userId}`);
        return false;
      }

      // In a real implementation, this would use FCM, APNS, or web push
      // For now, we'll just log the notification
      console.log(`Push notification would be sent to ${devices.length} devices for user ${notificationData.userId}`);
      
      // For each device, send push notification based on platform
      for (const device of devices) {
        console.log(`Would send push to device ${device.id} (${device.platform}): ${notificationData.title}`);
        
        // Here you would integrate with FCM, APNS, or web push services
        // Example: await firebaseAdmin.messaging().send({ ... })
      }
      
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Check if a notification type is enabled in user preferences
   */
  private static isNotificationTypeEnabled(
    type: NotificationType, 
    prefs: any
  ): boolean {
    switch (type) {
      case 'APPLICATION_STATUS':
      case 'NEW_APPLICATION':
        return prefs.applicationUpdates;
      
      case 'NEW_MESSAGE':
        return prefs.messages;
      
      case 'NEW_JOB':
        return prefs.jobPostings;
      
      case 'SHIFT_REMINDER':
      case 'SHIFT_ASSIGNED':
        return prefs.shiftReminders;
      
      case 'PAYMENT_UPDATE':
        return prefs.paymentUpdates;
      
      case 'NEW_REVIEW':
        return prefs.reviewsAndRatings;
      
      // System alerts and profile views are always enabled
      case 'SYSTEM_ALERT':
      case 'PROFILE_VIEW':
        return true;
      
      default:
        return true;
    }
  }
}
