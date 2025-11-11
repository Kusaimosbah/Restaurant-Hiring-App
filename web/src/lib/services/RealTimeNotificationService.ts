import WebSocketService, { NotificationData } from './WebSocketService';
import CacheService from './CacheService';

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    types: NotificationData['type'][];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quietHours?: {
      start: string; // HH:MM format
      end: string;   // HH:MM format
      timezone: string;
    };
  };
  push: {
    enabled: boolean;
    types: NotificationData['type'][];
    sound: boolean;
    vibration: boolean;
    showOnLockScreen: boolean;
  };
  inApp: {
    enabled: boolean;
    types: NotificationData['type'][];
    showBadge: boolean;
    autoMarkRead: boolean;
    persistDuration: number; // in seconds
  };
  sms: {
    enabled: boolean;
    types: NotificationData['type'][];
    phoneNumber?: string;
  };
}

export interface NotificationTemplate {
  id: string;
  type: NotificationData['type'];
  title: string;
  body: string;
  variables: string[]; // Template variables like {{userName}}, {{jobTitle}}
  channels: ('email' | 'push' | 'inApp' | 'sms')[];
  priority: NotificationData['priority'];
  actionable: boolean;
  actions?: Array<{
    id: string;
    label: string;
    action: string;
    style?: 'default' | 'primary' | 'danger';
  }>;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    event: string;
    conditions: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
      value: any;
    }>;
  };
  template: string; // Template ID
  recipients: {
    type: 'user' | 'role' | 'department' | 'all';
    targets: string[];
  };
  schedule?: {
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
    frequency?: 'once' | 'recurring';
    cron?: string;
  };
  enabled: boolean;
}

export interface NotificationStats {
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  failed: number;
  byType: Record<NotificationData['type'], number>;
  byChannel: Record<string, number>;
  byPriority: Record<NotificationData['priority'], number>;
}

export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo: {
    userAgent: string;
    platform: string;
    type: 'desktop' | 'mobile' | 'tablet';
  };
  createdAt: Date;
  lastUsed: Date;
  active: boolean;
}

export class RealTimeNotificationService {
  private static preferences: Map<string, NotificationPreferences> = new Map();
  private static templates: Map<string, NotificationTemplate> = new Map();
  private static rules: Map<string, NotificationRule> = new Map();
  private static pushSubscriptions: Map<string, PushSubscription[]> = new Map();
  private static notificationQueue: NotificationData[] = [];
  private static stats: NotificationStats = {
    sent: 0,
    delivered: 0,
    read: 0,
    clicked: 0,
    failed: 0,
    byType: {
      message: 0,
      application: 0,
      interview: 0,
      system: 0,
      reminder: 0,
    },
    byChannel: {},
    byPriority: {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    },
  };

  /**
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    await this.loadDefaultTemplates();
    await this.loadUserPreferences();
    this.setupWebSocketListeners();
    this.startNotificationProcessor();
    console.log('✅ Real-time notification service initialized');
  }

  /**
   * Send notification
   */
  static async sendNotification(
    userId: string | string[],
    type: NotificationData['type'],
    title: string,
    body: string,
    options: {
      data?: Record<string, any>;
      priority?: NotificationData['priority'];
      actionable?: boolean;
      actions?: NotificationData['actions'];
      channels?: ('email' | 'push' | 'inApp' | 'sms')[];
      templateId?: string;
      templateVariables?: Record<string, any>;
    } = {}
  ): Promise<string[]> {
    const userIds = Array.isArray(userId) ? userId : [userId];
    const notificationIds: string[] = [];

    for (const uid of userIds) {
      const preferences = await this.getUserPreferences(uid);
      const notificationData: NotificationData = {
        id: this.generateNotificationId(),
        userId: uid,
        type,
        title,
        body,
        data: options.data,
        priority: options.priority || 'normal',
        timestamp: new Date(),
        read: false,
        actionable: options.actionable,
        actions: options.actions,
      };

      // Apply template if specified
      if (options.templateId && options.templateVariables) {
        const template = this.templates.get(options.templateId);
        if (template) {
          notificationData.title = this.applyTemplate(template.title, options.templateVariables);
          notificationData.body = this.applyTemplate(template.body, options.templateVariables);
          notificationData.priority = template.priority;
          notificationData.actionable = template.actionable;
          notificationData.actions = template.actions;
        }
      }

      // Check user preferences and send through appropriate channels
      const channels = options.channels || ['inApp', 'push'];
      await this.deliverNotification(notificationData, preferences, channels);
      
      notificationIds.push(notificationData.id);
      this.updateStats('sent', type, notificationData.priority);
    }

    return notificationIds;
  }

