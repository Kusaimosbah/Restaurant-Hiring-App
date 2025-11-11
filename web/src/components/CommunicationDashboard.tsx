'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import RealtimeMessaging from '@/components/RealtimeMessaging';
import VideoCall from '@/components/VideoCall';
import WebSocketService from '@/lib/services/WebSocketService';
import RealTimeNotificationService from '@/lib/services/RealTimeNotificationService';
import FileSharingService from '@/lib/services/FileSharingService';

interface CommunicationDashboardProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'employer' | 'worker';
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
    role?: string;
  }>;
  latestMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string;
    };
  };
  unreadCount: number;
  updatedAt: Date;
}

interface ActiveCall {
  id: string;
  conversationId: string;
  type: 'audio' | 'video' | 'screen';
  status: 'calling' | 'connected' | 'ended';
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: string;
  }>;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  readAt?: Date;
  createdAt: Date;
}

const CommunicationDashboard: React.FC<CommunicationDashboardProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
}) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'calls' | 'notifications'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize WebSocket service
        const wsService = WebSocketService.getInstance();
        if (!wsService.isSocketConnected()) {
          await wsService.initialize(
            {
              url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
            },
            {
              id: currentUserId,
              token: 'user_token', // Would get from auth
            }
          );
        }

        // Initialize notification service (placeholder)
        // const notificationService = new RealTimeNotificationService();
        // Would initialize with proper config

        setIsConnected(true);

        // Load initial data
        await Promise.all([
          loadConversations(),
          loadActiveCalls(),
          loadNotifications(),
        ]);

      } catch (error) {
        console.error('Failed to initialize communication services:', error);
      }
    };

    initializeServices();

    return () => {
      // Cleanup services (would implement proper cleanup)
      // const wsService = WebSocketService.getInstance();
      // wsService.cleanup();
    };
  }, [currentUserId]);

  // Setup real-time event listeners
  useEffect(() => {
    const wsService = WebSocketService.getInstance();
    // const notificationService = new RealTimeNotificationService();

    const handleNewMessage = (data: any) => {
      // Update conversation with new message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversationId
            ? {
                ...conv,
                latestMessage: data.message,
                unreadCount: conv.unreadCount + (data.message.senderId !== currentUserId ? 1 : 0),
                updatedAt: new Date(data.message.createdAt),
              }
            : conv
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );

      // Update total unread count
      if (data.message.senderId !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleIncomingCall = (data: any) => {
      setActiveCalls(prev => [...prev, data.call]);
      
      // Show call notification
      if (Notification.permission === 'granted') {
        new Notification(`Incoming ${data.call.type} call`, {
          body: `${data.initiator.name} is calling you`,
          icon: data.initiator.image,
        });
      }
    };

    const handleCallEnded = (data: any) => {
      setActiveCalls(prev => prev.filter(call => call.id !== data.callId));
      if (activeCall?.id === data.callId) {
        setActiveCall(null);
      }
    };

    const handleNewNotification = (data: any) => {
      setNotifications(prev => [data.notification, ...prev.slice(0, 49)]); // Keep last 50
    };

    const handleUserStatusUpdate = (data: any) => {
      // Update user status in conversations
      setConversations(prev =>
        prev.map(conv => ({
          ...conv,
          participants: conv.participants.map(p =>
            p.id === data.userId ? { ...p, status: data.status } : p
          ),
        }))
      );
    };

    // Register event listeners
    wsService.on('message:received', handleNewMessage);
    wsService.on('call:incoming', handleIncomingCall);
    wsService.on('call:ended', handleCallEnded);
    wsService.on('user:status-update', handleUserStatusUpdate);

    // notificationService.on('notification:received', handleNewNotification);

    return () => {
      wsService.off('message:received', handleNewMessage);
      wsService.off('call:incoming', handleIncomingCall);
      wsService.off('call:ended', handleCallEnded);
      wsService.off('user:status-update', handleUserStatusUpdate);
      
      // notificationService.off('notification:received', handleNewNotification);
    };
  }, [currentUserId, activeCall]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        
        // Calculate total unread count
        const total = data.conversations?.reduce((sum: number, conv: Conversation) => 
          sum + conv.unreadCount, 0) || 0;
        setUnreadCount(total);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadActiveCalls = async () => {
    try {
      const response = await fetch('/api/calls?status=active');
      if (response.ok) {
        const data = await response.json();
        setActiveCalls(data.calls || []);
      }
    } catch (error) {
      console.error('Failed to load active calls:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/history?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleCreateConversation = async (participantIds: string[]) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds,
          type: participantIds.length === 1 ? 'direct' : 'group',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(prev => [data.conversation, ...prev]);
        setSelectedConversation(data.conversation.id);
        setShowNewConversation(false);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, readAt: new Date() }))
        );
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const getFilteredConversations = () => {
    if (!searchQuery) return conversations;
    
    return conversations.filter(conv =>
      conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participants.some(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  // If in active call, show call interface
  if (activeCall) {
    return (
      <VideoCall
        conversationId={activeCall.conversationId}
        currentUserId={currentUserId}
        participants={activeCall.participants}
        onCallEnd={() => setActiveCall(null)}
      />
    );
  }

  // If conversation selected, show messaging interface
  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (conversation) {
      return (
        <div className="h-screen flex flex-col">
          <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setSelectedConversation(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back
              </Button>
              <h2 className="font-medium">
                {conversation.title || 
                 conversation.participants
                   .filter(p => p.id !== currentUserId)
                   .map(p => p.name)
                   .join(', ')
                }
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  // Start audio call
                  const call: ActiveCall = {
                    id: 'temp-call',
                    conversationId: conversation.id,
                    type: 'audio',
                    status: 'calling',
                    participants: conversation.participants.map(p => ({
                      ...p,
                      status: p.status || 'offline',
                    })),
                  };
                  setActiveCall(call);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
              >
                📞
              </Button>
              <Button
                onClick={() => {
                  // Start video call
                  const call: ActiveCall = {
                    id: 'temp-call',
                    conversationId: conversation.id,
                    type: 'video',
                    status: 'calling',
                    participants: conversation.participants.map(p => ({
                      ...p,
                      status: p.status || 'offline',
                    })),
                  };
                  setActiveCall(call);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
              >
                📹
              </Button>
            </div>
          </div>
          
          <RealtimeMessaging
            conversationId={conversation.id}
            currentUserId={currentUserId}
            participants={conversation.participants}
          />
        </div>
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
            <p className="text-gray-600">
              {isConnected ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Connecting...
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {currentUserRole === 'employer' && (
              <Button
                onClick={() => setShowNewConversation(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                New Conversation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'conversations'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Conversations
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'calls'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Calls
          {activeCalls.length > 0 && (
            <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
              {activeCalls.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'notifications'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Notifications
          {notifications.filter(n => !n.readAt).length > 0 && (
            <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
              {notifications.filter(n => !n.readAt).length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'conversations' && (
        <div>
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Conversations list */}
          <div className="grid gap-4">
            {getFilteredConversations().map((conversation) => (
              <Card
                key={conversation.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="flex -space-x-2">
                    {conversation.participants.slice(0, 3).map((participant) => (
                      <div
                        key={participant.id}
                        className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-sm relative"
                      >
                        {participant.avatar ? (
                          <img
                            src={participant.avatar}
                            alt={participant.name}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          participant.name.charAt(0).toUpperCase()
                        )}
                        
                        {participant.status === 'online' && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.title || 
                         conversation.participants
                           .filter(p => p.id !== currentUserId)
                           .map(p => p.name)
                           .join(', ')
                        }
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.updatedAt)}
                      </span>
                    </div>
                    
                    {conversation.latestMessage && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        <span className="font-medium">
                          {conversation.latestMessage.sender.id === currentUserId 
                            ? 'You' 
                            : conversation.latestMessage.sender.name
                          }:
                        </span>{' '}
                        {conversation.latestMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {conversation.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {getFilteredConversations().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calls' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Active Calls</h2>
          </div>

          <div className="grid gap-4">
            {activeCalls.map((call) => (
              <Card key={call.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {call.type.charAt(0).toUpperCase() + call.type.slice(1)} Call
                    </h3>
                    <p className="text-sm text-gray-600">
                      {call.participants.length} participants • {call.status}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setActiveCall(call)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Join Call
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {activeCalls.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No active calls
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Notifications</h2>
            {notifications.some(n => !n.readAt) && (
              <Button
                onClick={handleMarkAllNotificationsRead}
                className="text-sm bg-gray-600 hover:bg-gray-700"
              >
                Mark All Read
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 ${!notification.readAt ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  
                  {!notification.readAt && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              </Card>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationDashboard;