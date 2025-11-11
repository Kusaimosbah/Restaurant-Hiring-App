import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { NextApiRequest } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Real-time Chat WebSocket Service
 * Handles WebSocket connections for instant messaging, typing indicators,
 * file sharing, and real-time notifications
 */

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userName?: string;
}

interface TypingData {
  conversationId: string;
  userName: string;
  userId: string;
}

interface MessageData {
  conversationId: string;
  content: string;
  messageType: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
}

interface JoinConversationData {
  conversationId: string;
}

export class ChatWebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private userSockets: Map<string, AuthenticatedSocket> = new Map(); // socketId -> socket
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set<userId>

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      path: '/api/chat/socket',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      console.log('Socket connected:', socket.id);

      // Authenticate socket connection
      const authenticated = await this.authenticateSocket(socket);
      if (!authenticated) {
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
        return;
      }

      // Store socket references
      this.connectedUsers.set(socket.userId!, socket.id);
      this.userSockets.set(socket.id, socket);

      // Emit user online status
      this.broadcastUserStatus(socket.userId!, 'online');

      // Handle joining conversations
      socket.on('join_conversation', (data: JoinConversationData) => {
        this.handleJoinConversation(socket, data);
      });

      // Handle leaving conversations
      socket.on('leave_conversation', (data: JoinConversationData) => {
        this.handleLeaveConversation(socket, data);
      });

      // Handle sending messages
      socket.on('send_message', (data: MessageData) => {
        this.handleSendMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: TypingData) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data: TypingData) => {
        this.handleTypingStop(socket, data);
      });

      // Handle message read receipts
      socket.on('mark_messages_read', (data: { conversationId: string; messageIds: string[] }) => {
        this.handleMarkMessagesRead(socket, data);
      });

      // Handle file upload progress
      socket.on('file_upload_progress', (data: { conversationId: string; progress: number }) => {
        this.handleFileUploadProgress(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Send initial user data
      socket.emit('connected', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date().toISOString()
      });
    });
  }

  private async authenticateSocket(socket: AuthenticatedSocket): Promise<boolean> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return false;
      }

      // For development, we'll use a simple approach
      // In production, you'd want to validate JWT tokens properly
      const session = await this.validateSessionToken(token);
      
      if (!session?.user) {
        return false;
      }

      socket.userId = session.user.id;
      socket.userRole = session.user.role;
      socket.userName = session.user.name;

      return true;
    } catch (error) {
      console.error('Socket authentication error:', error);
      return false;
    }
  }

  private async validateSessionToken(token: string): Promise<any> {
    // This is a simplified validation - implement proper JWT validation in production
    try {
      // For now, we'll assume the token is the user ID for development
      const user = await prisma.user.findUnique({
        where: { id: token }
      });
      
      return user ? { user } : null;
    } catch (error) {
      return null;
    }
  }

  private async handleJoinConversation(socket: AuthenticatedSocket, data: JoinConversationData) {
    try {
      const { conversationId } = data;

      // Verify user has access to this conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: {
            some: {
              userId: socket.userId
            }
          }
        },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Join the conversation room
      socket.join(conversationId);

      // Notify other participants that user joined
      socket.to(conversationId).emit('user_joined_conversation', {
        conversationId,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date().toISOString()
      });

      // Send conversation info to the user
      socket.emit('conversation_joined', {
        conversationId,
        participants: conversation.participants.map(p => ({
          userId: p.userId,
          userName: p.user.name,
          role: p.role,
          joinedAt: p.joinedAt,
          isOnline: this.connectedUsers.has(p.userId)
        })),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  }

  private handleLeaveConversation(socket: AuthenticatedSocket, data: JoinConversationData) {
    const { conversationId } = data;
    
    socket.leave(conversationId);
    
    // Stop typing if user was typing
    this.handleTypingStop(socket, {
      conversationId,
      userName: socket.userName!,
      userId: socket.userId!
    });

    // Notify other participants
    socket.to(conversationId).emit('user_left_conversation', {
      conversationId,
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date().toISOString()
    });
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: MessageData) {
    try {
      const { conversationId, content, messageType, fileUrl, fileName, fileSize, replyToId } = data;

      // Verify conversation access
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: {
            some: {
              userId: socket.userId
            }
          }
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Cannot send message to this conversation' });
        return;
      }

      // Create the message
      const message = await prisma.message.create({
        data: {
          content,
          messageType,
          fileUrl,
          fileName,
          fileSize,
          senderId: socket.userId!,
          conversationId,
          replyToId,
          isRead: false
        },
        include: {
          sender: true,
          replyTo: {
            include: {
              sender: true
            }
          }
        }
      });

      // Update conversation last activity
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageId: message.id
        }
      });

      // Stop typing indicator for this user
      this.handleTypingStop(socket, {
        conversationId,
        userName: socket.userName!,
        userId: socket.userId!
      });

      // Broadcast message to all participants in the conversation
      this.io.to(conversationId).emit('new_message', {
        id: message.id,
        content: message.content,
        messageType: message.messageType,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        senderId: message.senderId,
        senderName: message.sender.name,
        conversationId: message.conversationId,
        replyTo: message.replyTo ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          senderName: message.replyTo.sender.name
        } : null,
        createdAt: message.createdAt,
        isRead: message.isRead
      });

      // Send push notifications to offline users
      await this.sendNotificationsForMessage(message, conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: TypingData) {
    const { conversationId } = data;
    
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    
    this.typingUsers.get(conversationId)!.add(socket.userId!);
    
    // Broadcast typing indicator to other participants
    socket.to(conversationId).emit('user_typing', {
      conversationId,
      userId: socket.userId,
      userName: socket.userName,
      isTyping: true
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: TypingData) {
    const { conversationId } = data;
    
    if (this.typingUsers.has(conversationId)) {
      this.typingUsers.get(conversationId)!.delete(socket.userId!);
      
      if (this.typingUsers.get(conversationId)!.size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }
    
    // Broadcast typing stop to other participants
    socket.to(conversationId).emit('user_typing', {
      conversationId,
      userId: socket.userId,
      userName: socket.userName,
      isTyping: false
    });
  }

  private async handleMarkMessagesRead(
    socket: AuthenticatedSocket, 
    data: { conversationId: string; messageIds: string[] }
  ) {
    try {
      const { conversationId, messageIds } = data;

      // Update messages as read
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          conversationId,
          senderId: { not: socket.userId! } // Don't mark own messages as read
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Broadcast read receipts to conversation participants
      socket.to(conversationId).emit('messages_read', {
        conversationId,
        messageIds,
        readBy: {
          userId: socket.userId,
          userName: socket.userName,
          readAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  private handleFileUploadProgress(
    socket: AuthenticatedSocket,
    data: { conversationId: string; progress: number }
  ) {
    const { conversationId, progress } = data;
    
    // Broadcast upload progress to conversation participants
    socket.to(conversationId).emit('file_upload_progress', {
      conversationId,
      userId: socket.userId,
      userName: socket.userName,
      progress
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    console.log('Socket disconnected:', socket.id);

    if (socket.userId) {
      // Remove from connected users
      this.connectedUsers.delete(socket.userId);
      this.userSockets.delete(socket.id);

      // Clean up typing indicators
      for (const [conversationId, typingSet] of this.typingUsers.entries()) {
        if (typingSet.has(socket.userId)) {
          typingSet.delete(socket.userId);
          
          // Notify conversation that user stopped typing
          socket.to(conversationId).emit('user_typing', {
            conversationId,
            userId: socket.userId,
            userName: socket.userName,
            isTyping: false
          });

          if (typingSet.size === 0) {
            this.typingUsers.delete(conversationId);
          }
        }
      }

      // Broadcast user offline status
      this.broadcastUserStatus(socket.userId, 'offline');
    }
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    this.io.emit('user_status_changed', {
      userId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  private async sendNotificationsForMessage(message: any, conversationId: string) {
    try {
      // Get conversation participants
      const participants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: message.senderId }
        },
        include: {
          user: true
        }
      });

      // Send notifications to offline users
      for (const participant of participants) {
        if (!this.connectedUsers.has(participant.userId)) {
          // Create notification record
          await prisma.notification.create({
            data: {
              type: 'NEW_MESSAGE',
              title: 'New Message',
              message: `${message.sender.name}: ${message.content.substring(0, 100)}...`,
              data: {
                conversationId,
                messageId: message.id,
                senderId: message.senderId,
                senderName: message.sender.name
              },
              userId: participant.userId
            }
          });

          // Here you would integrate with push notification services
          // like Firebase Cloud Messaging, Apple Push Notifications, etc.
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  // Public methods for external use
  public sendMessageToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.userSockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    }
  }

  public sendMessageToConversation(conversationId: string, event: string, data: any) {
    this.io.to(conversationId).emit(event, data);
  }

  public getUserOnlineStatus(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getConnectedSocketsCount(): number {
    return this.connectedUsers.size;
  }
}

// Singleton instance
let chatService: ChatWebSocketService | null = null;

export function initializeChatWebSocket(server: HTTPServer): ChatWebSocketService {
  if (!chatService) {
    chatService = new ChatWebSocketService(server);
  }
  return chatService;
}

export function getChatWebSocketService(): ChatWebSocketService | null {
  return chatService;
}