  /**
   * Send bulk notifications
   */
  static async sendBulkNotification(
    recipients: Array<{
      userId: string;
      templateVariables?: Record<string, any>;
    }>,
    templateId: string,
    options: {
      priority?: NotificationData['priority'];
      channels?: ('email' | 'push' | 'inApp' | 'sms')[];
      batchSize?: number;
    } = {}
  ): Promise<string[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const batchSize = options.batchSize || 100;
    const notificationIds: string[] = [];

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ userId, templateVariables = {} }) => {
        const title = this.applyTemplate(template.title, templateVariables);
        const body = this.applyTemplate(template.body, templateVariables);

        const ids = await this.sendNotification(
          userId,
          template.type,
          title,
          body,
          {
            priority: options.priority || template.priority,
            actionable: template.actionable,
            actions: template.actions,
            channels: options.channels || template.channels,
          }
        );

        return ids;
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          notificationIds.push(...result.value);
        }
      });

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return notificationIds;
  }

  /**
   * Schedule notification
   */
  static async scheduleNotification(
    userId: string | string[],
    type: NotificationData['type'],
    title: string,
    body: string,
    scheduledFor: Date,
    options: {
      data?: Record<string, any>;
      priority?: NotificationData['priority'];
      channels?: ('email' | 'push' | 'inApp' | 'sms')[];
    } = {}
  ): Promise<string> {
    const scheduleId = this.generateNotificationId();
    
    // Calculate delay
    const delay = scheduledFor.getTime() - Date.now();
    
    if (delay <= 0) {
      // Send immediately if scheduled time has passed
      await this.sendNotification(userId, type, title, body, options);
    } else {
      // Schedule for later
      setTimeout(async () => {
        await this.sendNotification(userId, type, title, body, options);
      }, delay);

      // Cache scheduled notification
      await CacheService.set(`scheduled_notification_${scheduleId}`, {
        userId,
        type,
        title,
        body,
        scheduledFor,
        options,
      }, { ttl: Math.ceil(delay / 1000) + 60 }); // Cache until after delivery
    }

    return scheduleId;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const cacheKey = `notification_${notificationId}`;
      const notification = await CacheService.get(cacheKey) as NotificationData;
      
      if (notification && notification.userId === userId && !notification.read) {
        notification.read = true;
        await CacheService.set(cacheKey, notification, { ttl: 604800 });
        
        this.updateStats('read', notification.type, notification.priority);
        
        // Update user's notification list
        await this.updateUserNotificationList(userId, notification);
        
        // Emit read event
        const wsService = WebSocketService.getInstance();
        if (wsService.isSocketConnected()) {
          wsService.getSocket()?.emit('notification:read', {
            notificationId,
            userId,
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getUserNotifications(userId);
      const unreadNotifications = notifications.filter(n => !n.read);
      
      const promises = unreadNotifications.map(notification => {
        notification.read = true;
        const cacheKey = `notification_${notification.id}`;
        return CacheService.set(cacheKey, notification, { ttl: 604800 });
      });

      await Promise.all(promises);
      
      // Update user's notification list cache
      await CacheService.set(`user_${userId}_notifications`, notifications, { ttl: 604800 });
      
      this.stats.read += unreadNotifications.length;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const cacheKey = `notification_${notificationId}`;
      const notification = await CacheService.get(cacheKey) as NotificationData;
      
      if (notification && notification.userId === userId) {
        await CacheService.del(cacheKey);
        
        // Remove from user's notification list
        const userNotificationsKey = `user_${userId}_notifications`;
        const notifications = (await CacheService.get(userNotificationsKey) || []) as NotificationData[];
        const updatedNotifications = notifications.filter((n: NotificationData) => n.id !== notificationId);
        await CacheService.set(userNotificationsKey, updatedNotifications, { ttl: 604800 });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      type?: NotificationData['type'];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<NotificationData[]> {
    try {
      const userNotificationsKey = `user_${userId}_notifications`;
      let notifications = (await CacheService.get(userNotificationsKey) || []) as NotificationData[];

      // Apply filters
      if (options.unreadOnly) {
        notifications = notifications.filter((n: NotificationData) => !n.read);
      }

      if (options.type) {
        notifications = notifications.filter((n: NotificationData) => n.type === options.type);
      }

      // Sort by timestamp (newest first)
      notifications.sort((a: NotificationData, b: NotificationData) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      return notifications.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string, type?: NotificationData['type']): Promise<number> {
    try {
      const notifications = await this.getUserNotifications(userId, { 
        unreadOnly: true, 
        type 
      });
      return notifications.length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const existingPreferences = await this.getUserPreferences(userId);
      const updatedPreferences: NotificationPreferences = {
        ...existingPreferences,
        ...preferences,
        userId,
      };

      this.preferences.set(userId, updatedPreferences);
      
      // Cache preferences
      await CacheService.set(
        `notification_preferences_${userId}`, 
        updatedPreferences, 
        { ttl: 86400 }
      );
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // Check cache first
      let preferences = this.preferences.get(userId);
      
      if (!preferences) {
        // Try to load from cache
        preferences = await CacheService.get(`notification_preferences_${userId}`);
        
        if (!preferences) {
          // Return default preferences
          preferences = this.getDefaultPreferences(userId);
          await this.updateUserPreferences(userId, preferences);
        }
        
        this.preferences.set(userId, preferences);
      }

      return preferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Register push subscription
   */
  static async registerPushSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    deviceInfo: PushSubscription['deviceInfo']
  ): Promise<void> {
    try {
      const pushSubscription: PushSubscription = {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        deviceInfo,
        createdAt: new Date(),
        lastUsed: new Date(),
        active: true,
      };

      const userSubscriptions = this.pushSubscriptions.get(userId) || [];
      
      // Remove existing subscription for same endpoint
      const filteredSubscriptions = userSubscriptions.filter(
        s => s.endpoint !== subscription.endpoint
      );
      
      filteredSubscriptions.push(pushSubscription);
      this.pushSubscriptions.set(userId, filteredSubscriptions);
      
      // Cache subscriptions
      await CacheService.set(
        `push_subscriptions_${userId}`,
        filteredSubscriptions,
        { ttl: 2592000 } // 30 days
      );
      
      console.log('✅ Push subscription registered for user:', userId);
    } catch (error) {
      console.error('Failed to register push subscription:', error);
    }
  }

  /**
   * Create notification template
   */
  static createTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
    console.log(`📄 Template created: ${template.id}`);
  }

  /**
   * Create notification rule
   */
  static createRule(rule: NotificationRule): void {
    this.rules.set(rule.id, rule);
    console.log(`📋 Notification rule created: ${rule.name}`);
  }

  /**
   * Get notification statistics
   */
  static getStats(): NotificationStats {
    return { ...this.stats };
  }

  /**
   * Clear old notifications
   */
  static async cleanupOldNotifications(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = new Date(Date.now() - maxAge);
    
    // This would typically be done with a database query
    // For now, we'll clean up cached notifications
    console.log('🧹 Cleaning up notifications older than', cutoff.toISOString());
  }

  /**
   * Deliver notification through appropriate channels
   */
  private static async deliverNotification(
    notification: NotificationData,
    preferences: NotificationPreferences,
    channels: string[]
  ): Promise<void> {
    const deliveryPromises: Promise<void>[] = [];

    // In-app notification
    if (channels.includes('inApp') && preferences.inApp.enabled) {
      if (preferences.inApp.types.includes(notification.type)) {
        deliveryPromises.push(this.sendInAppNotification(notification));
      }
    }

    // Push notification
    if (channels.includes('push') && preferences.push.enabled) {
      if (preferences.push.types.includes(notification.type)) {
        deliveryPromises.push(this.sendPushNotification(notification, preferences.push));
      }
    }

    // Email notification
    if (channels.includes('email') && preferences.email.enabled) {
      if (preferences.email.types.includes(notification.type)) {
        deliveryPromises.push(this.sendEmailNotification(notification, preferences.email));
      }
    }

    // SMS notification
    if (channels.includes('sms') && preferences.sms.enabled) {
      if (preferences.sms.types.includes(notification.type) && preferences.sms.phoneNumber) {
        deliveryPromises.push(this.sendSMSNotification(notification, preferences.sms));
      }
    }

    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Send in-app notification
   */
  private static async sendInAppNotification(notification: NotificationData): Promise<void> {
    try {
      // Send through WebSocket
      const wsService = WebSocketService.getInstance();
      if (wsService.isSocketConnected()) {
        wsService.getSocket()?.emit('notification:new', notification);
      } else {
        // Queue for later delivery
        this.notificationQueue.push(notification);
      }

      this.updateStats('delivered', notification.type, notification.priority, 'inApp');
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
      this.updateStats('failed', notification.type, notification.priority, 'inApp');
    }
  }

  /**
   * Send push notification
   */
  private static async sendPushNotification(
    notification: NotificationData,
    preferences: NotificationPreferences['push']
  ): Promise<void> {
    try {
      const subscriptions = this.pushSubscriptions.get(notification.userId) || [];
      const activeSubscriptions = subscriptions.filter(s => s.active);

      if (activeSubscriptions.length === 0) {
        console.warn('No active push subscriptions for user:', notification.userId);
        return;
      }

      // Send to all active subscriptions
      const pushPromises = activeSubscriptions.map(async (subscription) => {
        try {
          // This would integrate with a push service like FCM or web-push
          console.log('📱 Sending push notification to:', subscription.endpoint);
          
          // Mock push notification delivery
          await new Promise(resolve => setTimeout(resolve, 100));
          
          subscription.lastUsed = new Date();
        } catch (error) {
          console.error('Push notification failed for subscription:', subscription.endpoint, error);
          subscription.active = false;
        }
      });

      await Promise.allSettled(pushPromises);
      this.updateStats('delivered', notification.type, notification.priority, 'push');
    } catch (error) {
      console.error('Failed to send push notification:', error);
      this.updateStats('failed', notification.type, notification.priority, 'push');
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    notification: NotificationData,
    preferences: NotificationPreferences['email']
  ): Promise<void> {
    try {
      // Check quiet hours
      if (preferences.quietHours && this.isInQuietHours(preferences.quietHours)) {
        console.log('📧 Email notification delayed due to quiet hours');
        // Would schedule for later delivery
        return;
      }

      // This would integrate with an email service
      console.log('📧 Sending email notification to user:', notification.userId);
      
      // Mock email delivery
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.updateStats('delivered', notification.type, notification.priority, 'email');
    } catch (error) {
      console.error('Failed to send email notification:', error);
      this.updateStats('failed', notification.type, notification.priority, 'email');
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMSNotification(
    notification: NotificationData,
    preferences: NotificationPreferences['sms']
  ): Promise<void> {
    try {
      if (!preferences.phoneNumber) {
        console.warn('No phone number for SMS notification');
        return;
      }

      // This would integrate with an SMS service
      console.log('📱 Sending SMS notification to:', preferences.phoneNumber);
      
      // Mock SMS delivery
      await new Promise(resolve => setTimeout(resolve, 150));
      
      this.updateStats('delivered', notification.type, notification.priority, 'sms');
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      this.updateStats('failed', notification.type, notification.priority, 'sms');
    }
  }

  /**
   * Setup WebSocket listeners
   */
  private static setupWebSocketListeners(): void {
    const wsService = WebSocketService.getInstance();
    
    wsService.on('connection:connected', () => {
      // Process queued notifications
      this.processNotificationQueue();
    });
  }

  /**
   * Process notification queue
   */
  private static async processNotificationQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) return;

    console.log(`📤 Processing ${this.notificationQueue.length} queued notifications`);

    const notifications = [...this.notificationQueue];
    this.notificationQueue = [];

    for (const notification of notifications) {
      await this.sendInAppNotification(notification);
    }
  }

  /**
   * Start notification processor
   */
  private static startNotificationProcessor(): void {
    // Process notifications every 30 seconds
    setInterval(() => {
      this.processNotificationQueue();
    }, 30000);
  }

  /**
   * Load default templates
   */
  private static async loadDefaultTemplates(): Promise<void> {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'new_message',
        type: 'message',
        title: 'New message from {{senderName}}',
        body: '{{messagePreview}}',
        variables: ['senderName', 'messagePreview'],
        channels: ['inApp', 'push'],
        priority: 'normal',
        actionable: true,
        actions: [
          { id: 'reply', label: 'Reply', action: 'open_conversation' },
          { id: 'mark_read', label: 'Mark as Read', action: 'mark_read' }
        ]
      },
      {
        id: 'new_application',
        type: 'application',
        title: 'New job application',
        body: '{{applicantName}} applied for {{jobTitle}}',
        variables: ['applicantName', 'jobTitle'],
        channels: ['inApp', 'push', 'email'],
        priority: 'high',
        actionable: true,
        actions: [
          { id: 'view', label: 'View Application', action: 'view_application' },
          { id: 'schedule', label: 'Schedule Interview', action: 'schedule_interview' }
        ]
      },
      {
        id: 'interview_reminder',
        type: 'reminder',
        title: 'Interview reminder',
        body: 'You have an interview with {{candidateName}} in {{timeUntil}}',
        variables: ['candidateName', 'timeUntil'],
        channels: ['inApp', 'push', 'email', 'sms'],
        priority: 'urgent',
        actionable: true,
        actions: [
          { id: 'view', label: 'View Details', action: 'view_interview' },
          { id: 'reschedule', label: 'Reschedule', action: 'reschedule_interview' }
        ]
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Load user preferences
   */
  private static async loadUserPreferences(): Promise<void> {
    // This would typically load from database
    // For now, we'll use default preferences
  }

  /**
   * Get default preferences
   */
  private static getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      email: {
        enabled: true,
        types: ['application', 'interview', 'system'],
        frequency: 'immediate',
      },
      push: {
        enabled: true,
        types: ['message', 'application', 'interview', 'reminder'],
        sound: true,
        vibration: true,
        showOnLockScreen: true,
      },
      inApp: {
        enabled: true,
        types: ['message', 'application', 'interview', 'system', 'reminder'],
        showBadge: true,
        autoMarkRead: false,
        persistDuration: 604800, // 7 days
      },
      sms: {
        enabled: false,
        types: ['interview', 'reminder'],
      },
    };
  }

  /**
   * Apply template variables
   */
  private static applyTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  /**
   * Check if current time is in quiet hours
   */
  private static isInQuietHours(quietHours: NonNullable<NotificationPreferences['email']['quietHours']>): boolean {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: quietHours.timezone 
    }).substring(0, 5);

    return currentTime >= quietHours.start && currentTime <= quietHours.end;
  }

  /**
   * Update statistics
   */
  private static updateStats(
    action: keyof NotificationStats,
    type: NotificationData['type'],
    priority: NotificationData['priority'],
    channel?: string
  ): void {
    if (typeof this.stats[action] === 'number') {
      (this.stats[action] as number)++;
    }

    this.stats.byType[type]++;
    this.stats.byPriority[priority]++;

    if (channel) {
      this.stats.byChannel[channel] = (this.stats.byChannel[channel] || 0) + 1;
    }
  }

  /**
   * Update user notification list
   */
  private static async updateUserNotificationList(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    try {
      const userNotificationsKey = `user_${userId}_notifications`;
      const notifications = (await CacheService.get(userNotificationsKey) || []) as NotificationData[];
      
      const updatedNotifications = notifications.map((n: NotificationData) =>
        n.id === notification.id ? notification : n
      );

      await CacheService.set(userNotificationsKey, updatedNotifications, { ttl: 604800 });
    } catch (error) {
      console.error('Failed to update user notification list:', error);
    }
  }

  /**
   * Generate notification ID
   */
  private static generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default RealTimeNotificationService;