'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  sendMessage: (type: string, data: any) => void;
  disconnect: () => void;
  reconnect: () => void;
  connectionCount: number;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const connect = useCallback(() => {
    if (!session?.user || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle system messages
          if (message.type === 'connection') {
            console.log('WebSocket connection acknowledged:', message.data);
          } else if (message.type === 'error') {
            console.error('WebSocket server error:', message.data);
            setError(message.data.message || 'Server error');
          } else {
            onMessage?.(message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        
        onDisconnect?.();

        // Attempt reconnection if enabled and not a clean close
        if (autoReconnect && 
            event.code !== 1000 && 
            reconnectAttemptsRef.current < maxReconnectAttempts) {
          
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
          console.log(`Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              reconnectAttemptsRef.current++;
              connect();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Failed to reconnect after maximum attempts');
        }
      };

      ws.onerror = (event) => {
        if (!mountedRef.current) return;
        
        console.error('WebSocket error:', event);
        setError('Connection error');
        onError?.(event);
      };

    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setIsConnecting(false);
      setError('Failed to create connection');
    }
  }, [session, onMessage, onConnect, onDisconnect, onError, autoReconnect, reconnectInterval, maxReconnectAttempts]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
      return true;
    } else {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect, disconnect]);

  // Connect when session is available
  useEffect(() => {
    if (session?.user) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [session, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    sendMessage,
    disconnect,
    reconnect,
    connectionCount,
    error
  };
}

// Specialized hook for chat functionality
export function useChatWebSocket() {
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, any>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const { isConnected, sendMessage, ...webSocket } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'new_message':
          setMessages(prev => [...prev, message.data]);
          break;
        
        case 'typing_indicator':
          const { senderId, senderName, isTyping, conversationId } = message.data;
          setTypingUsers(prev => {
            const updated = new Map(prev);
            if (isTyping) {
              updated.set(senderId, { name: senderName, conversationId });
            } else {
              updated.delete(senderId);
            }
            return updated;
          });
          break;
        
        case 'messages_seen':
          const { messageIds, seenBy, seenAt } = message.data;
          setMessages(prev => 
            prev.map(msg => 
              messageIds.includes(msg.id) 
                ? { ...msg, readAt: seenAt, readBy: seenBy }
                : msg
            )
          );
          break;
        
        case 'user_online':
          setOnlineUsers(prev => new Set(prev).add(message.data.userId));
          break;
        
        case 'user_offline':
          setOnlineUsers(prev => {
            const updated = new Set(prev);
            updated.delete(message.data.userId);
            return updated;
          });
          break;
      }
    }
  });

  const sendChatMessage = useCallback((content: string, receiverId: string, conversationId?: string) => {
    return sendMessage('message', { content, receiverId, conversationId });
  }, [sendMessage]);

  const sendTypingIndicator = useCallback((receiverId: string, isTyping: boolean, conversationId?: string) => {
    return sendMessage('typing', { receiverId, isTyping, conversationId });
  }, [sendMessage]);

  const markMessagesSeen = useCallback((messageIds: string[], conversationId?: string) => {
    return sendMessage('seen', { messageIds, conversationId });
  }, [sendMessage]);

  return {
    ...webSocket,
    isConnected,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
    sendChatMessage,
    sendTypingIndicator,
    markMessagesSeen
  };
}