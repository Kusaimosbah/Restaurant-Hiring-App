'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MobileLayout, TouchButton, MobileCard } from '@/components/mobile/MobileLayout';
import { usePWA } from '@/hooks/usePWA';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
  };
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  jobTitle?: string;
  applicationId?: string;
}

export function MobileMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { storeOfflineAction, isOnline } = usePWA();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markAsRead(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'POST',
      });
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const message = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await fetch(`/api/conversations/${selectedConversation}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          type: 'text',
        }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages(prev => [...prev, newMsg]);
        
        // Update conversation list
        setConversations(prev =>
          prev.map(conv =>
            conv.id === selectedConversation
              ? { ...conv, lastMessage: newMsg, updatedAt: new Date().toISOString() }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      if (!isOnline) {
        storeOfflineAction({
          type: 'SEND_MESSAGE',
          data: { conversationId: selectedConversation, content: message },
          timestamp: Date.now(),
        });
      }
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <MobileLayout title="Messages">
        <div className="p-4">
          <MessagesSkeleton />
        </div>
      </MobileLayout>
    );
  }

  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation);
    return (
      <MessageView
        conversation={conversation!}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={sendMessage}
        onBack={() => setSelectedConversation(null)}
        sending={sending}
        messagesEndRef={messagesEndRef}
      />
    );
  }

  return (
    <MobileLayout
      title="Messages"
      rightAction={
        <TouchButton
          variant="ghost"
          size="small"
          onClick={() => window.location.href = '/messages/new'}
        >
          ✏️
        </TouchButton>
      }
    >
      <div className="divide-y divide-gray-200">
        {conversations.length === 0 ? (
          <EmptyMessagesState />
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={() => setSelectedConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </MobileLayout>
  );
}

function ConversationItem({
  conversation,
  onClick,
}: {
  conversation: Conversation;
  onClick: () => void;
}) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const otherParticipant = conversation.participants.find(p => p.role !== 'employer');

  return (
    <div
      onClick={onClick}
      className="p-4 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {otherParticipant?.avatar ? (
            <img
              src={otherParticipant.avatar}
              alt={otherParticipant.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-lg">
                {otherParticipant?.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Unread indicator */}
          {conversation.unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">
              {otherParticipant?.name}
            </h3>
            <span className="text-xs text-gray-500">
              {formatTimestamp(conversation.updatedAt)}
            </span>
          </div>
          
          {conversation.jobTitle && (
            <p className="text-sm text-blue-600 truncate">
              {conversation.jobTitle}
            </p>
          )}
          
          {conversation.lastMessage && (
            <p className={`text-sm mt-1 truncate ${
              conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
            }`}>
              {conversation.lastMessage.type === 'image' ? '📷 Photo' :
               conversation.lastMessage.type === 'file' ? '📎 File' :
               conversation.lastMessage.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageView({
  conversation,
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  onBack,
  sending,
  messagesEndRef,
}: {
  conversation: Conversation;
  messages: Message[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  onSendMessage: () => void;
  onBack: () => void;
  sending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  const otherParticipant = conversation.participants.find(p => p.role !== 'employer');

  return (
    <MobileLayout
      title={otherParticipant?.name || 'Conversation'}
      showBackButton
      onBack={onBack}
      rightAction={
        <TouchButton
          variant="ghost"
          size="small"
          onClick={() => window.location.href = `/conversations/${conversation.id}/info`}
        >
          ℹ️
        </TouchButton>
      }
      showBottomNav={false}
    >
      <div className="flex flex-col h-full">
        {/* Job Context */}
        {conversation.jobTitle && (
          <div className="bg-blue-50 border-b border-blue-200 p-3">
            <div className="flex items-center text-sm text-blue-800">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
              </svg>
              Application for: {conversation.jobTitle}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  minHeight: '40px',
                  maxHeight: '120px',
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onSendMessage();
                  }
                }}
              />
            </div>
            <TouchButton
              variant="primary"
              size="medium"
              disabled={!newMessage.trim() || sending}
              onClick={onSendMessage}
              className="rounded-full w-10 h-10 p-0"
            >
              {sending ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </TouchButton>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isCurrentUser = message.senderId === 'current-user'; // Replace with actual user ID check
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (message.type === 'system') {
    return (
      <div className="text-center">
        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isCurrentUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-200 text-gray-900 rounded-bl-md'
          }`}
        >
          {message.type === 'image' && message.metadata?.imageUrl ? (
            <div className="space-y-2">
              <img
                src={message.metadata.imageUrl}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto"
              />
              {message.content && (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          ) : message.type === 'file' && message.metadata?.fileName ? (
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="font-medium">{message.metadata.fileName}</p>
                {message.metadata.fileSize && (
                  <p className="text-xs opacity-75">
                    {(message.metadata.fileSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        
        {/* Timestamp */}
        <p
          className={`text-xs text-gray-500 mt-1 ${
            isCurrentUser ? 'text-right' : 'text-left'
          }`}
        >
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function EmptyMessagesState() {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">💬</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
      <p className="text-gray-600 mb-6">Start a conversation with candidates</p>
      <TouchButton
        variant="primary"
        onClick={() => window.location.href = '/messages/new'}
      >
        Start Messaging
      </TouchButton>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="divide-y divide-gray-200">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-4 flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}