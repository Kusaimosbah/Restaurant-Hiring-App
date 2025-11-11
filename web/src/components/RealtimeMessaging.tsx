'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import WebSocketService, { MessageData, type TypingIndicator, ConversationThread } from '@/lib/services/WebSocketService';
import RealTimeNotificationService from '@/lib/services/RealTimeNotificationService';
import FileSharingService, { FileMetadata } from '@/lib/services/FileSharingService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MessagingProps {
  currentUserId: string;
  conversationId: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
  }>;
  onClose?: () => void;
}

interface TypingState {
  [userId: string]: {
    isTyping: boolean;
    userName: string;
    timeout?: ReturnType<typeof setTimeout>;
  };
}

interface MessageBubbleProps {
  message: MessageData;
  isOwn: boolean;
  participant?: MessagingProps['participants'][0];
  onReply?: (messageId: string) => void;
  onEdit?: (message: MessageData) => void;
  onDelete?: (messageId: string) => void;
  onFileDownload?: (fileId: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  participant,
  onReply,
  onEdit,
  onDelete,
  onFileDownload,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleEdit = () => {
    if (onEdit && editedContent.trim() !== message.content) {
      onEdit({
        ...message,
        content: editedContent.trim(),
        edited: true,
        editedAt: new Date(),
      });
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(message.content);
    }
  };

  const renderMessageContent = () => {
    if (message.type === 'file') {
      const fileData = message.metadata?.file as FileMetadata;
      if (!fileData) return <span className="text-gray-500">File attachment</span>;

      return (
        <div className="bg-gray-50 p-3 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {fileData.mimeType.startsWith('image/') ? (
                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                  📷
                </div>
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                  📄
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileData.originalName}
              </p>
              <p className="text-xs text-gray-500">
                {(fileData.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              onClick={() => onFileDownload?.(fileData.id)}
              className="text-xs bg-blue-600 hover:bg-blue-700"
            >
              Download
            </Button>
          </div>
        </div>
      );
    }

    if (isEditing) {
      return (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleEdit}
          className="w-full p-2 border rounded resize-none"
          rows={3}
          autoFocus
        />
      );
    }

    return (
      <div className="whitespace-pre-wrap break-words">
        {message.content}
        {message.edited && (
          <span className="text-xs text-gray-400 ml-2">(edited)</span>
        )}
      </div>
    );
  };

  const getStatusColor = (status: MessageData['status']) => {
    switch (status) {
      case 'sending': return 'text-gray-400';
      case 'sent': return 'text-gray-500';
      case 'delivered': return 'text-blue-500';
      case 'read': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: MessageData['status']) => {
    switch (status) {
      case 'sending': return '⏳';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-900 rounded-bl-none'
          }`}
        >
          {/* Reply indicator */}
          {message.replyTo && (
            <div className="text-xs opacity-75 mb-1 pl-2 border-l-2 border-current">
              Replying to message...
            </div>
          )}

          {/* Message content */}
          {renderMessageContent()}

          {/* Message info */}
          <div className={`flex items-center justify-between mt-1 text-xs ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.timestamp)}</span>
            {isOwn && (
              <span className={getStatusColor(message.status)}>
                {getStatusIcon(message.status)}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex space-x-1 mt-1 justify-end">
            <Button
              onClick={() => onReply?.(message.id)}
              className="text-xs bg-gray-500 hover:bg-gray-600 px-2 py-1"
            >
              Reply
            </Button>
            {isOwn && message.type === 'text' && (
              <Button
                onClick={() => setIsEditing(true)}
                className="text-xs bg-gray-500 hover:bg-gray-600 px-2 py-1"
              >
                Edit
              </Button>
            )}
            {isOwn && (
              <Button
                onClick={() => onDelete?.(message.id)}
                className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Avatar */}
      {!isOwn && (
        <div className="order-1 mr-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
            {participant?.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-full h-full rounded-full"
              />
            ) : (
              participant?.name?.charAt(0).toUpperCase() || '?'
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TypingIndicator: React.FC<{ typingUsers: TypingState }> = ({ typingUsers }) => {
  const typingUserNames = Object.values(typingUsers)
    .filter(user => user.isTyping)
    .map(user => user.userName);

  if (typingUserNames.length === 0) return null;

  const formatTypingText = () => {
    if (typingUserNames.length === 1) {
      return `${typingUserNames[0]} is typing...`;
    } else if (typingUserNames.length === 2) {
      return `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`;
    } else {
      return `${typingUserNames.length} people are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-gray-500 text-sm">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span>{formatTypingText()}</span>
    </div>
  );
};

const RealtimeMessaging: React.FC<MessagingProps> = ({
  currentUserId,
  conversationId,
  participants,
  onClose,
}) => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [conversation, setConversation] = useState<ConversationThread | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
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

        // Join conversation room
        wsService.joinConversation(conversationId);
        setIsConnected(true);

        // Load cached messages
        const cachedMessages = await wsService.getCachedMessages(conversationId);
        setMessages(cachedMessages);

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    initializeWebSocket();

    return () => {
      const wsService = WebSocketService.getInstance();
      wsService.leaveConversation(conversationId);
    };
  }, [currentUserId, conversationId]);

  // Setup event listeners
  useEffect(() => {
    const wsService = WebSocketService.getInstance();

    const handleMessageReceived = (message: MessageData) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [...prev, message].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });

        // Mark as read if message is visible
        setTimeout(() => {
          wsService.markMessageAsRead(message.id, conversationId);
        }, 1000);
      }
    };

    const handleMessageStatus = (data: { messageId: string; status: MessageData['status'] }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, status: data.status }
          : msg
      ));
    };

    const handleTypingStart = (data: TypingIndicator) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        const participant = participants.find(p => p.id === data.userId);
        
        setTypingUsers(prev => ({
          ...prev,
          [data.userId]: {
            isTyping: true,
            userName: participant?.name || 'Unknown',
            timeout: setTimeout(() => {
              setTypingUsers(current => ({
                ...current,
                [data.userId]: { ...current[data.userId], isTyping: false }
              }));
            }, 3000)
          }
        }));
      }
    };

    const handleTypingStop = (data: TypingIndicator) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          const updated = { ...prev };
          if (updated[data.userId]?.timeout) {
            clearTimeout(updated[data.userId].timeout);
          }
          updated[data.userId] = { ...updated[data.userId], isTyping: false };
          return updated;
        });
      }
    };

    const handleConnectionStatus = (connected: boolean) => {
      setIsConnected(connected);
    };

    // Register event listeners
    wsService.on('message:received', handleMessageReceived);
    wsService.on('message:status', handleMessageStatus);
    wsService.on('typing:start', handleTypingStart);
    wsService.on('typing:stop', handleTypingStop);
    wsService.on('connection:connected', () => handleConnectionStatus(true));
    wsService.on('connection:disconnected', () => handleConnectionStatus(false));

    return () => {
      // Clean up event listeners
      wsService.off('message:received', handleMessageReceived);
      wsService.off('message:status', handleMessageStatus);
      wsService.off('typing:start', handleTypingStart);
      wsService.off('typing:stop', handleTypingStop);
      wsService.off('connection:connected', () => handleConnectionStatus(true));
      wsService.off('connection:disconnected', () => handleConnectionStatus(false));
    };
  }, [conversationId, currentUserId, participants]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    const wsService = WebSocketService.getInstance();
    
    try {
      const messageId = await wsService.sendMessage({
        conversationId,
        senderId: currentUserId,
        recipientId: participants.find(p => p.id !== currentUserId)?.id,
        content: newMessage.trim(),
        type: 'text',
        replyTo: replyingTo,
        encrypted: conversation?.settings.encryptionEnabled || false,
      });

      // Add to local state immediately
      const tempMessage: MessageData = {
        id: messageId,
        conversationId,
        senderId: currentUserId,
        content: newMessage.trim(),
        type: 'text',
        timestamp: new Date(),
        status: 'sending',
        replyTo: replyingTo,
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setReplyingTo(null);

      // Stop typing indicator
      wsService.stopTyping(conversationId);

    } catch (error) {
      console.error('Failed to send message:', error);
      // Could show error notification
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);

    // Handle typing indicators
    const wsService = WebSocketService.getInstance();
    
    if (value.trim()) {
      wsService.startTyping(conversationId);
      
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        wsService.stopTyping(conversationId);
      }, 1000);
    } else {
      wsService.stopTyping(conversationId);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !isConnected) return;

    setIsUploading(true);
    const wsService = WebSocketService.getInstance();

    try {
      for (const file of Array.from(files)) {
        // Upload file
        const fileMetadata = await FileSharingService.uploadFile(
          file,
          {
            conversationId,
            description: `Shared in conversation`,
          },
          (progress) => {
            console.log(`Upload progress: ${progress.percentage}%`);
          }
        );

        // Send file message
        await wsService.sendMessage({
          conversationId,
          senderId: currentUserId,
          recipientId: participants.find(p => p.id !== currentUserId)?.id,
          content: `Shared file: ${fileMetadata.originalName}`,
          type: 'file',
          metadata: { file: fileMetadata },
        });
      }
    } catch (error) {
      console.error('File upload failed:', error);
      // Could show error notification
    } finally {
      setIsUploading(false);
    }
  };

  const handleReply = (messageId: string) => {
    setReplyingTo(messageId);
    messageInputRef.current?.focus();
  };

  const handleEdit = async (message: MessageData) => {
    // In a real implementation, this would send an edit message through WebSocket
    setMessages(prev => prev.map(m => 
      m.id === message.id ? message : m
    ));
  };

  const handleDelete = async (messageId: string) => {
    // In a real implementation, this would send a delete message through WebSocket
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleFileDownload = async (fileId: string) => {
    try {
      const result = await FileSharingService.downloadFile(fileId, currentUserId);
      
      // Create download link
      const blob = new Blob([new Uint8Array(result.buffer)]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('File download failed:', error);
    }
  };

  const getParticipantById = (userId: string) => {
    return participants.find(p => p.id === userId);
  };

  return (
    <Card className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            {participants.slice(0, 3).map((participant) => (
              <div
                key={participant.id}
                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-sm relative"
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
                
                {/* Online status indicator */}
                {participant.status === 'online' && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
            ))}
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">
              {participants.length > 2
                ? `Group Chat (${participants.length})`
                : participants.find(p => p.id !== currentUserId)?.name || 'Chat'
              }
            </h3>
            <p className="text-sm text-gray-500">
              {isConnected ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                  Disconnected
                </span>
              )}
            </p>
          </div>
        </div>

        {onClose && (
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              participant={getParticipantById(message.senderId)}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onFileDownload={handleFileDownload}
            />
          ))
        )}
        
        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Replying to message
            </span>
            <Button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={!isConnected || isUploading}
            className="bg-gray-500 hover:bg-gray-600 p-2"
          >
            {isUploading ? '⏳' : '📎'}
          </Button>

          {/* Message input */}
          <div className="flex-1">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
              disabled={!isConnected}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="bg-blue-600 hover:bg-blue-700 p-3"
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RealtimeMessaging;