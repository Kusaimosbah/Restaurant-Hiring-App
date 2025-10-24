import { Server } from 'ws';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { IncomingMessage } from 'http';

interface WebSocketClient {
  ws: any;
  userId: string;
  sessionData: any;
}

interface WebSocketMessage {
  type: 'message' | 'typing' | 'seen' | 'notification';
  data: any;
}

class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private wss: Server | null = null;

  initialize(server: any) {
    this.wss = new Server({ 
      server,
      path: '/api/ws',
      verifyClient: async (info: { req: IncomingMessage }) => {
        try {
          // Verify authentication
          const session = await getServerSession(authOptions);
          return !!session?.user;
        } catch (error) {
          console.error('WebSocket auth verification failed:', error);
          return false;
        }
      }
    });

    this.wss.on('connection', async (ws, req) => {
      try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          ws.close(1008, 'Unauthorized');
          return;
        }

        const clientId = `${session.user.id}-${Date.now()}`;
        const client: WebSocketClient = {
          ws,
          userId: session.user.id,
          sessionData: session
        };

        this.clients.set(clientId, client);
        console.log(`WebSocket client connected: ${session.user.name} (${clientId})`);

        // Send connection acknowledgment
        ws.send(JSON.stringify({
          type: 'connection',
          data: { status: 'connected', userId: session.user.id }
        }));

        // Handle incoming messages
        ws.on('message', async (data) => {
          try {
            const message: WebSocketMessage = JSON.parse(data.toString());
            await this.handleMessage(clientId, message);
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Invalid message format' }
            }));
          }
        });

        // Handle disconnection
        ws.on('close', () => {
          this.clients.delete(clientId);
          console.log(`WebSocket client disconnected: ${clientId}`);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error(`WebSocket error for client ${clientId}:`, error);
          this.clients.delete(clientId);
        });

      } catch (error) {
        console.error('Error setting up WebSocket connection:', error);
        ws.close(1011, 'Server error');
      }
    });

    console.log('WebSocket server initialized');
  }

  private async handleMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'message':
        await this.handleChatMessage(client, message.data);
        break;
      case 'typing':
        await this.handleTypingIndicator(client, message.data);
        break;
      case 'seen':
        await this.handleMessageSeen(client, message.data);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private async handleChatMessage(sender: WebSocketClient, data: any) {
    try {
      const { content, receiverId, conversationId } = data;

      // Save message to database
      const message = await prisma.message.create({
        data: {
          content,
          senderId: sender.userId,
          receiverId,
          conversationId
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true }
          },
          receiver: {
            select: { id: true, name: true, role: true }
          }
        }
      });

      // Send to receiver in real-time
      this.sendToUser(receiverId, {
        type: 'new_message',
        data: message
      });

      // Acknowledge to sender
      sender.ws.send(JSON.stringify({
        type: 'message_sent',
        data: { messageId: message.id, status: 'delivered' }
      }));

    } catch (error) {
      console.error('Error handling chat message:', error);
      sender.ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to send message' }
      }));
    }
  }

  private async handleTypingIndicator(sender: WebSocketClient, data: any) {
    const { receiverId, isTyping, conversationId } = data;

    // Send typing indicator to receiver
    this.sendToUser(receiverId, {
      type: 'typing_indicator',
      data: {
        senderId: sender.userId,
        senderName: sender.sessionData.user.name,
        isTyping,
        conversationId
      }
    });
  }

  private async handleMessageSeen(sender: WebSocketClient, data: any) {
    try {
      const { messageIds, conversationId } = data;

      // Update message read status in database
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          receiverId: sender.userId
        },
        data: { readAt: new Date() }
      });

      // Notify sender that messages were seen
      const messages = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        select: { senderId: true }
      });

      const senderIds = [...new Set(messages.map(m => m.senderId))];
      senderIds.forEach(senderId => {
        this.sendToUser(senderId, {
          type: 'messages_seen',
          data: {
            messageIds,
            conversationId,
            seenBy: sender.userId,
            seenAt: new Date().toISOString()
          }
        });
      });

    } catch (error) {
      console.error('Error handling message seen:', error);
    }
  }

  // Send message to all connections for a specific user
  public sendToUser(userId: string, message: any) {
    const userClients = Array.from(this.clients.values()).filter(
      client => client.userId === userId
    );

    userClients.forEach(client => {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(JSON.stringify(message));
      }
    });

    return userClients.length > 0;
  }

  // Broadcast to all connected clients
  public broadcast(message: any) {
    this.clients.forEach(client => {
      if (client.ws.readyState === 1) { // WebSocket.OPEN
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Send notification to user
  public sendNotification(userId: string, notification: any) {
    this.sendToUser(userId, {
      type: 'notification',
      data: notification
    });
  }

  // Get connected users
  public getConnectedUsers(): string[] {
    return Array.from(new Set(
      Array.from(this.clients.values()).map(client => client.userId)
    ));
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return Array.from(this.clients.values()).some(
      client => client.userId === userId
    );
  }

  // Get connection count
  public getConnectionCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();

// Export types for use in other files
export type { WebSocketMessage, WebSocketClient };