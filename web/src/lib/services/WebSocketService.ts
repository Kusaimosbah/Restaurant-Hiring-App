import { io, Socket } from 'socket.io-client';
import CacheService from './CacheService';
import { EncryptionService } from './EncryptionService';

export interface WebSocketConfig {
  url: string;
  options?: {
    transports?: string[];
    timeout?: number;
    forceNew?: boolean;
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
  };
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'voice' | 'system';
  timestamp: Date;
  encrypted?: boolean;
  metadata?: Record<string, any>;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;
  edited?: boolean;
  editedAt?: Date;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
    os?: string;
  };
}

export interface NotificationData {
  id: string;
  userId: string;
  type: 'message' | 'application' | 'interview' | 'system' | 'reminder';
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  actions?: Array<{
    id: string;
    label: string;
    action: string;
    data?: Record<string, any>;
  }>;
}

export interface ConversationThread {
  id: string;
  participants: string[];
  type: 'direct' | 'group' | 'channel';
  title?: string;
  description?: string;
  lastMessage?: MessageData;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  settings: {
    muted: boolean;
    notifications: boolean;
    encryptionEnabled: boolean;
    retentionDays?: number;
  };
}

export type WebSocketEventHandler<T = any> = (data: T) => void;

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private config: WebSocketConfig | null = null;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;
  private currentUser: { id: string; token: string } | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: MessageData[] = [];
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Get singleton instance
   */
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket connection
   */
  async initialize(config: WebSocketConfig, user: { id: string; token: string }): Promise<void> {
    this.config = config;
    this.currentUser = user;

    const socketOptions = {
      transports: ['websocket'],
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      auth: {
        token: user.token,
        userId: user.id,
      },
      ...config.options,
    };

    this.socket = io(config.url, socketOptions);
    this.setupEventListeners();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, socketOptions.timeout);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.processMessageQueue();
        console.log('✅ WebSocket connected successfully');
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ WebSocket connection failed:', error);
        reject(error);
      });
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.emit('connection:connected', { timestamp: new Date() });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('connection:disconnected', { reason, timestamp: new Date() });
      console.warn('🔌 WebSocket disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      this.startHeartbeat();
      this.processMessageQueue();
      this.emit('connection:reconnected', { attemptNumber, timestamp: new Date() });
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_error', (error) => {
      this.reconnectAttempts++;
      this.emit('connection:reconnect_error', { error, attempts: this.reconnectAttempts });
      console.error('🔄 WebSocket reconnection failed:', error);
    });

    // Message events
    this.socket.on('message:received', async (data: MessageData) => {
      const processedMessage = await this.processIncomingMessage(data);
      this.emit('message:received', processedMessage);
      await this.cacheMessage(processedMessage);
    });

    this.socket.on('message:status', (data: { messageId: string; status: MessageData['status']; timestamp: Date }) => {
      this.emit('message:status', data);
      this.updateMessageStatus(data.messageId, data.status);
    });

    // Typing indicators
    this.socket.on('typing:start', (data: TypingIndicator) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: TypingIndicator) => {
      this.emit('typing:stop', data);
    });

    // Presence updates
    this.socket.on('presence:update', (data: UserPresence) => {
      this.emit('presence:update', data);
      this.cacheUserPresence(data);
    });

    // Notifications
    this.socket.on('notification:new', (data: NotificationData) => {
      this.emit('notification:new', data);
      this.cacheNotification(data);
    });

    // Conversation events
    this.socket.on('conversation:created', (data: ConversationThread) => {
      this.emit('conversation:created', data);
      this.cacheConversation(data);
    });

    this.socket.on('conversation:updated', (data: ConversationThread) => {
      this.emit('conversation:updated', data);
      this.cacheConversation(data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🚨 WebSocket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Send message
   */
  async sendMessage(message: Omit<MessageData, 'id' | 'timestamp' | 'status'>): Promise<string> {
    const messageData: MessageData = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date(),
      status: 'sending',
    };

    // Encrypt message if enabled
    if (message.encrypted) {
      messageData.content = await EncryptionService.encrypt(message.content);
    }

    if (this.isConnected && this.socket) {
      this.socket.emit('message:send', messageData);
      await this.cacheMessage(messageData);
    } else {
      // Queue message for later delivery
      this.messageQueue.push(messageData);
      console.warn('📤 Message queued - WebSocket not connected');
    }

    return messageData.id;
  }

  /**
   * Start typing indicator
   */
  startTyping(conversationId: string): void {
    if (!this.isConnected || !this.socket || !this.currentUser) return;

    const typingData: TypingIndicator = {
      userId: this.currentUser.id,
      conversationId,
      isTyping: true,
      timestamp: new Date(),
    };

    this.socket.emit('typing:start', typingData);

    // Auto-stop typing after 3 seconds
    const existingTimeout = this.typingTimeouts.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);

    this.typingTimeouts.set(conversationId, timeout);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string): void {
    if (!this.isConnected || !this.socket || !this.currentUser) return;

    const typingData: TypingIndicator = {
      userId: this.currentUser.id,
      conversationId,
      isTyping: false,
      timestamp: new Date(),
    };

    this.socket.emit('typing:stop', typingData);

    const timeout = this.typingTimeouts.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(conversationId);
    }
  }

  /**
   * Update user presence
   */
  updatePresence(status: UserPresence['status'], deviceInfo?: UserPresence['deviceInfo']): void {
    if (!this.isConnected || !this.socket || !this.currentUser) return;

    const presenceData: UserPresence = {
      userId: this.currentUser.id,
      status,
      lastSeen: new Date(),
      deviceInfo,
    };

    this.socket.emit('presence:update', presenceData);
    this.cacheUserPresence(presenceData);
  }

  /**
   * Join conversation room
   */
  joinConversation(conversationId: string): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('conversation:join', { conversationId });
    console.log('🏠 Joined conversation:', conversationId);
  }

  /**
   * Leave conversation room
   */
  leaveConversation(conversationId: string): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('conversation:leave', { conversationId });
    console.log('🚪 Left conversation:', conversationId);
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: string, conversationId: string): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('message:read', { messageId, conversationId });
  }

  /**
   * Create new conversation
   */
  createConversation(participants: string[], type: ConversationThread['type'], title?: string): void {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('conversation:create', {
      participants,
      type,
      title,
      createdBy: this.currentUser?.id,
    });
  }

  /**
   * Subscribe to event
   */
  on<T = any>(event: string, handler: WebSocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from event
   */
  off<T = any>(event: string, handler: WebSocketEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  /**
   * Emit event to handlers
   */
  private emit<T = any>(event: string, data: T): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Process incoming message
   */
  private async processIncomingMessage(message: MessageData): Promise<MessageData> {
    // Decrypt message if encrypted
    if (message.encrypted && message.content) {
      try {
        message.content = await EncryptionService.decrypt(message.content);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        message.content = '[Encrypted message - decryption failed]';
      }
    }

    return message;
  }

  /**
   * Process message queue
   */
  private async processMessageQueue(): Promise<void> {
    if (!this.isConnected || !this.socket || this.messageQueue.length === 0) return;

    console.log(`📤 Processing ${this.messageQueue.length} queued messages`);

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      this.socket.emit('message:send', message);
      await this.cacheMessage(message);
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.emit('heartbeat', { timestamp: new Date() });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cache message
   */
  private async cacheMessage(message: MessageData): Promise<void> {
    try {
      const cacheKey = `message_${message.id}`;
      await CacheService.set(cacheKey, message, { ttl: 86400 }); // 24 hours

      // Also cache in conversation timeline
      const timelineKey = `conversation_${message.conversationId}_messages`;
      const existingMessages = await CacheService.get(timelineKey) || [];
      const updatedMessages = [...existingMessages, message].slice(-100); // Keep last 100 messages
      await CacheService.set(timelineKey, updatedMessages, { ttl: 86400 });
    } catch (error) {
      console.error('Failed to cache message:', error);
    }
  }

  /**
   * Update message status
   */
  private async updateMessageStatus(messageId: string, status: MessageData['status']): Promise<void> {
    try {
      const cacheKey = `message_${messageId}`;
      const message = await CacheService.get(cacheKey) as MessageData;
      if (message) {
        message.status = status;
        await CacheService.set(cacheKey, message, { ttl: 86400 });
      }
    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  }

  /**
   * Cache user presence
   */
  private async cacheUserPresence(presence: UserPresence): Promise<void> {
    try {
      const cacheKey = `presence_${presence.userId}`;
      await CacheService.set(cacheKey, presence, { ttl: 300 }); // 5 minutes
    } catch (error) {
      console.error('Failed to cache user presence:', error);
    }
  }

  /**
   * Cache notification
   */
  private async cacheNotification(notification: NotificationData): Promise<void> {
    try {
      const cacheKey = `notification_${notification.id}`;
      await CacheService.set(cacheKey, notification, { ttl: 604800 }); // 7 days

      // Also cache in user's notification list
      const userNotificationsKey = `user_${notification.userId}_notifications`;
      const existingNotifications = await CacheService.get(userNotificationsKey) || [];
      const updatedNotifications = [notification, ...existingNotifications].slice(0, 50); // Keep last 50
      await CacheService.set(userNotificationsKey, updatedNotifications, { ttl: 604800 });
    } catch (error) {
      console.error('Failed to cache notification:', error);
    }
  }

  /**
   * Cache conversation
   */
  private async cacheConversation(conversation: ConversationThread): Promise<void> {
    try {
      const cacheKey = `conversation_${conversation.id}`;
      await CacheService.set(cacheKey, conversation, { ttl: 86400 });
    } catch (error) {
      console.error('Failed to cache conversation:', error);
    }
  }

  /**
   * Get connection status
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  /**
   * Get cached messages for conversation
   */
  async getCachedMessages(conversationId: string): Promise<MessageData[]> {
    try {
      const timelineKey = `conversation_${conversationId}_messages`;
      return await CacheService.get(timelineKey) || [];
    } catch (error) {
      console.error('Failed to get cached messages:', error);
      return [];
    }
  }

  /**
   * Get cached user presence
   */
  async getCachedPresence(userId: string): Promise<UserPresence | null> {
    try {
      const cacheKey = `presence_${userId}`;
      return await CacheService.get(cacheKey);
    } catch (error) {
      console.error('Failed to get cached presence:', error);
      return null;
    }
  }

  /**
   * Get cached notifications
   */
  async getCachedNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const userNotificationsKey = `user_${userId}_notifications`;
      return await CacheService.get(userNotificationsKey) || [];
    } catch (error) {
      console.error('Failed to get cached notifications:', error);
      return [];
    }
  }
}

export default WebSocketService;