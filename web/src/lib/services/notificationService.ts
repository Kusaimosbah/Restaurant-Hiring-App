import { PrismaClient, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendEmail } from './emailService';
import { EventEmitter } from 'events';

// Interface for notification data
interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

// Interface for SSE connections
interface SSEConnection {
  userId: string;
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  keepAliveInterval: NodeJS.Timeout;
  connectionId: string;
}

/**
 * Service for handling notifications with real-time SSE support
 */
export class NotificationService extends EventEmitter {
  private static instance: NotificationService;
  private sseConnections: Map<string, SSEConnection[]> = new Map();

  private constructor() {
    super();
    // Clean up dead connections every 5 minutes
    setInterval(() => this.cleanupDeadConnections(), 5 * 60 * 1000);
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  /**
   * Add SSE connection for real-time notifications
   */
  addSSEConnection(userId: string, controller: ReadableStreamDefaultController): string {
    const encoder = new TextEncoder();
    const connectionId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up keep-alive interval
    const keepAliveInterval = setInterval(() => {
      try {
        controller.enqueue(encoder.encode(`: keep-alive\n\n`));
      } catch (error) {
        console.error('Error sending keep-alive:', error);
        this.removeSSEConnection(userId, connectionId);
      }
    }, 30000);

    const connection: SSEConnection = {
      userId,
      controller,
      encoder,
      keepAliveInterval,
      connectionId
    };

    if (!this.sseConnections.has(userId)) {
      this.sseConnections.set(userId, []);
    }
    
    this.sseConnections.get(userId)!.push(connection);

    // Send initial connection message
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'connection_established',
        message: 'Connected to notification stream',
        timestamp: new Date().toISOString()
      })}\n\n`));
    } catch (error) {
      console.error('Error sending initial message:', error);
    }

    console.log(`SSE connection added for user ${userId}. Total connections: ${this.getTotalSSEConnections()}`);
    return connectionId;
  }

  /**
   * Remove SSE connection
   */
  removeSSEConnection(userId: string, connectionId: string): void {
    const userConnections = this.sseConnections.get(userId);
    if (!userConnections) return;

    const index = userConnections.findIndex(conn => conn.connectionId === connectionId);
    if (index !== -1) {
      clearInterval(userConnections[index].keepAliveInterval);
      userConnections.splice(index, 1);
      
      if (userConnections.length === 0) {
        this.sseConnections.delete(userId);
      }
    }

    console.log(`SSE connection removed for user ${userId}. Total connections: ${this.getTotalSSEConnections()}`);
  }

  /**
   * Clean up dead SSE connections
   */
  private cleanupDeadConnections(): void {
    this.sseConnections.forEach((connections, userId) => {
      const activeConnections = connections.filter(conn => {
        try {
          // Try to send a test message to see if connection is alive
          conn.controller.enqueue(conn.encoder.encode(`: test\n\n`));
          return true;
        } catch {
          clearInterval(conn.keepAliveInterval);
          return false;
        }
      });
      
      if (activeConnections.length === 0) {
        this.sseConnections.delete(userId);
      } else if (activeConnections.length !== connections.length) {
        this.sseConnections.set(userId, activeConnections);
      }
    });
  }

  /**
   * Send real-time notification via SSE
   */
  private sendSSENotification(userId: string, notification: NotificationData): void {
    const userConnections = this.sseConnections.get(userId);
    if (!userConnections || userConnections.length === 0) {
      return;
    }

    const data = JSON.stringify({
      type: 'notification',
      payload: {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: new Date().toISOString(),
        isRead: false
      },
      timestamp: new Date().toISOString()
    });

    userConnections.forEach((connection, index) => {
      try {
        connection.controller.enqueue(
          connection.encoder.encode(`data: ${data}\n\n`)
        );
      } catch (error) {
        console.error(`Error sending SSE to user ${userId}, connection ${index}:`, error);
        this.removeSSEConnection(userId, connection.connectionId);
      }
    });
  }

  /**
   * Get total number of active SSE connections
   */
  getTotalSSEConnections(): number {
    let total = 0;
    this.sseConnections.forEach(connections => {
      total += connections.length;
    });
    return total;
  }

  /**
   * Get connected users
   */
  getConnectedUsers(): string[] {
    return Array.from(this.sseConnections.keys());
  }

  /**
   * Send a notification to a user
   */
  static async sendNotification(notificationData: NotificationData): Promise<boolean> {
    const instance = NotificationService.getInstance();
    return await instance.sendNotificationInstance(notificationData);
  }

  /**
   * Instance method for sending notifications
   */
  async sendNotificationInstance(notificationData: NotificationData): Promise<boolean> {
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
      const isTypeEnabled = NotificationService.isNotificationTypeEnabled(notificationData.type, prefs);
      
      if (!isTypeEnabled) {
        console.log(`Notification type ${notificationData.type} is disabled for user ${notificationData.userId}`);
        return false;
      }

      // Create in-app notification if enabled
      if (prefs.inAppEnabled) {
        await NotificationService.createInAppNotification(notificationData);
      }

      // Send email notification if enabled
      if (prefs.emailEnabled) {
        await NotificationService.sendEmailNotification(notificationData);
      }

      // Send push notification if enabled
      if (prefs.pushEnabled) {
        await NotificationService.sendPushNotification(notificationData);
      }

      // Send real-time notification via SSE
      this.sendSSENotification(notificationData.userId, notificationData);

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
