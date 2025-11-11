import { Platform, Alert } from 'react-native';
import PushNotification, { Importance } from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PUSH_NOTIFICATION_CONFIG, STORAGE_KEYS, NOTIFICATION_TYPES } from '../config/constants';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: any;
  timestamp: number;
  read: boolean;
}

class NotificationServiceClass {
  private initialized = false;
  private fcmToken: string | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🔔 Initializing Notification Service...');

      // Request permission
      await this.requestPermission();

      // Configure local notifications
      this.configureLocalNotifications();

      // Configure Firebase messaging
      await this.configureFCM();

      // Set up listeners
      this.setupListeners();

      this.initialized = true;
      console.log('✅ Notification Service initialized');
    } catch (error) {
      console.error('❌ Notification Service initialization failed:', error);
      throw error;
    }
  }

  private async requestPermission(): Promise<void> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
      } else {
        console.log('Notification permission denied');
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive important updates.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
    }
  }

  private configureLocalNotifications(): void {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('Local notification token:', token);
      },

      onNotification: (notification) => {
        console.log('Local notification received:', notification);
        
        if (notification.userInteraction) {
          // User tapped the notification
          this.handleNotificationTap(notification);
        }

        // Required on iOS only
        if (Platform.OS === 'ios') {
          notification.finish(PushNotification.FetchResult.NoData);
        }
      },

      onAction: (notification) => {
        console.log('Notification action:', notification.action);
        console.log('Notification:', notification);
      },

      onRegistrationError: (err) => {
        console.error('Notification registration error:', err.message);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: PUSH_NOTIFICATION_CONFIG.CHANNEL_ID,
          channelName: PUSH_NOTIFICATION_CONFIG.CHANNEL_NAME,
          channelDescription: 'Restaurant Hiring App Notifications',
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created) => console.log(`Notification channel created: ${created}`)
      );
    }
  }

  private async configureFCM(): Promise<void> {
    try {
      // Get FCM token
      this.fcmToken = await messaging().getToken();
      console.log('FCM Token:', this.fcmToken);

      // Store token for API registration
      if (this.fcmToken) {
        await AsyncStorage.setItem('fcmToken', this.fcmToken);
      }

      // Listen for token refresh
      messaging().onTokenRefresh((token) => {
        console.log('FCM Token refreshed:', token);
        this.fcmToken = token;
        AsyncStorage.setItem('fcmToken', token);
        // TODO: Send updated token to server
      });

    } catch (error) {
      console.error('FCM configuration error:', error);
    }
  }

  private setupListeners(): void {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      if (remoteMessage.notification) {
        this.showLocalNotification({
          title: remoteMessage.notification.title || 'New Message',
          body: remoteMessage.notification.body || '',
          data: remoteMessage.data,
        });
      }
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      if (remoteMessage.data) {
        this.handleNotificationTap(remoteMessage.data);
      }
    });

    // Check if app was opened by a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened by notification:', remoteMessage);
          if (remoteMessage.data) {
            this.handleNotificationTap(remoteMessage.data);
          }
        }
      });
  }

  showLocalNotification(params: {
    title: string;
    body: string;
    data?: any;
    type?: string;
  }): void {
    const notificationId = Date.now();
    
    PushNotification.localNotification({
      id: notificationId,
      channelId: PUSH_NOTIFICATION_CONFIG.CHANNEL_ID,
      title: params.title,
      message: params.body,
      userInfo: {
        ...params.data,
        type: params.type,
        notificationId,
      },
      soundName: 'default',
      vibrate: true,
      vibration: 300,
      playSound: true,
      actions: this.getNotificationActions(params.type),
    });

    // Store notification locally
    this.storeNotification({
      id: notificationId.toString(),
      title: params.title,
      body: params.body,
      type: params.type || 'general',
      data: params.data,
      timestamp: Date.now(),
      read: false,
    });
  }

  private getNotificationActions(type?: string): string[] {
    switch (type) {
      case NOTIFICATION_TYPES.NEW_MESSAGE:
        return ['Reply', 'Mark as Read'];
      case NOTIFICATION_TYPES.APPLICATION_UPDATE:
        return ['View Application'];
      case NOTIFICATION_TYPES.JOB_MATCH:
        return ['View Job', 'Apply Now'];
      case NOTIFICATION_TYPES.INTERVIEW_SCHEDULED:
        return ['Accept', 'Reschedule'];
      default:
        return ['View'];
    }
  }

  private handleNotificationTap(notification: any): void {
    console.log('Handling notification tap:', notification);
    
    // TODO: Navigate to appropriate screen based on notification type
    // This would be implemented with navigation service
    
    const { type, data } = notification;
    
    switch (type) {
      case NOTIFICATION_TYPES.NEW_MESSAGE:
        // Navigate to chat screen
        break;
      case NOTIFICATION_TYPES.APPLICATION_UPDATE:
        // Navigate to application details
        break;
      case NOTIFICATION_TYPES.JOB_MATCH:
        // Navigate to job details
        break;
      case NOTIFICATION_TYPES.INTERVIEW_SCHEDULED:
        // Navigate to interview details
        break;
      default:
        // Navigate to notifications screen
        break;
    }
  }

  private async storeNotification(notification: NotificationData): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const notifications: NotificationData[] = stored ? JSON.parse(stored) : [];
      
      notifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  async getStoredNotifications(): Promise<NotificationData[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      const updated = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  getFCMToken(): string | null {
    return this.fcmToken;
  }

  async reset(): Promise<void> {
    this.initialized = false;
    this.fcmToken = null;
    await this.clearAllNotifications();
    PushNotification.abandonPermissions();
  }
}

export const NotificationService = new NotificationServiceClass();